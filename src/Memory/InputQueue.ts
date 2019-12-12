/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import { CLDebug, DebugType } from '../CLDebug'
import InProcessMessageState from './InProcessMessageState'

// Delay after which we assume something went wrong in processing message
const MINUTE = 60000
const MESSAGE_TIMEOUT = MINUTE * 2

export interface QueuedInput {
    conversationId: string
    activityId: string
    timestamp: number
    callback: Function
}

/**
 * Used to queue up multiple user inputs when then come in a row so they can be handled sequentially
 */
export class InputQueue {

    // TODO: ADO 2412
    // In-memory store may result in out of order or dropped messages for a multi-host bot
    private static inputQueues: { [key: string]: QueuedInput[] } = {}

    /**
     * 
     * @param inProcessMessageState Store for mutex
     * @param activity Input that needs to be handled
     * @param callback To be called when input is ready to be handled
     */
    public static async AddInput(inProcessMessageState: InProcessMessageState, activity: BB.Activity, callback: Function): Promise<void> {
        if (!activity.id) {
            CLDebug.Error("InputQueue: Activity has no activityId")
            return
        }

        // Add to queue
        await InputQueue.InputQueueAdd(activity.conversation.id, activity.id, callback)

        // Process queue
        await InputQueue.InputQueueProcessNext(inProcessMessageState, activity.conversation.id)
    }

    // Add input to queue
    private static async InputQueueAdd(conversationId: string, activityId: string, callback: Function): Promise<void> {
        const now = new Date().getTime()
        const queuedInput: QueuedInput = {
            conversationId,
            activityId,
            timestamp: now,
            callback,
        }

        if (!this.inputQueues[conversationId]) {
            this.inputQueues[conversationId] = []
        }
        this.inputQueues[conversationId].push(queuedInput)
        this.log(`ADD QUEUE`, conversationId, queuedInput.activityId)
    }

    private static hasExpired(queuedInput: QueuedInput): boolean {
        const now = new Date().getTime()
        const age = now - queuedInput.timestamp
        return (age > MESSAGE_TIMEOUT)
    }

    // Process next input
    private static async InputQueueProcessNext(inProcessMessageState: InProcessMessageState, conversationId: string): Promise<void> {

        // Get current input being processed (mutex)
        let inputInProcess = await inProcessMessageState.get<QueuedInput>()

        // If input is being processed (mutex is set), check if it has expired
        if (inputInProcess) {
            if (this.hasExpired(inputInProcess)) {
                // Item in mutex has expired
                this.log(`EXPIRED U`, conversationId, inputInProcess.activityId)

                // Clear the input mutex
                await inProcessMessageState.remove()

                // Process the next input
                await InputQueue.InputQueueProcessNext(inProcessMessageState, conversationId)
            }
        }
        // Otherwise process the next one
        else if (this.inputQueues[conversationId]) {
            const inputToProcess = this.inputQueues[conversationId].shift()

            if (inputToProcess) {
                // Skip to the next if it has expired
                if (this.hasExpired(inputToProcess)) {
                    // Item in queue has expired
                    this.log(`EXPIRED Q`, conversationId, inputToProcess.activityId)

                    // Call the callback with failure
                    inputToProcess.callback(false, inputToProcess.activityId)

                    // Process the next input
                    await InputQueue.InputQueueProcessNext(inProcessMessageState, conversationId)
                }
                else {
                    // Set the input currently being processed (mutex)
                    await inProcessMessageState.set(inputToProcess)

                    // Fire the callback with success to start processing
                    this.log(`CALLBACK `, conversationId, inputToProcess.activityId)
                    inputToProcess.callback(false, inputToProcess.activityId)
                }
            }
            else {
                // Queue is empty
                this.log(`FIN QUEUE`, conversationId)
                delete this.inputQueues[conversationId]
            }
        }
    }

    // To be called when an input is done being processeed
    public static async MessageHandled(inProcessMessageState: InProcessMessageState, conversationId: string, activity?: BB.Activity): Promise<void> {

        // Remove mutex
        let processedInput = await inProcessMessageState.remove<QueuedInput>()

        // When response is pre-empted by an error message, no activity will be passed
        if (!activity) {
            CLDebug.Log(`HANDLE-PREEMPTIVE`, DebugType.MessageQueue)
        }
        else if (!processedInput) {
            // Handle called when no input being processed
            this.log(`NO  MUTEX`, conversationId, activity.id)
        }
        else if (processedInput.activityId !== activity.id) {
            CLDebug.Error("Input Queue: Handle called for different input than one being processed")
        }
        else {
            this.log(`HANDLED  `, conversationId, processedInput.activityId)
        }

        // Process next input in the queue
        await InputQueue.InputQueueProcessNext(inProcessMessageState, conversationId)
    }

    private static log(prefix: string, conversationId: string, activityId?: string): void {
        const queue = this.inputQueues[conversationId] ? this.inputQueues[conversationId].map(qi => qi.activityId.substr(0, 4)).join(" ") : "---"
        const activityText = activityId ? activityId.substr(0, 4) : "----"
        const debugString = `${prefix}| C: ${conversationId.substr(0, 3)} A: ${activityText} Q: ${queue}`
        CLDebug.Log(debugString, DebugType.MessageQueue)
    }
}


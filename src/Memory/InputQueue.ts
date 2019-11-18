/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import { CLDebug, DebugType } from '../CLDebug'
import InProcessMessageState from './InProcessMessageState'

const MESSAGE_TIMEOUT = 10000

export interface QueuedInput {
    activityId: string
    timestamp: number
    callback: Function
}

/**
 * Used to queue up multiple user inputs when then come in a row
 */
export class InputQueue {

    private static messageQueue: QueuedInput[] = [];

    public static async AddInput(inProcessMessageState: InProcessMessageState, activity: BB.Activity, conversationReference: Partial<BB.ConversationReference>, callback: Function): Promise<void> {
        if (!activity.id) {
            return
        }

        // Add to queue
        await InputQueue.InputQueueAdd(activity.id, callback)

        // Process queue
        await InputQueue.InputQueueProcess(inProcessMessageState)
    }

    // Add message to queue
    private static async InputQueueAdd(activityId: string, callback: Function): Promise<void> {
        const now = new Date().getTime()
        const queuedInput: QueuedInput = {
            activityId,
            timestamp: now,
            callback,
        }

        this.messageQueue.push(queuedInput)
        CLDebug.Log(`ADD QUEUE: ${activityId} ${this.messageQueue.length}`, DebugType.MessageQueue)
    }

    // Attempt to process next message in the queue
    private static async InputQueueProcess(inProcessMessageState: InProcessMessageState): Promise<void> {
        const now = new Date().getTime()
        const messageProcessing = await inProcessMessageState.get<QueuedInput>()

        // Is a message being processed
        if (messageProcessing) {

            // Remove if it's been expired
            const age = now - messageProcessing.timestamp

            if (age > MESSAGE_TIMEOUT) {
                CLDebug.Log(`EXPIRED: ${messageProcessing.activityId} ${this.messageQueue.length}`, DebugType.MessageQueue)
                await inProcessMessageState.remove()
                let queuedInput = this.messageQueue.find(mq => mq.activityId == messageProcessing.activityId)
                if (queuedInput) {
                    // Fire the callback with failure
                    queuedInput.callback(true, queuedInput.activityId)
                }
                else {
                    CLDebug.Log(`EXPIRE-WARNING: Couldn't find queued message`, DebugType.MessageQueue)
                }
                CLDebug.Log(`EXPIRE-POP: ${messageProcessing.activityId} ${this.messageQueue.length}`, DebugType.MessageQueue)
            }
        }

        // If no message being processed, try next message
        if (!messageProcessing) {
            await InputQueue.InputQueueProcessNext(inProcessMessageState)
        }
    }

    // Process next message
    private static async InputQueueProcessNext(inProcessMessageState: InProcessMessageState): Promise<void> {

        let curProcessing = await inProcessMessageState.get()

        // If no message being process, and item in queue, process teh next one
        if (!curProcessing && this.messageQueue.length > 0) {
            let messageProcessing = this.messageQueue.shift()

            if (messageProcessing) {
                await inProcessMessageState.set(messageProcessing)

                // Fire the callback with success
                CLDebug.Log(`PROCESS-CALLBACK: ${messageProcessing.activityId} ${this.messageQueue.length}`, DebugType.MessageQueue)
                messageProcessing.callback(false, messageProcessing.activityId)
            }
            else {
                CLDebug.Log(`PROCESS-ERR: No Message`, DebugType.MessageQueue)
            }
        }
        else {
            CLDebug.Log(`PROCESS-NEXT: Empty`, DebugType.MessageQueue)
        }
    }

    // Done processing message, remove from queue
    public static async MessageHandled(inProcessMessageState: InProcessMessageState, activityId: string | undefined): Promise<void> {

        if (!activityId) {
            CLDebug.Log(`HANDLE: Missing activity id`, DebugType.MessageQueue)
        }
        let messageProcessing = await inProcessMessageState.remove<QueuedInput>()

        // Check for consistency
        if (messageProcessing?.activityId === activityId) {
            CLDebug.Log(`HANDLE-POP: ${messageProcessing.activityId} ${this.messageQueue.length}`, DebugType.MessageQueue)
        }

        // Process next message in the queue
        await InputQueue.InputQueueProcessNext(inProcessMessageState)
    }
}

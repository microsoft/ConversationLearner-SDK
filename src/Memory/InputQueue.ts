/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import { BotState } from './BotState'
import { CLDebug } from '../CLDebug'

const MESSAGE_TIMEOUT = 10000

export interface QueuedInput {
    conversationId: string
    timestamp: number
    callback: Function
}

export class InputQueue {

    private static messageQueue: QueuedInput[] = [];

    public static async AddInput(botState: BotState, request: BB.Activity, conversationReference: Partial<BB.ConversationReference>, callback: Function) : Promise<any> {

        if (!request.id) {
            return null;    
        }

        // Add to queue
        await InputQueue.InputQueueAdd(request.id, callback);

        // Process queue
        InputQueue.InputQueueProcess(botState)
    }

    // Add message to queue
    private static async InputQueueAdd(conversationId: string, callback: Function): Promise<void> {
        const now = new Date().getTime();
        const queuedInput = 
        {
            conversationId: conversationId, 
            timestamp: now,
            callback: callback
        } as QueuedInput

        this.messageQueue.push(queuedInput);
        CLDebug.Log(`ADD QUEUE: ${conversationId} ${this.messageQueue.length}`,`messagequeue`)
    }

    // Attempt to process next message in the queue
    private static async InputQueueProcess(botState: BotState) : Promise<void> {
        const now = new Date().getTime();
        const messageProcessing = await botState.MessageProcessingAsync();

        // Is a message being processed
        if (messageProcessing) {

            // Remove if it's been expired
            const age = now - messageProcessing.timestamp;

            if (age > MESSAGE_TIMEOUT) {
                CLDebug.Log(`EXPIRED: ${messageProcessing.conversationId} ${this.messageQueue.length}`,`messagequeue`)
                botState.MessageProcessingPopAsync();
                let queuedInput = this.messageQueue.find(mq => mq.conversationId == messageProcessing.conversationId);
                if (queuedInput) {
                    // Fire the callback with failure
                    queuedInput.callback(true, queuedInput.conversationId);
                }
                else {
                    CLDebug.Log(`EXPIRE-WARNING: Couldn't find queud message`,`messagequeue`)
                }
                CLDebug.Log(`EXPIRE-POP: ${messageProcessing.conversationId} ${this.messageQueue.length}`,`messagequeue`)
            }
        }

        // If no message being processed, try next message
        if (!messageProcessing) {
           await InputQueue.InputQueueProcessNext(botState);
        }
    }

    // Process next message
    private static async InputQueueProcessNext(botState: BotState): Promise<void> {

        let messageProcessing = await botState.MessageProcessingAsync();

        // If no message being process, and item in queue, process teh next one
        if (!messageProcessing && this.messageQueue.length > 0) {
            messageProcessing = this.messageQueue.shift();
            await botState.SetMessageProcessingAsync(messageProcessing);

            // Fire the callback with success
            if (messageProcessing) {
                CLDebug.Log(`PROCESS-CALLBACK: ${messageProcessing.conversationId} ${this.messageQueue.length}`,`messagequeue`)
                messageProcessing.callback(false, messageProcessing.conversationId);
            }
            else {
                CLDebug.Log(`PROCESS-ERR: No Message`,`messagequeue`)
            }
        }
        else {
            CLDebug.Log(`PROCESS-NEXT: Empty`,`messagequeue`)
        }
    }

    // Done processing message, remove from queue
    public static async MessageHandled(botState: BotState, conversationId: string | undefined): Promise<void> {

        if (!conversationId)  {
            CLDebug.Log(`HANDLE: Missing conversation id`,`messagequeue`)
        }
        let messageProcessing = await botState.MessageProcessingPopAsync();

        // Check for consistency
        if (!messageProcessing || messageProcessing.conversationId != conversationId) {
            CLDebug.Log(`HANDLE: Unexpected conversation id`,`messagequeue`)
        }
        else {
            CLDebug.Log(`HANDLE-POP: ${messageProcessing.conversationId} ${this.messageQueue.length}`,`messagequeue`)
        }

        // Process next message in the queue
        await InputQueue.InputQueueProcessNext(botState);
    }
}

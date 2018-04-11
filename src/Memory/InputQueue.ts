import * as BB from 'botbuilder'
import { BotState } from './BotState'

const INTERVAL = 1000;

export interface QueuedInput {
    conversationId: string
    timestamp: number
}
export class InputQueue {

    public static async AddInput(botState: BotState, request: BB.Activity, conversationReference: BB.ConversationReference, callback: Function) : Promise<any> {

        if (!request.id) {
            return null;
            
        }

        const id = request.id;

        // Add to queue
        await botState.InputQueueAdd(id);

        // Can I go right away
        if (await botState.InputQueueCanPop(id)) {
            callback(false, id);
            return;
        }
        // Otherwise wait till first in queue
        let timerId = setInterval(
            async ()=> 
            { 
                console.log(`TRY: ${id}`)
                if (await botState.InputQueueCanPop(id)) {
                    clearInterval(timerId);
                    console.log(`SUCCESS: ${id}`)
                    callback(false, id);
                }
                else {
                    if (!await botState.InputQueueContains(id)) {
                        console.log(`REMOVED: ${id}`)
                        clearInterval(timerId);
                        callback(true, id);
                    }
                }
            } 
        , INTERVAL);
    }

    public static async AddInputOld(botState: BotState, request: BB.Activity, conversationReference: BB.ConversationReference, callback: Function) : Promise<any> {

        if (!request.conversation || !request.conversation.id) {
            return null;
            
        }
        const conversationId = request.conversation.id;

        // Add to queue
        await botState.InputQueueAdd(conversationId);

        // When I'm first in the queue, call the callback
        let timerId = setInterval(
            async ()=> 
            { 
                console.log(`TRY: ${conversationId}`)
                if (await botState.InputQueueCanPop(conversationId)) {
                    clearInterval(timerId);
                    console.log(`SUCCESS: ${conversationId}`)
                    return await callback(request, conversationReference);
                }
                else {
                    if (!await botState.InputQueueContains(conversationId)) {
                        console.log(`REVOVED: ${conversationId}`)
                        clearInterval(timerId);
                        // LARS - do i need to still call the callback?
                    }
                }
            } 
        , INTERVAL);
    }
/*
    public static async NextInput(botState: BotState, input: QueuedInput) : Promise<any> {

        console.log(`Callback: ${input.request.text}`)
        
        return response;
/*
        let inputQueue = await botState.messageQueue;
        console.log(`Pre-Pop: ${inputQueue.length}`)
        let nextInput = inputQueue.pop();
        await botState.SetInputQueueAsync(inputQueue);
        
        if (nextInput != undefined) {
            InputQueue.NextInput(botState, nextInput);
        }
}*/
}

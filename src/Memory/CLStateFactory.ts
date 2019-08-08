/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import { CLStorage } from './CLStorage'
import { CLState } from './CLState'
import * as Utils from '../Utils'
import { BotState } from './BotState';
import { EntityState } from './EntityState';
import { InProcessMessageState as MessageState } from './InProcessMessageState';
import { BrowserSlotState } from './BrowserSlot';

/**
 * Conversation Learner State Factory. 
 * 
 * Produces instances that all use the same BotBuilder storage provider.
 */
export class CLStateFactory {
    private bbStorage: BB.Storage

    constructor(bbStorage: BB.Storage = new BB.MemoryStorage()) {
        this.bbStorage = bbStorage
    }

    get(key: string, modelId: string = ''): CLState {
        const storage = new CLStorage(this.bbStorage)

        // Used for state shared through lifetime of conversation (conversationId)
        const keyPrefix = Utils.getSha256Hash(key)
        // Used for state shared between models within a conversation (Dispatcher has multiple models per conversation)
        const modelUniqueKeyPrefix = Utils.getSha256Hash(`${modelId}${key}`)

        const botState = new BotState(storage, (datakey) => `${modelUniqueKeyPrefix}_BOTSTATE_${datakey}`)
        const entityState = new EntityState(storage, () => `${modelUniqueKeyPrefix}_ENTITYSTATE`)
        const messageState = new MessageState(storage, () => `${keyPrefix}_MESSAGE_MUTEX`)
        const browserSlotState = new BrowserSlotState(storage, () => `BROWSER_SLOTS`)

        return new CLState(botState, entityState, messageState, browserSlotState)
    }

    getFromContext(turnContext: BB.TurnContext, modelId: string = ''): CLState {
        const conversationReference = BB.TurnContext.getConversationReference(turnContext.activity)
        const user = conversationReference.user

        let keyPrefix: string
        if (Utils.isRunningInClUI(turnContext)) {
            if (!user) {
                throw new Error(`Attempted to initialize state, but cannot get state key because current request did not have 'from'/user specified`)
            }
            if (!user.id) {
                throw new Error(`Attempted to initialize state, but user.id was not provided which is required for use as state key.`)
            }
            // User ID is the browser slot assigned to the UI
            keyPrefix = user.id
        } else {
            // CLState uses conversation Id as the prefix key for all the objects kept in CLStorage when bot is not running against CL UI
            if (!conversationReference.conversation || !conversationReference.conversation.id) {
                throw new Error(`Attempted to initialize state, but conversationReference.conversation.id was not provided which is required for use as state key.`)
            }
            keyPrefix = conversationReference.conversation.id
        }

        return this.get(keyPrefix, modelId)
    }
}

export default CLStateFactory
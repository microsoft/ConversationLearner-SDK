/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import * as CLM from '@conversationlearner/models'
import * as Utils from '../Utils'
import { CLDebug } from '../CLDebug'
import { EntityState } from './EntityState'
import { BotState } from './BotState'
import { InProcessMessageState as MessageState } from './InProcessMessageState'
import { CLStorage } from '../CLStorage';
import { BrowserSlotState } from './BrowserSlot';

/**
 * CLState is a container all states (BotState, EntityState, MessageState) and can be passed around as a single access point.
 * 
 * Responsibilities
 * - Single place to define keys for each of the sub states
 *  - MessageState is dynamic from conversation
 *  - Entity and Bot are dynamic from conversation model
 *  - BrowserSlot is static `BROWSER_SLOTS`
 * 
 * - Higher level state operations that span multiple types of state
 *   - Example: SetApp (which affects BotState, EntityState, and MessageState)
 */
export class CLState {
    private static bbStorage: BB.Storage
    public readonly turnContext?: BB.TurnContext

    BotState: BotState
    EntityState: EntityState
    MessageState: MessageState
    BrowserSlotState: BrowserSlotState

    private constructor(
        botState: BotState,
        entityState: EntityState,
        messageState: MessageState,
        browserSlotState: BrowserSlotState,
        turnContext?: BB.TurnContext) {

        this.BotState = botState
        this.EntityState = entityState
        this.MessageState = messageState
        this.BrowserSlotState = browserSlotState

        this.turnContext = turnContext
    }

    public static Init(storage?: BB.Storage): void {
        // If memory storage not defined use disk storage
        if (!storage) {
            CLDebug.Log('Storage not defined.  Defaulting to in-memory storage.')
            storage = new BB.MemoryStorage()
        }

        CLState.bbStorage = storage
    }

    public static Get(key: string, modelId: string = ''): CLState {
        const storage = new CLStorage(CLState.bbStorage)

        const keyPrefix = Utils.getSha256Hash(key)
        const modelUniqueKeyPrefix = Utils.getSha256Hash(`${modelId}${key}`)

        const botState = new BotState(storage, (datakey) => `${keyPrefix}_${datakey}`)
        const entityState = new EntityState(storage, () => `${keyPrefix}_BOTMEMORY`)
        const messageState = new MessageState(storage, () => `${modelUniqueKeyPrefix}_MESSAGE_MUTEX`)
        const browserSlotState = new BrowserSlotState(storage, () => `BROWSER_SLOTS`)

        return new CLState(botState, entityState, messageState, browserSlotState)
    }

    public static GetFromContext(turnContext: BB.TurnContext, modelId: string = ''): CLState {
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

        return CLState.Get(keyPrefix, modelId)
    }

    public async SetAppAsync(app: CLM.AppBase | null): Promise<void> {
        const curApp = await this.BotState.GetApp();
        await this.BotState.SetAppAsync(app)
        await this.MessageState.remove()

        if (!app || !curApp || curApp.appId !== app.appId) {
            await this.EntityState.ClearAsync()
        }
    }
}

/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import * as CLM from '@conversationlearner/models'
import { EntityState } from './EntityState'
import { BotState } from './BotState'
import { InProcessMessageState as MessageState } from './InProcessMessageState'
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
    public readonly turnContext?: BB.TurnContext

    BotState: BotState
    EntityState: EntityState
    MessageState: MessageState
    BrowserSlotState: BrowserSlotState

    constructor(
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

    public async SetAppAsync(app: CLM.AppBase | null): Promise<void> {
        const curApp = await this.BotState.GetApp();
        await this.BotState.SetAppAsync(app)
        await this.MessageState.remove()

        if (!app || !curApp || curApp.appId !== app.appId) {
            await this.EntityState.ClearAsync()
        }
    }
}

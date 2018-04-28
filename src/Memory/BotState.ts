/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import { ConversationLearner } from '../ConversationLearner'
import { CLMemory } from '../CLMemory'
import { AppBase } from 'conversationlearner-models'
import { QueuedInput } from './InputQueue';

export interface ConversationSession {
    sessionId: string | null
    conversationId: string | null
}

export interface SessionInfo {
    userName: string,
    userId: string,
    sessionId: string
}

export class BotState {
    private static _instance: BotState | null = null
    private static MEMKEY = 'BOTSTATE'
    public memory: CLMemory

    // Currently running application
    public app: AppBase | null = null

    // Currently active session
    public sessionId: string | null

    // Is current session a teach session
    public inTeach: boolean = false

    // Last time active session was used (in ticks)
    public lastActive: number

    // Conversation Id associated with this sesssion
    public conversationId: string | null

    // If session is continuation of times out session, what was the original sessionId
    public orgSessionId: string | null

    // True if onEndSession has been
    public onEndSessionCalled: boolean

    // BotBuilder conversation reference
    public conversationReference: Partial<BB.ConversationReference> | null = null

    // Which packages are active for editing
    public editingPackages: { [appId: string]: string };  // appId: packageId

    // Current message being processed
    public messageProcessing: QueuedInput | undefined

    private constructor(init?: Partial<BotState>) {
        (<any>Object).assign(this, init)
    }

    public static Get(clMemory: CLMemory): BotState {
        if (!BotState._instance) {
            BotState._instance = new BotState()
        }
        BotState._instance.memory = clMemory
        return BotState._instance
    }

    private async Init(): Promise<void> {
        if (!this.memory) {
            throw 'BotState called without initializing memory'
        }
        // Load bot state
        let data = await this.memory.GetAsync(BotState.MEMKEY)
        if (data) {
            this.Deserialize(data)
        } else {
            this._SetAppAsync(null)
        }
    }

    private Deserialize(text: string): void {
        if (!text) return
        let json = JSON.parse(text)
        this.app = json.app
        this.sessionId = json.sessionId
        this.inTeach = json.inTeach ? json.inTeach : false
        this.lastActive = json.lastActive,
        this.conversationId = json.conversationId,
        this.orgSessionId = json.orgSessionId,
        this.onEndSessionCalled = json.onEndSessionCalled ? json.onEndSessionCalled : false
        this.conversationReference = json.conversationReference,
        this.editingPackages = json.activeApps,
        this.messageProcessing = json.messageProcessing
    }

    private Serialize(): string {
        let jsonObj = {
            app: this.app,
            sessionId: this.sessionId,
            inTeach: this.inTeach ? this.inTeach : false,
            lastActive: this.lastActive,
            conversationId: this.conversationId,
            orgSessionId: this.orgSessionId,
            onEndSessionCalled: this.onEndSessionCalled ? this.onEndSessionCalled : false,
            conversationReference: this.conversationReference,
            activeApps: this.editingPackages,
            messageProcessing: this.messageProcessing
        }
        return JSON.stringify(jsonObj)
    }

    private async SetAsync(): Promise<void> {
        if (!this.memory) {
            throw 'BotState called without initialzing memory'
        }
        await this.memory.SetAsync(BotState.MEMKEY, this.Serialize())
    }

    // NOTE: CLMemory should be the only one to call this
    public async _SetAppAsync(app: AppBase | null): Promise<void> {
        this.app = app
        this.sessionId = null
        this.conversationId = null
        this.lastActive = 0
        this.orgSessionId = null
        this.onEndSessionCalled = false
        this.inTeach = false
        this.editingPackages = {}
        await this.SetAsync()
    }

    public async AppAsync(): Promise<AppBase | null> {
        try {
            await this.Init()
            return this.app
        } catch (err) {
            return null
        }
    }

    public async ConversationIdAsync(): Promise<string | null> {
        await this.Init()
        return this.conversationId
    }

    public async EditingPackagesAsync(): Promise<{ [appId: string]: string }> {
        await this.Init()
        return this.editingPackages
    }

    public async SetEditingPackageAsync(appId: string, packageId: string): Promise<{ [appId: string]: string }> {
        await this.Init()
        this.editingPackages[appId] = packageId;
        await this.SetAsync();
        return this.editingPackages;
    }

    public async EditingPackageAsync(appId: string): Promise<string> {
        await this.Init()
        return this.editingPackages[appId];
    }

    public async OrgSessionIdAsync(sessionId: string): Promise<string | null> {
        await this.Init()

        // If session expired and was replaced with a more recent one, return the new sessionId
        if (this.orgSessionId == sessionId) {
            return this.sessionId;
        }
        return sessionId;
    }

    public async OnEndSessionCalledAsync(): Promise<boolean> {
        await this.Init()
        return this.onEndSessionCalled;
    }

    public async SetOnEndSessionCalledAsync(called: boolean): Promise<void> {
        this.onEndSessionCalled = called;
        await this.SetAsync();
    }

    public async LastActiveAsync(): Promise<number> {
        await this.Init()
        return this.lastActive
    }

    public async SetLastActiveAsync(lastActive: number): Promise<void> {
        this.lastActive = lastActive;
        await this.SetAsync()
    }

    public async SessionIdAsync(conversationId: string): Promise<string | null> {
        await this.Init()

        // If convId not set yet, use the session and set it
        if (!this.conversationId) {
            this.conversationId = conversationId
            await this.SetAsync()
            return this.sessionId
        } 
        // If conversation Id matches return the sessionId
        else if (this.conversationId == conversationId) {
            return this.sessionId
        }
        // Otherwise session is for another conversation
        return null
    }

    public async SetSessionAsync(sessionId: string | null, conversationId: string | null, inTeach: boolean, orgSessionId: string | null): Promise<void> {
        await this.Init()
        this.sessionId = sessionId;
        // Only update original sessionId, if one hasn't already been set (could be multiple restarts)
        if (!this.orgSessionId) {
            this.orgSessionId = orgSessionId;
        }
        this.onEndSessionCalled = false;
        this.conversationId = conversationId;
        this.lastActive = new Date().getTime();
        this.inTeach = inTeach
        this.messageProcessing = undefined
        await this.SetAsync()
    }

    public async EndSessionAsync(): Promise<void> {
        this.sessionId = null;
        this.orgSessionId = null;
        this.onEndSessionCalled = false;
        this.conversationId = null;
        this.lastActive = 0;
        this.inTeach = false
        this.messageProcessing = undefined
        await this.SetAsync()
    }

    public async InTeachAsync(): Promise<boolean> {
        await this.Init()
        return this.inTeach
    }

    // For initial pro-active message need to build conversation reference from scratch
    public async CreateConversationReferenceAsync(userName: string, userId: string, conversationId: string): Promise<void> {
        let conversationReference = {
            user: { name: userName, id: userId },
            conversation: { id: conversationId },
            channelId: 'emulator',
            // TODO: Refactor away from static coupling.  BotState needs to have access to options object through constructor
            serviceUrl: ConversationLearner.options!.DOL_SERVICE_URL
        } as Partial<BB.ConversationReference>
        this.SetConversationReferenceAsync(conversationReference)
    }

    // --------------------------------------------
    public async SetConversationReferenceAsync(conversationReference: Partial<BB.ConversationReference>): Promise<void> {
        await this.Init()
        this.conversationReference = conversationReference
        await this.SetAsync()
    }

    public async ConversationReverenceAsync(): Promise<Partial<BB.ConversationReference> | null> {
        try {
            await this.Init()
            return this.conversationReference
        } catch (err) {
            return null
        }
    }
    
    // ------------------------------------------------
    public async MessageProcessingAsync(): Promise<QueuedInput | undefined> {
        await this.Init()
        return this.messageProcessing;
    }

    public async MessageProcessingPopAsync(): Promise<QueuedInput | undefined> {
        await this.Init()
        let popVal = this.messageProcessing;
        this.messageProcessing = undefined;
        await this.SetAsync();
        return popVal;
    }

    public async SetMessageProcessingAsync(queuedInput: QueuedInput | undefined): Promise<void> {
        await this.Init()
        this.messageProcessing = queuedInput
        await this.SetAsync()
    }

    // -------------------------------------------------------------------
    public async SessionInfoAsync(): Promise<SessionInfo> {
        await this.Init()
        return {
            userName : this.conversationReference && this.conversationReference.user && this.conversationReference.user.name,
            userId : this.conversationReference && this.conversationReference.user && this.conversationReference.user.id,
            sessionId: this.sessionId
        } as SessionInfo
    }
}

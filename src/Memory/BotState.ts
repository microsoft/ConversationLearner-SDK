/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import { ConversationLearner } from '../ConversationLearner'
import { CLMemory } from '../CLMemory'
import { AppBase } from '@conversationlearner/models'
import { QueuedInput } from './InputQueue';
import { SessionStartFlags } from '../CLRunner';

export interface ConversationSession {
    sessionId: string | null
    conversationId: string | null
}

export interface SessionInfo {
    userName: string,
    userId: string,
    logDialogId: string
}

// TODO - move to models
export interface ActiveApps {
    [appId: string]: string
}

export enum UIMode {
    TEACH = "TEACH",
    EDIT = "EDIT",
    NONE = "NONE"
}

export enum BotStateType {

    // Currently running application
    APP = 'APP',  //public app: AppBase | null = null

    // BotBuilder conversation reference
    CONVERSATION_REFERENCE = 'CONVERSATION_REFERENCE',

    // Which packages are active for editing
    EDITING_PACKAGE = 'EDITING_PACKAGE',

    // Is UI in Teach or Edit mode?
    UI_MODE = 'UI_MODE',

    // Last time active session was used (in ticks)
    LAST_ACTIVE = 'LAST_ACTIVE',

    // If session is a chat session what is logDialogId
    LOG_DIALOG_ID = 'LOG_DIALOG_ID',

    // Current message being processed
    MESSAGE_MUTEX = 'MESSAGE_MUTEX',

    // True if onEndSession needs to be called
    NEED_SESSIONEND_CALL = 'ON_ENDSESSION_CALLED',

    // Currently active session
    SESSION_ID = 'SESSION_ID'
}

export type ConvIdMapper = (ref: Partial<BB.ConversationReference> | null) => string | null

export class BotState {
    private static _instance: BotState | undefined
    private readonly conversationReferenceToConversationIdMapper: ConvIdMapper
    public memory: CLMemory | undefined

    private constructor(init?: Partial<BotState>,
        conversationReferenceToConvIdMapper: ConvIdMapper = BotState.DefaultConversationIdMapper) {
        Object.assign(this, init)
        this.conversationReferenceToConversationIdMapper = conversationReferenceToConvIdMapper
    }

    public static Get(clMemory: CLMemory, conversationReference: Partial<BB.ConversationReference> | null): BotState {
        if (!BotState._instance) {
            BotState._instance = new BotState()
        }
        BotState._instance.memory = clMemory
        // For API calls from training UI there is no conversationReference. 
        // Then we should use the cached conversationReference from CLMemory to send replies
        if (conversationReference) {
            BotState._instance.SetConversationReference(conversationReference)
        }
        return BotState._instance
    }

    private async GetStateAsync<T>(botStateType: BotStateType): Promise<T> {
        if (!this.memory) {
            throw new Error('BotState called without initializing memory')
        }

        try {
            let data = await this.memory.GetAsync(botStateType);
            return JSON.parse(data) as T;
        }
        catch {
            // If brand new use, need to initialize
            await this._SetAppAsync(null)
            let data = await this.memory.GetAsync(botStateType)
            return JSON.parse(data) as T;
        }
    }

    private async SetStateAsync<T>(botStateType: BotStateType, value: T): Promise<void> {
        if (!this.memory) {
            throw new Error('BotState called without initializing memory')
        }
        const json = JSON.stringify(value)
        await this.memory.SetAsync(botStateType, json)
    }

    // NOTE: CLMemory should be the only one to call this
    public async _SetAppAsync(app: AppBase | null): Promise<void> {
        await this.SetApp(app)
        await this.SetConversationReference(null)
        await this.SetLastActive(0);
        await this.SetMessageProcessing(null);
        await this.SetNeedSessionEndCall(false)
        await this.SetUIMode(UIMode.NONE)
        await this.SetSessionId(null)
        await this.SetLogDialogId(null);
        await this.ClearEditingPackageAsync();
    }

    // ------------------------------------------------
    //  APP
    // ------------------------------------------------
    public async GetApp(): Promise<AppBase | null> {
        try {
            return await this.GetStateAsync<AppBase | null>(BotStateType.APP)
        } catch (err) {
            return null
        }
    }

    public async SetApp(app: AppBase | null): Promise<void> {
        if (!app) {
            await this.SetStateAsync(BotStateType.APP, null)
        }
        else {
            // Store only needed data
            let smallApp = {
                appId: app.appId,
                appName: app.appName,
                livePackageId: app.livePackageId,
                devPackageId: app.devPackageId,
                metadata: {
                    isLoggingOn: app.metadata.isLoggingOn
                }
            }

            await this.SetStateAsync(BotStateType.APP, smallApp)
        }
    }

    // ------------------------------------------------
    //  EDITING_PACKAGE
    // ------------------------------------------------
    public async GetEditingPackages(): Promise<ActiveApps> {
        return await this.GetStateAsync<ActiveApps>(BotStateType.EDITING_PACKAGE) || {}
    }

    public async SetEditingPackage(appId: string, packageId: string): Promise<{ [appId: string]: string }> {
        let activeApps = await this.GetStateAsync<ActiveApps>(BotStateType.EDITING_PACKAGE) || {}
        activeApps[appId] = packageId;
        await this.SetStateAsync<ActiveApps>(BotStateType.EDITING_PACKAGE, activeApps);
        return activeApps;
    }

    public async GetEditingPackageForApp(appId: string): Promise<string> {
        let activeApps = await this.GetStateAsync<ActiveApps>(BotStateType.EDITING_PACKAGE) || {}
        return activeApps[appId];
    }

    public async ClearEditingPackageAsync(): Promise<void> {
        await this.SetStateAsync<ActiveApps>(BotStateType.EDITING_PACKAGE, {});
    }

    // ------------------------------------------------
    // NEED_SESSIONEND_CALL
    // ------------------------------------------------
    public async GetNeedSessionEndCall(): Promise<boolean> {
        const needed = await this.GetStateAsync<boolean>(BotStateType.NEED_SESSIONEND_CALL)
        return (needed ? needed : false);
    }

    public async SetNeedSessionEndCall(needed: boolean): Promise<void> {
        needed = needed ? needed : false;
        await this.SetStateAsync(BotStateType.NEED_SESSIONEND_CALL, needed)
    }

    // ------------------------------------------------
    // LAST_ACTIVE
    // ------------------------------------------------
    public async GetLastActive(): Promise<number> {
        return await this.GetStateAsync<number>(BotStateType.LAST_ACTIVE)
    }

    public async SetLastActive(lastActive: number): Promise<void> {
        await this.SetStateAsync(BotStateType.LAST_ACTIVE, lastActive)
    }

    // ------------------------------------------------
    // SESSION_ID
    // ------------------------------------------------
    public async GetSessionIdAndSetConversationId(conversationReference: Partial<BB.ConversationReference>): Promise<string | null> {

        let conversationId = this.conversationReferenceToConversationIdMapper(conversationReference)
        // If conversationId not set yet, use the session and set it
        let existingConversationId = await this.GetConversationId()
        if (!existingConversationId) {
            await this.SetConversationReference(conversationReference)
            return await this.GetStateAsync<string | null>(BotStateType.SESSION_ID)
        }
        // If conversation Id matches return the sessionId
        else if (existingConversationId === conversationId) {
            return await this.GetStateAsync<string | null>(BotStateType.SESSION_ID)
        }
        // Otherwise session is for another conversation
        return null
    }

    public async GetSessionIdAsync(): Promise<string | null> {
        return await this.GetStateAsync<string | null>(BotStateType.SESSION_ID)
    }

    public async InitSessionAsync(sessionId: string | null, logDialogId: string | null, conversationReference: Partial<BB.ConversationReference> | null, sessionStartFlags: SessionStartFlags): Promise<void> {
        await this.SetSessionId(sessionId);
        await this.SetLogDialogId(logDialogId)
        await this.SetNeedSessionEndCall(true)
        await this.SetConversationReference(conversationReference)
        await this.SetLastActive(new Date().getTime())
        await this.SetUIMode((sessionStartFlags & SessionStartFlags.IN_TEACH) > 0 ? UIMode.TEACH : UIMode.NONE)
        await this.SetMessageProcessing(null)
    }

    // End a session.
    public async EndSessionAsync(): Promise<void> {
        await this.SetSessionId(null);
        await this.SetLogDialogId(null);
        await this.SetConversationReference(null)
        await this.SetLastActive(0);
        await this.SetUIMode(UIMode.NONE);
        await this.SetMessageProcessing(null);
    }

    // ------------------------------------------------
    //  UI_MODE
    // ------------------------------------------------
    public async getUIMode(): Promise<UIMode> {
        const uiMode = await this.GetStateAsync<UIMode>(BotStateType.UI_MODE)
        return uiMode
    }

    public async SetUIMode(uiMode: UIMode): Promise<void> {
        await this.SetStateAsync(BotStateType.UI_MODE, uiMode)
    }

    // ------------------------------------------------
    //  CONVERSATION_REFERENCE
    // ------------------------------------------------
    public async GetConversationReverence(): Promise<Partial<BB.ConversationReference> | null> {
        return await this.GetStateAsync<BB.ConversationReference | null>(BotStateType.CONVERSATION_REFERENCE)
    }

    // ------------------------------------------------
    //  CONVERSATION_ID
    // ------------------------------------------------
    public async GetConversationId(): Promise<string | null> {
        const convRef = await this.GetConversationReverence()
        return this.conversationReferenceToConversationIdMapper(convRef)
    }

    // For initial pro-active message need to build conversation reference from scratch
    public async CreateConversationReference(userName: string, userId: string, conversationId: string): Promise<void> {
        let conversationReference = {
            user: { name: userName, id: userId },
            conversation: { id: conversationId },
            channelId: 'emulator',
            // TODO: Refactor away from static coupling.  BotState needs to have access to options object through constructor
            // tslint:disable-next-line:no-http-string
            serviceUrl: `http://127.0.0.1:${ConversationLearner.options!.botPort}`
        } as Partial<BB.ConversationReference>
        this.SetConversationReference(conversationReference)
    }

    // ------------------------------------------------
    //  LOG_DIALOG_ID
    // ------------------------------------------------
    public async GetLogDialogId(): Promise<string | null> {
        return await this.GetStateAsync<string | null>(BotStateType.LOG_DIALOG_ID)
    }

    public async SetLogDialogId(logDialogId: string | null): Promise<void> {
        await this.SetStateAsync(BotStateType.LOG_DIALOG_ID, logDialogId)
    }

    // ------------------------------------------------
    //  MESSAGE_MUTEX
    // ------------------------------------------------
    public async GetMessageProcessing(): Promise<QueuedInput | null> {
        return await this.GetStateAsync<QueuedInput>(BotStateType.MESSAGE_MUTEX)
    }

    public async MessageProcessingPopAsync(): Promise<QueuedInput | null> {
        let popVal = await this.GetStateAsync<QueuedInput>(BotStateType.MESSAGE_MUTEX)
        await this.SetStateAsync(BotStateType.MESSAGE_MUTEX, null);
        return popVal;
    }

    public async SetMessageProcessing(queuedInput: QueuedInput | null): Promise<void> {
        await this.SetStateAsync(BotStateType.MESSAGE_MUTEX, queuedInput)
    }

    // -------------------------------------------------------------------
    public async SessionInfoAsync(): Promise<SessionInfo> {
        const conversationReference = await this.GetConversationReverence();

        if (conversationReference && conversationReference.conversation) {
            return {
                userName: conversationReference.user && conversationReference.user.name,
                userId: conversationReference.user && conversationReference.user.id,
                logDialogId: await this.GetLogDialogId()
            } as SessionInfo
        }
        return {
            userName: '',
            userId: '',
            logDialogId: ''
        } as SessionInfo
    }

    private static DefaultConversationIdMapper: ConvIdMapper = ref => {
        if (ref && ref.conversation) {
            return ref.conversation.id
        }
        return null
    }

    private async SetConversationReference(conversationReference: Partial<BB.ConversationReference> | null): Promise<void> {
        await this.SetStateAsync(BotStateType.CONVERSATION_REFERENCE, conversationReference)
    }

    private async SetSessionId(sessionId: string | null): Promise<void> {
        await this.SetStateAsync(BotStateType.SESSION_ID, sessionId)
    }
}

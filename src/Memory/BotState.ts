/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import { ConversationLearner } from '../ConversationLearner'
import { CLStorage } from './CLStorage'
import { AppBase } from '@conversationlearner/models'
import { SessionStartFlags } from '../CLRunner'

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
    TEST = "TEST",
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

type GetKey = (datakey: string) => string
export type ConvIdMapper = (ref: Partial<BB.ConversationReference> | null) => string | null

export class BotState {
    private readonly storage: CLStorage
    private readonly getKey: GetKey
    private readonly conversationReferenceToConversationIdMapper: ConvIdMapper

    constructor(storage: CLStorage, getKey: GetKey, conversationReferenceToConvIdMapper: ConvIdMapper = BotState.DefaultConversationIdMapper) {
        this.storage = storage
        this.getKey = getKey
        this.conversationReferenceToConversationIdMapper = conversationReferenceToConvIdMapper
    }

    private async GetStateAsync<T>(botStateType: BotStateType): Promise<T> {
        const key = this.getKey(botStateType)

        try {
            let data = await this.storage.GetAsync(key)
            return JSON.parse(data) as T
        }
        catch {
            // If brand new use, need to initialize
            await this.SetAppAsync(null)
            let data = await this.storage.GetAsync(key)
            return JSON.parse(data) as T
        }
    }

    private async SetStateAsync<T>(botStateType: BotStateType, value: T): Promise<void> {
        const key = this.getKey(botStateType)
        const json = JSON.stringify(value)
        await this.storage.SetAsync(key, json)
    }

    public async SetAppAsync(app: AppBase | null): Promise<void> {
        await this.SetApp(app)
        await this.SetConversationReference(null)
        await this.SetLastActive(0)
        await this.SetNeedSessionEndCall(false)
        await this.SetUIMode(UIMode.NONE)
        await this.SetSessionId(null)
        await this.SetLogDialogId(null)
        await this.ClearEditingPackageAsync()
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
        return await this.GetStateAsync<ActiveApps>(BotStateType.EDITING_PACKAGE) ?? {}
    }

    public async SetEditingPackage(appId: string, packageId: string): Promise<{ [appId: string]: string }> {
        let activeApps = await this.GetStateAsync<ActiveApps>(BotStateType.EDITING_PACKAGE) ?? {}
        activeApps[appId] = packageId
        await this.SetStateAsync<ActiveApps>(BotStateType.EDITING_PACKAGE, activeApps)
        return activeApps
    }

    public async GetEditingPackageForApp(appId: string): Promise<string> {
        let activeApps = await this.GetStateAsync<ActiveApps>(BotStateType.EDITING_PACKAGE) ?? {}
        return activeApps[appId]
    }

    public async ClearEditingPackageAsync(): Promise<void> {
        await this.SetStateAsync<ActiveApps>(BotStateType.EDITING_PACKAGE, {})
    }

    // ------------------------------------------------
    // NEED_SESSIONEND_CALL
    // ------------------------------------------------
    public async GetNeedSessionEndCall(): Promise<boolean> {
        const needed = await this.GetStateAsync<boolean>(BotStateType.NEED_SESSIONEND_CALL)
        return (needed ? needed : false)
    }

    public async SetNeedSessionEndCall(needed: boolean): Promise<void> {
        needed = needed ? needed : false
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

        let uiMode: UIMode
        if ((sessionStartFlags & SessionStartFlags.IN_TEACH) > 0) {
            uiMode = UIMode.TEACH
        }
        else if ((sessionStartFlags & SessionStartFlags.IN_TEST) > 0) {
            uiMode = UIMode.TEST
        }
        else {
            uiMode = UIMode.NONE
        }

        await this.SetSessionId(sessionId)
        await this.SetLogDialogId(logDialogId)
        await this.SetNeedSessionEndCall(true)
        await this.SetConversationReference(conversationReference)
        await this.SetLastActive(new Date().getTime())
        await this.SetUIMode(uiMode)
    }

    // End a session.
    public async EndSessionAsync(): Promise<void> {
        await this.SetSessionId(null)
        await this.SetLogDialogId(null)
        await this.SetConversationReference(null)
        await this.SetLastActive(0)
        await this.SetUIMode(UIMode.NONE)
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
    public async GetConversationReference(): Promise<Partial<BB.ConversationReference> | null> {
        return await this.GetStateAsync<BB.ConversationReference | null>(BotStateType.CONVERSATION_REFERENCE)
    }

    // ------------------------------------------------
    //  CONVERSATION_ID
    // ------------------------------------------------
    public async GetConversationId(): Promise<string | null> {
        const convRef = await this.GetConversationReference()
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

    // -------------------------------------------------------------------
    public async SessionInfoAsync(): Promise<SessionInfo> {
        const conversationReference = await this.GetConversationReference()

        if (conversationReference?.conversation) {
            return {
                userName: conversationReference.user?.name,
                userId: conversationReference.user?.id,
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
        return ref?.conversation?.id ?? null
    }

    private async SetConversationReference(conversationReference: Partial<BB.ConversationReference> | null): Promise<void> {
        await this.SetStateAsync(BotStateType.CONVERSATION_REFERENCE, conversationReference)
    }

    private async SetSessionId(sessionId: string | null): Promise<void> {
        await this.SetStateAsync(BotStateType.SESSION_ID, sessionId)
    }
}

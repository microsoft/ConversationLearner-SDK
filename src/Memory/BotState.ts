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
    logDialogId: string
}

// TODO - move to models
export interface ActiveApps {
    [appId: string]: string 
}

export enum BotStateType {

    // Currently running application
    APP = 'APP',  //public app: AppBase | null = null
    
    // Conversation Id associated with this sesssion
    CONVERSTAION_ID = 'CONVERSATION_ID',

    // BotBuilder conversation reference
    CONVERSATION_REFERENCE = 'CONVERSATION_REFERENCE',

    // Which packages are active for editing
    EDITING_PACKAGE = 'EDITING_PACKAGE',
    
    // Is current session a teach session
    IN_TEACH = 'IN_TEACH', 

    // Last time active session was used (in ticks)
    LAST_ACTIVE = 'LAST_ACTIVE', 

    // If session is a chat session what is logDialogId
    LOG_DIALOG_ID = 'LOG_DIALOG_ID', 

    // Current message being processed
    MESSAGE_MUTEX = 'MESSAGE_MUTEX',

    // True if onEndSession has been
    ON_ENDSESSION_CALLED = 'ON_ENDSESSION_CALLED', 

    // If session is continuation of times out session, what was the original sessionId
    ORIG_SESSION = 'ORIG_SESSION',

    // Currently active session
    SESSION_ID = 'SESSION_ID'  
}

export class BotState {
    private static _instance: BotState | null = null
    public memory: CLMemory

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
            throw new Error('BotState called without initialzing memory')
        }
        const json = JSON.stringify(value) 
        await this.memory.SetAsync(botStateType, json)
    }

    // NOTE: CLMemory should be the only one to call this
    public async _SetAppAsync(app: AppBase | null): Promise<void> {
        await this.SetApp(app)
        await this.SetConversationId(null)
        await this.SetConversationReference(null)
        await this.SetLastActive(0);
        await this.SetMessageProcessing(null);
        await this.SetOrgSessionId(null)
        await this.SetOnEndSessionCalled(false)
        await this.SetInTeach(false)
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
                }}

            await this.SetStateAsync(BotStateType.APP, smallApp)
        }
    }

    // ------------------------------------------------
    //  CONVERSATION_ID
    // ------------------------------------------------
    public async GetConversationId(): Promise<string | null> {
        return await this.GetStateAsync<string | null>(BotStateType.CONVERSTAION_ID)
    }

    public async SetConversationId(conversationId : string | null): Promise<void> {
        await this.SetStateAsync(BotStateType.CONVERSTAION_ID, conversationId)
    }

    // ------------------------------------------------
    //  EDITING_PACKAGE
    // ------------------------------------------------
    public async GetEditingPackages(): Promise<ActiveApps> {
        return await this.GetStateAsync<ActiveApps>(BotStateType.EDITING_PACKAGE);
    }

    public async SetEditingPackage(appId: string, packageId: string): Promise<{ [appId: string]: string }> {
        let activeApps = await this.GetStateAsync<ActiveApps>(BotStateType.EDITING_PACKAGE);
        activeApps[appId] = packageId;
        await this.SetStateAsync<ActiveApps>(BotStateType.EDITING_PACKAGE, activeApps);
        return activeApps;
    }

    public async GetEditingPackageForApp(appId: string): Promise<string> {
        let activeApps = await this.GetStateAsync<ActiveApps>(BotStateType.EDITING_PACKAGE);
        return activeApps[appId];
    }

    public async ClearEditingPackageAsync(): Promise<void> {
        await this.SetStateAsync<ActiveApps>(BotStateType.EDITING_PACKAGE, {});
    }

    // ------------------------------------------------
    //  ORIG_SESSION
    // ------------------------------------------------
    public async OrgSessionIdAsync(sessionId: string): Promise<string | null> {
        const origSessionId = await this.GetStateAsync<string | null>(BotStateType.ORIG_SESSION)

        // If session expired and was replaced with a more recent one, return the new sessionId
        if (origSessionId === sessionId) {
            const curSessionId = await this.GetStateAsync<string | null>(BotStateType.SESSION_ID)
            return curSessionId;
        }
        return sessionId;
    }

    public async GetOrgSessionIdAsync(): Promise<string | null> {
        return await this.GetStateAsync<string|null>(BotStateType.ORIG_SESSION)
    }

    public async SetOrgSessionId(sessionId: string | null): Promise<void> {
        await this.SetStateAsync(BotStateType.ORIG_SESSION, sessionId)
    }

    // ------------------------------------------------
    // ON_ENDSESSION_CALLED
    // ------------------------------------------------
    public async GetEndSessionCalled(): Promise<boolean> {
        const called = await this.GetStateAsync<boolean>(BotStateType.ON_ENDSESSION_CALLED)
        return (called ? called : false);
    }

    public async SetOnEndSessionCalled(called: boolean): Promise<void> {
        called = called ? called : false;
        await this.SetStateAsync(BotStateType.ON_ENDSESSION_CALLED, called)
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
    public async GetSessionId(conversationId: string): Promise<string | null> {

        // If convId not set yet, use the session and set it
        let existingConversationId = await this.GetConversationId();
        if (!existingConversationId) {
            await this.SetConversationId(conversationId)
            return await this.GetStateAsync<string | null>(BotStateType.SESSION_ID)
        } 
        // If conversation Id matches return the sessionId
        else if (existingConversationId == conversationId) {
            return await this.GetStateAsync<string | null>(BotStateType.SESSION_ID)
        }
        // Otherwise session is for another conversation
        return null
    }

    public async SetSessionId(sessionId: string | null): Promise<void> {
        await this.SetStateAsync(BotStateType.SESSION_ID, sessionId)
    }

    public async SetSessionAsync(sessionId: string | null, logDialogId: string | null, conversationId: string | null, inTeach: boolean, orgSessionId: string | null): Promise<void> {
        await this.SetSessionId(sessionId);
        await this.SetLogDialogId(logDialogId);

        // Only update original sessionId, if one hasn't already been set (could be multiple restarts)
        let existingOrigSesionId = await this.GetOrgSessionIdAsync()
        if (!existingOrigSesionId) {
            await this.SetOrgSessionId(orgSessionId)
        }
        await this.SetOnEndSessionCalled(false)
        await this.SetConversationId(conversationId)
        await this.SetLastActive(new Date().getTime())
        await this.SetInTeach(inTeach)
        await this.SetMessageProcessing(null)
    }

    public async EndSessionAsync(): Promise<void> {
        await this.SetSessionId(null);
        await this.SetLogDialogId(null);
        await this.SetOrgSessionId(null);
        await this.SetOnEndSessionCalled(false);
        await this.SetConversationId(null);
        await this.SetLastActive(0);
        await this.SetInTeach(false);
        await this.SetMessageProcessing(null);
    }

    // ------------------------------------------------
    //  IN_TEACH
    // ------------------------------------------------
    public async GetInTeach(): Promise<boolean> {
        const inTeach = await this.GetStateAsync<boolean>(BotStateType.IN_TEACH)
        return inTeach ? inTeach : false;
    }

    public async SetInTeach(inTeach: boolean): Promise<void> {
        inTeach = inTeach ? inTeach : false;
        await this.SetStateAsync(BotStateType.IN_TEACH, inTeach)
    }

    // ------------------------------------------------
    //  CONVERSATION_REFERENCE
    // ------------------------------------------------
    public async SetConversationReference(conversationReference: Partial<BB.ConversationReference> | null): Promise<void> {
        await this.SetStateAsync(BotStateType.CONVERSATION_REFERENCE, conversationReference)
    }

    public async GetConversationReverence(): Promise<Partial<BB.ConversationReference> | null> {
        return await this.GetStateAsync<BB.ConversationReference | null>(BotStateType.CONVERSATION_REFERENCE)
    }

    // For initial pro-active message need to build conversation reference from scratch
    public async CreateConversationReference(userName: string, userId: string, conversationId: string): Promise<void> {
        let conversationReference = {
            user: { name: userName, id: userId },
            conversation: { id: conversationId },
            channelId: 'emulator',
            // TODO: Refactor away from static coupling.  BotState needs to have access to options object through constructor
            serviceUrl: ConversationLearner.options!.DOL_SERVICE_URL
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
                userName : conversationReference.user && conversationReference.user.name,
                userId : conversationReference.user && conversationReference.user.id,
                logDialogId: await this.GetLogDialogId()
            } as SessionInfo
        }
        return {
            userName: '',
            userId: '',
            logDialogId: ''
        } as SessionInfo
    }
}

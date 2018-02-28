import * as BB from 'botbuilder'
import { Blis } from '../Blis'
import { BlisMemory } from '../BlisMemory'
import { BlisAppBase } from 'blis-models'
import { BlisIntent } from '../BlisIntent'
import { BlisDebug } from '../BlisDebug'

export interface ConversationSession {
    sessionId: string | null
    conversationId: string | null
}

export class BotState {
    private static _instance: BotState | null = null
    private static MEMKEY = 'BOTSTATE'
    public memory: BlisMemory

    // Currently running application
    public app: BlisAppBase | null = null

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

    // BotBuilder conversation reference
    public conversationReference: BB.ConversationReference | null = null

    private constructor(init?: Partial<BotState>) {
        (<any>Object).assign(this, init)
    }

    public static Get(blisMemory: BlisMemory): BotState {
        if (!BotState._instance) {
            BotState._instance = new BotState()
        }
        BotState._instance.memory = blisMemory
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
            this.SetAppAsync(null)
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
        this.conversationReference = json.conversationReference
    }

    private Serialize(): string {
        let jsonObj = {
            app: this.app,
            sessionId: this.sessionId,
            inTeach: this.inTeach ? this.inTeach : false,
            lastActive: this.lastActive,
            conversationId: this.conversationId,
            orgSessionId: this.orgSessionId,
            conversationReference: this.conversationReference
        }
        return JSON.stringify(jsonObj)
    }

    private async SetAsync(): Promise<void> {
        if (!this.memory) {
            throw 'BotState called without initialzing memory'
        }
        await this.memory.SetAsync(BotState.MEMKEY, this.Serialize())
    }

    public async SetAppAsync(app: BlisAppBase | null): Promise<void> {
        this.app = app
        this.sessionId = null
        this.conversationId = null,
        this.lastActive = 0,
        this.orgSessionId = null,
        this.inTeach = false
        await this.SetAsync()
    }

    public async AppAsync(): Promise<BlisAppBase | null> {
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

    public async OrgSessionIdAsync(sessionId: string): Promise<string | null> {
        await this.Init()

        // If session expired and was replaced with a more recent one, return the new sessionId
        if (this.orgSessionId == sessionId) {
            return this.sessionId;
        }
        return sessionId;
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
        this.conversationId = conversationId;
        this.lastActive = new Date().getTime();
        this.inTeach = inTeach
        await this.SetAsync()
    }

    public async EndSessionAsync(): Promise<void> {
        this.sessionId = null;
        this.orgSessionId = null;
        this.conversationId = null;
        this.lastActive = 0;
        this.inTeach = false
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
            serviceUrl: Blis.options.dolServiceUrl
        }
        this.SetConversationReferenceAsync(conversationReference)
    }

    public async SetConversationReferenceAsync(conversationReference: BB.ConversationReference): Promise<void> {
        await this.Init()
        this.conversationReference = conversationReference
        await this.SetAsync()
    }

    public async ConversationReverenceAsync(): Promise<BB.ConversationReference | null> {
        try {
            await this.Init()
            return this.conversationReference
        } catch (err) {
            return null
        }
    }

    //------------------------------------------------------------------
    public async SendMessage(bot: BB.Bot, message: string | BB.Activity): Promise<void> {
        let conversationReference = await this.ConversationReverenceAsync()
        if (!conversationReference) {
            BlisDebug.Error('Missing ConversationReference')
            return
        }

        bot.createContext(conversationReference, context => {
            if (typeof message == 'string') {
                context.reply(message)
            } else {
                context.reply('', message)
            }
        })
    }

    public async SendIntent(bot: BB.Bot, intent: BlisIntent): Promise<void> {
        let conversationReference = await this.ConversationReverenceAsync()
        if (!conversationReference) {
            BlisDebug.Error('Missing ConversationReference')
            return
        }
        bot.createContext(conversationReference, context => {
            context.replyWith(intent.scoredAction.actionId, intent)
        })
    }
}

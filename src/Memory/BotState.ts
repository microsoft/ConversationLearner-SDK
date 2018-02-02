import * as BB from 'botbuilder-core';
import { BlisMemory } from '../BlisMemory';
import { BlisAppBase } from 'blis-models';
import { BlisIntent } from '../BlisIntent';
import { BlisDebug } from '../BlisDebug';

export class ConversationSession {
    public sessionId: string = null;
    public conversationId: string = null;

    public constructor(init?:Partial<ConversationSession>)
    {
        (<any>Object).assign(this, init);
    }
}
export class BotState 
{
    private static _instance : BotState = null;
    private static MEMKEY = "BOTSTATE";
    public memory : BlisMemory;

    public app : BlisAppBase = null;

    public convSession : ConversationSession = null;

    // Set if in a teach session
    public inTeach : boolean = false;
 
    public inDebug : boolean = false;

    public conversationReference : BB.ConversationReference = null;

    private constructor(init?:Partial<BotState>)
    {
        (<any>Object).assign(this, init);
    }

    public static Get(blisMemory : BlisMemory) : BotState
    {
        if (!BotState._instance) {
            BotState._instance = new BotState();
        }
        BotState._instance.memory = blisMemory;
        return BotState._instance;
    }

    private async Init() : Promise<void>
    {
        if (!this.memory)
        {
            throw "BotState called without initializing memory";
        }
         // Load bot state
        let data = await this.memory.GetAsync(BotState.MEMKEY);
        if (data) 
        {
            this.Deserialize(data); 
        }
        else {
            this.SetAppAsync(null);
        }
    }

    private GetSync(cb : (err: any, botState: BotState) => void) : void
    {
        if (!this.memory)
        {
            throw "BotState called without initialzing memory";
        }
        
        // Load bot state
        this.memory.Get(BotState.MEMKEY, (err, data: string) =>
        {
            if (!err && data)
            {
                this.Deserialize(data);  
            }
            else
            {
                this.SetAppAsync(null);
            }     
            cb(null, this);      
        }); 
    }

    private Deserialize(text : string) : void
    {
        if (!text) return null;
        let json = JSON.parse(text);
        this.app = json.app;
        this.convSession = json.convSession;
        this.inTeach = json.inTeach ? json.inTeach : false;
        this.inDebug = json.inDebug ? json.inDebug : false;
        this.conversationReference = json.conversationReference;
    }

    private Serialize() : string
    {
        let jsonObj = {
            app : this.app,
            convSession : this.convSession,
            inTeach : this.inTeach ? this.inTeach : false,
            inDebug : this.inDebug ? this.inDebug : false,
            conversationReference : this.conversationReference
        }
        return JSON.stringify(jsonObj);
    }

    private async SetAsync() : Promise<void>
    {
        if (!this.memory)
        {
            throw "BotState called without initialzing memory";
        }
        await this.memory.SetAsync(BotState.MEMKEY, this.Serialize());
    }

    public async SetAppAsync(app : BlisAppBase) : Promise<void>
    {  
        this.app = app;
        this.convSession = null;
        this.inTeach = false;
        this.inDebug = false;
        await this.SetAsync();
    }

    public async AppAsync() : Promise<BlisAppBase>  
    {
        try {
            await this.Init();    
            return this.app;
        }
        catch (err)
        {
            return null;
        }
    }

    public async SessionIdAsync(conversationId: string) : Promise<string>
    {
        await this.Init(); 

        let convSession = this.convSession;
        if (!convSession) {
            return null;
        }
        // If convId not set yet, use the session and set it
        else if (!convSession.conversationId) {
            convSession.conversationId = conversationId;
            await this.SetAsync();
            return convSession.sessionId;
        }
        else if (convSession.conversationId == conversationId) {
            // If conversation Id matches return the sessionId   
            return convSession.sessionId;
        }
        // Otherwise session is for another conversation
        return null;
    }

    public async SetSessionAsync(sessionId: string, conversationId: string, inTeach: boolean) : Promise<void>
    {
        await this.Init();    
        this.convSession = new ConversationSession({sessionId: sessionId, conversationId: conversationId});
        this.inTeach = inTeach;
        await this.SetAsync();
    }

    public async InTeachAsync() : Promise<boolean> {
        await this.Init();    
        return this.inTeach;
    }

    public InTeachSync(cb : (err: any, inTeach: boolean) => void) : void {
        this.GetSync((err, botState) => {
            if (!err)
            {
                cb(null, botState.inTeach);
            }
        });    
    }

    public async InDebugAsync() : Promise<boolean> {
        await this.Init();    
        return this.inDebug;
    }

    public async SetInDebugAsync(isTrue : boolean) : Promise<void> {
        await this.Init();    
        this.inDebug = isTrue;
        await this.SetAsync();
    }

    // For initial pro-active message need to build conversation reference from scratch
    public async CreateConversationReferenceAsync(userName: string, userId: string, conversationId: string) : Promise<void> {

        let conversationReference = {  
            user : {name: userName, id: userId }, 
            conversation: { id: conversationId },
            channelId: "emulator",
            serviceUrl: process.env.DOL_SERVICE_URL || "http://127.0.0.1:3000"

        }
        this.SetConversationReferenceAsync(conversationReference);
    }

    public async SetConversationReferenceAsync(conversationReference :BB.ConversationReference) : Promise<void> {
        await this.Init();    
        this.conversationReference = conversationReference;
        await this.SetAsync();
    }

    public async ConversationReverenceAsync() : Promise<BB.ConversationReference> {
        try {
            await this.Init();    
            return this.conversationReference;
        }
        catch (err)
        {
            return null;
        }
    }

    //------------------------------------------------------------------
    public async SendMessage(bot : BB.Bot, message: string | BB.Activity) : Promise<any> {
        let conversationReference = await this.ConversationReverenceAsync();
        bot.createContext(conversationReference, (context) => {
            if (typeof message == "string") {
                context.reply(message);
            }
            else {
              context.reply("", message);
            }
        });
    }

    public async SendIntent(bot : BB.Bot, intent: BlisIntent) : Promise<any> {
        let conversationReference = await this.ConversationReverenceAsync();
        if (!conversationReference) {
            BlisDebug.Error("Missing ConversationReference");
            return;
        }
        bot.createContext(conversationReference, (context) => {
            context.replyWith(intent.scoredAction.actionId, intent);
        });
    }
}
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
    public teachId : string = null;
 
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
        this.teachId = json.teachId;
        this.inDebug = json.inDebug ? json.inDebug : false;
        this.conversationReference = json.conversationReference;
    }

    private Serialize() : string
    {
        let jsonObj = {
            app : this.app,
            convSession : this.convSession,
            teachId : this.teachId,
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
        this.teachId = null;
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
        // Otherwise session if for another conversation
        return null;
    }

    public async SetSessionAsync(sessionId: string, conversationId: string, teachId: string) : Promise<void>
    {
        await this.Init();    
        this.convSession = new ConversationSession({sessionId: sessionId, conversationId: conversationId});
        this.teachId = teachId;
        await this.SetAsync();
    }

    public async InTeachAsync() : Promise<boolean> {
        await this.Init();    
        return this.teachId != null;
    }

    public InTeachSync(cb : (err: any, inTeach: boolean) => void) : void {
        this.GetSync((err, botState) => {
            if (!err)
            {
                cb(null, botState.teachId != null);
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
    public async SendMessage(bot : BB.Bot, message: string) : Promise<any> {
        let conversationReference = await this.ConversationReverenceAsync();
        bot.createContext(conversationReference, (context) => {
            context.reply(message);
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
import * as builder from 'botbuilder';
import { Serializable } from './Serializable';
import { JsonProperty } from 'json-typescript-mapper';
import { BlisMemory } from '../BlisMemory';
import { EntitySuggestion } from 'blis-models';

export class BotState extends Serializable 
{
    private static _instance : BotState = null;
    private static MEMKEY = "BOTSTATE";
    public memory : BlisMemory;

    @JsonProperty('appId') 
    public appId : string = null;

    @JsonProperty('sesionId') 
    public sessionId : string = null;

    @JsonProperty('inTeach') 
    public inTeach : boolean = false;
 
    @JsonProperty('inDebug') 
    public inDebug : boolean = false;

    @JsonProperty('address') 
    public address : string = null;

    @JsonProperty('suggestedEntityId') 
    public suggestedEntityId : string = null;

    @JsonProperty('suggestedEntityName') 
    public suggestedEntityName : string = null;

    private constructor(init?:Partial<BotState>)
    {
        super();
        this.appId = undefined;
        this.sessionId = undefined;
        this.inTeach = false;
        this.inDebug = false;
        this.address = undefined;
        this.suggestedEntityId = undefined;
        this.suggestedEntityName = undefined;
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
            throw new Error("BotState called without initializing memory");
        }
         // Load bot state
        let data = await this.memory.GetAsync(BotState.MEMKEY);
        if (data) 
        {
            this.Deserialize(data); 
        }
        else {
            this.Clear(null);
        }
    }

    private GetSync(cb : (err, botState: BotState) => void) : void
    {
        if (!this.memory)
        {
            throw new Error("BotState called without initialzing memory");
        }
        
        // Load bot state
        this.memory.Get(BotState.MEMKEY, (err, data) =>
        {
            if (!err && data)
            {
                this.Deserialize(data);  
            }
            else
            {
                this.Clear(null);
            }     
            cb(null, this);      
        }); 
    }

    private Deserialize(text : string) : void
    {
        if (!text) return null;
        let json = JSON.parse(text);
        this.appId = json.appId;
        this.sessionId = json.sesionId;
        this.inTeach = json.inTeach ? json.inTeach : false;
        this.inDebug = json.inDebug ? json.inDebug : false;
        this.address = json.address;
        this.suggestedEntityId = json.suggestedEntityId;
        this.suggestedEntityName = json.suggestedEntityName;
    }

    private async Set() : Promise<void>
    {
        if (!this.memory)
        {
            throw new Error("BotState called without initialzing memory");
        }
        await this.memory.SetAsync(BotState.MEMKEY, this.Serialize());
    }

    private async Clear(appId : string) : Promise<void>
    {  
        this.appId = appId;
        this.sessionId = null;
        this.inTeach = false;
        this.inDebug = false;
        await this.Set();
    }
/*
    private async ToString() : Promise<string>
    {
        await this.Init();
        return JSON.stringify(this);
    }
*/
    public async AppId() : Promise<string>  
    {
        await this.Init();    
        return this.appId;
    }

    public async SetAppId(appId : string) : Promise<void>
    {
        await this.Init();    
        this.appId = appId;
        await this.Set();
    }

    public async SessionId() : Promise<string>
    {
        await this.Init();    
        return this.sessionId;
    }

    public async SetSessionId(sessionId : string) : Promise<void>
    {
        await this.Init();    
        this.sessionId = sessionId;
        await this.Set();
    }

    public async InTeach() : Promise<boolean> {
        await this.Init();    
        return this.inTeach;
    }

    public async SetInTeach(isTrue : boolean) : Promise<void> {
        await this.Init();    
        this.inTeach = isTrue;
        await this.Set();
    }

    public InTeachSync(cb : (err, inTeach) => void) : void {
        this.GetSync((err, botState) => {
            if (!err)
            {
                cb(null, botState.inTeach);
            }
        });    
    }

    public async InDebug() : Promise<boolean> {
        await this.Init();    
        return this.inDebug;
    }

    public async SetInDebug(isTrue : boolean) : Promise<void> {
        await this.Init();    
        this.inDebug = isTrue;
        await this.Set();
    }


    public async SetAddress(address : builder.IAddress) : Promise<void> {
        await this.Init();    
        this.address = JSON.stringify(address);
        await this.Set();
    }

    public async Address() : Promise<builder.IAddress> {
        try {
            await this.Init();    
            let addressString = this.address;
            return JSON.parse(addressString);
        }
        catch (err)
        {
            return null;
        }
    }

    //------------------------------------------------------------------
    public async SuggestedEntity(userInput : string) : Promise<EntitySuggestion> {
        await this.Init();   
        if (!this.suggestedEntityId || !this.suggestedEntityName) {
            return null;
        } 
        return new EntitySuggestion({
            entityId: this.suggestedEntityId,
            entityName: this.suggestedEntityName
        });
    }

     public async SetSuggestedEntity(suggestedEntity : EntitySuggestion) : Promise<void> {
        await this.Init();    
        this.suggestedEntityId = suggestedEntity.entityId;
        this.suggestedEntityName = suggestedEntity.entityName;
        await this.Set();
    }

    public async ClearSuggestedEntity() : Promise<void> {
        await this.Init();    
        this.suggestedEntityId = null;
        this.suggestedEntityName = null;
        await this.Set();
    }

    //------------------------------------------------------------------
    public async Session(bot : builder.UniversalBot) {
        let address = await this.Address();
        return new Promise(function(resolve,reject) {
            bot.loadSession(address, (err, session) => {
                if(err !== null)
                {
                 return reject(err);
                }
                resolve(session);
            });
        });
    }
}
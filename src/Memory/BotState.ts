import * as builder from 'botbuilder';
import { BlisMemory } from '../BlisMemory';
import { BlisAppBase } from 'blis-models';

export class BotState 
{
    private static _instance : BotState = null;
    private static MEMKEY = "BOTSTATE";
    public memory : BlisMemory;

    public appId : string = null;

    public sessionId : string = null;

    public inTeach : boolean = false;
 
    public inDebug : boolean = false;

    public address : string = null;

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
            this.Clear(null);
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
        this.sessionId = json.sessionId;
        this.inTeach = json.inTeach ? json.inTeach : false;
        this.inDebug = json.inDebug ? json.inDebug : false;
        this.address = json.address;
    }

    private Serialize() : string
    {
        let jsonObj = {
            appId : this.appId,
            sessionId : this.sessionId,
            inTeach : this.inTeach ? this.inTeach : false,
            inDebug : this.inDebug ? this.inDebug : false,
            address : this.address
        }
        return JSON.stringify(jsonObj);
    }

    private async Set() : Promise<void>
    {
        if (!this.memory)
        {
            throw "BotState called without initialzing memory";
        }
        await this.memory.SetAsync(BotState.MEMKEY, this.Serialize());
    }

    public async Clear(appId : string) : Promise<void>
    {  
        this.appId = appId;
        this.sessionId = null;
        this.inTeach = false;
        this.inDebug = false;
        await this.Set();
    }

    public async App() : Promise<BlisAppBase>  
    {
        try {
            await this.Init();    
            return JSON.parse(this.appId);
        }
        catch (err)
        {
            return null;
        }
    }

    public async SetApp(blisApp : BlisAppBase) : Promise<void>
    {
        await this.Init();    
        this.appId = JSON.stringify(blisApp);
        await this.Set();
    }

    public async SessionId() : Promise<string>
    {
        await this.Init();    
        return this.sessionId;
    }

    public async SetSession(sessionId : string, inTeach: boolean) : Promise<void>
    {
        await this.Init();    
        this.sessionId = sessionId;
        this.inTeach = inTeach;
        await this.Set();
    }

    public async InTeach() : Promise<boolean> {
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
    public async Session(bot : builder.UniversalBot) : Promise<any> {
        let address = await this.Address();
        return new Promise(function(resolve,reject) {
            bot.loadSession(address, (err, session) => {
                if(err !== null) {
                    reject(err);
                } else {
                    resolve(session);
                }
            });
        });
    }
}
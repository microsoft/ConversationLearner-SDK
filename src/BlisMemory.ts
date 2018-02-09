import * as BB from 'botbuilder';
import { BlisDebug} from './BlisDebug';
import { BotMemory } from './Memory/BotMemory';
import { BotState } from './Memory/BotState';
import { BlisAppBase } from 'blis-models'

export interface ISessionStartParams {
    inTeach: boolean,
    saveMemory: boolean
}
export class BlisMemory {

    private static memoryStorage : BB.Storage = null;
    private memCache = {};

    public static Init(memoryStorage: BB.Storage) : void
    {
        this.memoryStorage = memoryStorage;
        // If memory storage not defined use disk storage
        if (!memoryStorage) {
            BlisDebug.Log("Storage not defined.  Defaulting to in-memory storage.")
            this.memoryStorage = new BB.MemoryStorage();
        }
    }

    private constructor(private userkey : string)
    {
    }

    public static GetMemory(key : string) : BlisMemory
    {
        return new BlisMemory(key);
    }

    // Generate memory key from session
    public static async InitMemory(botContext : BotContext) : Promise<BlisMemory> 
    {
        let user = botContext.request.from;
        let memory = new BlisMemory(user.id);
        await memory.BotState.SetConversationReferenceAsync(botContext.conversationReference);
        return memory;
    }

    private Key(datakey : string) : string {
        return `${this.userkey}_${datakey}`
    }

    public async GetAsync(datakey : string) : Promise<any> {

        if (!BlisMemory.memoryStorage) {
            throw "Memory storage not found";
        }
        let that = this;
        let key = this.Key(datakey);
        let cacheData = this.memCache[key];
        if (cacheData)
        {
            BlisDebug.Log(`-< ${key} : ${cacheData}`, 'memverbose');
            return cacheData;
        }
        else {
            let data = await BlisMemory.memoryStorage.read([key]);
            if (data[key]) {
                that.memCache[key] = data[key].value;
            }
            else {
                that.memCache[key] = null;
            }
            BlisDebug.Log(`R< ${key} : ${that.memCache[key]}`, 'memory');
            return that.memCache[key];
        };
    }


    public async SetAsync(datakey : string, value : any) : Promise<void> {

        if (!BlisMemory.memoryStorage) {
            throw "Memory storage not found";
        }

        if (value == null)
        {
            await this.DeleteAsync(datakey);
            return;
        }

        let key = this.Key(datakey);
        try {            
                // First check mem cache to see if anything has changed, if not, can skip write
                let cacheData = this.memCache[key];
                if (cacheData == value)
                {
                    BlisDebug.Log(`-> ${key} : ${value}`, 'memverbose');
                }
                else
                {
                    // Write to memory storage (use * for etag)
                    await BlisMemory.memoryStorage.write({[key]: {"value": value, eTag: "*"}});
                    this.memCache[key] = value;
                    BlisDebug.Log(`W> ${key} : ${value}`, 'memory');
                }
        }
        catch (err) {
            BlisDebug.Error(err);
        }
    }

    public async DeleteAsync(datakey : string) : Promise<void> {
        let that = this;
        let key = this.Key(datakey);

        try {
            // First check mem cache to see if already null, if not, can skip write
            let cacheData = that.memCache[key];
            if (!cacheData)
            {
                BlisDebug.Log(`-> ${key} : -----`, 'memverbose');
            }
            else
            {
                BlisMemory.memoryStorage.delete([key]);
                {
                    this.memCache[key] = null;
                    BlisDebug.Log(`D> ${key} : -----`, 'memory');
                };
            }
        }
        catch (err) {
            BlisDebug.Error(err);
        }
    }

    public async Init(app: BlisAppBase) : Promise<void>
    {
        await this.BotState.SetAppAsync(app);
        await this.BotMemory.ClearAsync();
    }

    /** Clear memory associated with a session */
    public async EndSession() : Promise<void>
    {
        await this.BotState.SetSessionAsync(null, null, false);
        await this.BotMemory.ClearAsync();
    }

    /** Init memory for a session */
    public async StartSessionAsync(sessionId : string, conversationId: string, params : ISessionStartParams) : Promise<void>
    {
        await this.BotState.SetSessionAsync(sessionId, conversationId, params.inTeach);
        if (!params.saveMemory) {
            await this.BotMemory.ClearAsync();
        }
    }

    public get BotMemory() : BotMemory
    {
        return BotMemory.Get(this);
    }

    public get BotState() : BotState
    {
        return BotState.Get(this);
    }
}
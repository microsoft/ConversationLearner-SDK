import { BlisDebug} from './BlisDebug';
import { BotMemory } from './Memory/BotMemory';
import { BotState } from './Memory/BotState';
import { BlisAppBase } from 'blis-models'
import * as Redis from "redis";

export class BlisMemory {

    private static redisClient: Redis.RedisClient = null;

    private memCache = {};

    public static Init(redisServer : string, redisKey : string) : void
    {
        BlisDebug.Log("Creating Redis client...");
        if (!redisServer)
        {
            throw "Missing redis server name. Set BLIS_REDIS_SERVER Env value.";
        }
        if (!redisKey)
        {
            throw "Missing redis key. Set BLIS_REDIS_KEY Env value.";
        }

        this.redisClient = Redis.createClient(6380, redisServer, { auth_pass: redisKey, tls: { servername: redisServer } });
        this.redisClient.on('error', err => {
            BlisDebug.Error(err, "Redis");
        });
        BlisDebug.Log("Redis client created...");
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

        if (!BlisMemory.redisClient) {
            throw "Redis client not found";
        }
        let that = this;
        let key = this.Key(datakey);
        let cacheData = this.memCache[key];
        if (cacheData)
        {
            return new Promise(function(resolve,reject) {
                BlisDebug.Log(`-< ${key} : ${cacheData}`, 'memverbose');
                resolve(cacheData);
            });
        };
        return new Promise(function(resolve,reject) {
            BlisMemory.redisClient.get(key, function(err, data)
            {
                if(err !== null) return reject(err);
                that.memCache[key] = data;
                BlisDebug.Log(`R< ${key} : ${data}`, 'memory');
                resolve(data);
            });
        });
    }

    public async SetAsync(datakey : string, value : any) {

        if (!BlisMemory.redisClient) {
            throw "Redis client not found";
        }

        if (value == null)
        {
            return this.DeleteAsync(datakey);
        }

        let that = this;
        let key = this.Key(datakey);

        return new Promise(function(resolve,reject){

            try {            
                // First check mem cache to see if anything has changed, if not, can skip write
                let cacheData = that.memCache[key];
                if (cacheData == value)
                {
                    BlisDebug.Log(`-> ${key} : ${value}`, 'memverbose');
                    resolve("Cache");
                }
                else
                {
                    // Write to redis cache
                    BlisMemory.redisClient.set(key, value, function(err, data)
                    {
                        if(err !== null) return reject(err);
                        that.memCache[key] = value;
                        BlisDebug.Log(`W> ${key} : ${value}`, 'memory');
                        resolve(data);
                    });
                }
            }
            catch (err) {
                BlisDebug.Error(err);
                reject(err);
            }
        });
    }

    public async DeleteAsync(datakey : string) {
        let that = this;
        let key = this.Key(datakey);
        return new Promise(function(resolve,reject) {
            try {
                // First check mem cache to see if already null, if not, can skip write
                let cacheData = that.memCache[key];
                if (!cacheData)
                {
                    BlisDebug.Log(`-> ${key} : -----`, 'memverbose');
                    resolve("Cache");
                }
                else
                {
                    BlisMemory.redisClient.del(key, function(err, data)
                    {
                        if(err !== null) return reject(err);
                        that.memCache[key] = null;
                        BlisDebug.Log(`D> ${key} : -----`, 'memory');
                        resolve(data);
                    });
                }
            }
            catch (err) {
                BlisDebug.Error(err);
                reject(err);
            }
        });
    }

    public Get(datakey : string, cb : (err: any, data: {}) => void) {

        try {
            let key = this.Key(datakey);

            let cacheData = this.memCache[key];
            if (cacheData)
            {
                BlisDebug.Log(`-] ${key} : ${cacheData}`, 'memverbose');
                cb(null, cacheData);
            }
            BlisMemory.redisClient.get(key, (err, data)=> {
                if (!err)
                {
                    this.memCache[key] = data;
                }
                BlisDebug.Log(`R] ${key} : ${data}`, 'memory');
                cb(err, data);
            });
        }
        catch (err) {
            BlisDebug.Error(err);
            cb(err, null);
        }
    }

    public async Init(app: BlisAppBase) : Promise<void>
    {
        await this.BotState.SetAppAsync(app);
        await this.BotMemory.Clear();
    }

    /** Clear memory associated with a session */
    public async EndSession() : Promise<void>
    {
        await this.BotState.SetSessionAsync(null, null, null);
        await this.BotMemory.Clear();
    }

    /** Init memory for a session */
    public async StartSessionAsync(sessionId : string, conversationId: string, teachId : string, saveMemory: boolean = null) : Promise<void>
    {
        await this.BotState.SetSessionAsync(sessionId, conversationId, teachId);
        if (!saveMemory) {
            await this.BotMemory.Clear();
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
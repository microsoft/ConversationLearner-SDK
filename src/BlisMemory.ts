import * as builder from 'botbuilder'
import { BlisDebug} from './BlisDebug';
import { BotMemory } from './Memory/BotMemory';
import { BotState } from './Memory/BotState';
import { KeyGen } from 'blis-models'

import * as Redis from "redis";

export const MemoryType =
{
    LASTSTEP: "LASTSTEP", 
    CURSTEP: "CURSTEP", 
    TRAINSTEPS: "TRAINSTEPS",
    CUECOMMAND: "CUECOMMAND",       // Command to call after input prompt
    PAGE: "PAGE",                   // Current page on paging UI
    POSTS: "POSTS"                  // Array of last messages sent to user
}

export class BlisMemory {

    private static redisClient: Redis.RedisClient = null;

    private memCache = {};

    public static Init(redisServer : string, redisKey : string) : void
    {
        this.redisClient = Redis.createClient(6380, redisServer, { auth_pass: redisKey, tls: { servername: redisServer } });
        this.redisClient.on('error', err => {
            BlisDebug.Error(err);
        });
    }

    private constructor(private userkey : string)
    {
    }

    public static GetMemory(key : string) : BlisMemory
    {
        return new BlisMemory(key);
    }

    // Generate memory key from session
    public static InitMemory(session : builder.Session) : BlisMemory 
    {
        let user = session.message.address.user;
        let userdata = { id: user.id, name: user.name };
        let key = KeyGen.MakeKey(JSON.stringify(userdata));
        let memory = new BlisMemory(key);
        memory.BotState.SetAddress(session.message.address);
        return memory;
    }

    private Key(datakey : string) : string {
        return `${this.userkey}_${datakey}`
    }

    public async GetAsync(datakey : string) : Promise<any> {
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
            try {
                BlisMemory.redisClient.get(key, function(err, data)
                {
                    if(err !== null) return reject(err);
                    that.memCache[key] = data;
                    BlisDebug.Log(`R< ${key} : ${data}`, 'memory');
                    resolve(data);
                });
            }
            catch (err) {
                BlisDebug.Error(err);
                reject(err);
            }
        });
    }

    public async SetAsync(datakey : string, value : any) {
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

    public async Init(appId : string) : Promise<void>
    {
        await this.BotState.Clear(appId);
        await this.BotMemory.Clear();
    }

    /** Clear memory associated with a session */
    public async EndSession() : Promise<void>
    {
        await this.BotState.SetSessionId(null);
        await this.BotState.SetInTeach(false);
        await this.BotMemory.Clear();
    }

    /** Init memory for a session */
    public async StartSession(sessionId : string, inTeach : boolean) : Promise<void>
    {
        await this.EndSession();
        await this.BotState.SetSessionId(sessionId);
        await this.BotState.SetInTeach(inTeach);
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
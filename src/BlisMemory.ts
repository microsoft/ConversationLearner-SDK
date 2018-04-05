import * as BB from 'botbuilder'
import { Blis } from './Blis'
import { BlisDebug } from './BlisDebug'
import { BotMemory } from './Memory/BotMemory'
import { BotState } from './Memory/BotState'
import { BlisAppBase } from 'blis-models'

export interface ISessionStartParams {
    inTeach: boolean
    isContinued: boolean
}
export class BlisMemory {
    private static memoryStorage: BB.Storage | null = null
    private memCache = {}

    public static Init(memoryStorage: BB.Storage | null): void {
        this.memoryStorage = memoryStorage
        // If memory storage not defined use disk storage
        if (!memoryStorage) {
            BlisDebug.Log('Storage not defined.  Defaulting to in-memory storage.')
            this.memoryStorage = new BB.MemoryStorage()
        }
    }

    private constructor(private userkey: string) {}

    public static GetMemory(key: string): BlisMemory {
        return new BlisMemory(key)
    }

    // Generate memory key from session
    public static async InitMemory(botContext: BotContext): Promise<BlisMemory> {
        let user = botContext.request.from
        if (!user) {
            throw new Error(`Attempted to initialize memory, but cannot get memory key because current request did not have 'from'/user specified`)
        }
        if (!user.id) {
            throw new Error(`Attempted to initialize memory, but user.id was not provided which is required for use as memory key.`)
        }
        
        let memory = new BlisMemory(user.id)
        await memory.BotState.SetConversationReferenceAsync(botContext.conversationReference)
        return memory
    }

    private Key(datakey: string): string {
        return `${this.userkey}_${datakey}`
    }

    public async GetAsync(datakey: string): Promise<any> {
        if (!BlisMemory.memoryStorage) {
            throw 'Memory storage not found'
        }
        let that = this
        let key = this.Key(datakey)
        let cacheData = this.memCache[key]
        if (cacheData) {
            BlisDebug.Log(`-< ${key} : ${cacheData}`, 'memverbose')
            return cacheData
        } else {
            try {
                let data = await BlisMemory.memoryStorage.read([key])
                if (data[key]) {
                    that.memCache[key] = data[key].value
                } else {
                    that.memCache[key] = null
                }
                BlisDebug.Log(`R< ${key} : ${that.memCache[key]}`, 'memory')
                return that.memCache[key]
            }
            catch (err) {
                BlisDebug.Error(err);
                return null;
            }
        }
    }

    public async SetAsync(datakey: string, value: any): Promise<void> {
        if (!BlisMemory.memoryStorage) {
            throw 'Memory storage not found'
        }

        if (value == null) {
            await this.DeleteAsync(datakey)
            return
        }

        let key = this.Key(datakey)
        try {
            // First check mem cache to see if anything has changed, if not, can skip write
            let cacheData = this.memCache[key]
            if (cacheData == value) {
                BlisDebug.Log(`-> ${key} : ${value}`, 'memverbose')
            } else {
                // Write to memory storage (use * for etag)
                await BlisMemory.memoryStorage.write({ [key]: { value: value, eTag: '*' } })
                this.memCache[key] = value
                BlisDebug.Log(`W> ${key} : ${value}`, 'memory')
            }
        } catch (err) {
            BlisDebug.Error(err)
        }
    }

    public async DeleteAsync(datakey: string): Promise<void> {
        let that = this
        let key = this.Key(datakey)

        try {
            // First check mem cache to see if already null, if not, can skip write
            let cacheData = that.memCache[key]
            if (!cacheData) {
                BlisDebug.Log(`-> ${key} : -----`, 'memverbose')
            } else {
                // TODO: Remove possibility of being null
                if (!BlisMemory.memoryStorage) {
                    BlisDebug.Error(`You attempted to delete key: ${key} before memoryStorage was defined`)
                }
                else {

                    BlisMemory.memoryStorage.delete([key])
                    this.memCache[key] = null
                    BlisDebug.Log(`D> ${key} : -----`, 'memory')
                }
            }
        } catch (err) {
            BlisDebug.Error(err)
        }
    }

    public async SetAppAsync(app: BlisAppBase | null): Promise<void> {
        const curApp = await this.BotState.AppAsync();
        await this.BotState._SetAppAsync(app)

        if (!app || !curApp || curApp.appId !== app.appId) {
            await this.BotMemory.ClearAsync()
        }
    }

    /** Update memory associated with a session */
    public async EndSessionAsync(): Promise<void> {

        let app = await this.BotState.AppAsync()

        // Default callback will clear the bot memory
        Blis.CallSessionEndCallback(this, app ? app.appId : null);

        await this.BotState.EndSessionAsync();
    }

    /** Init memory for a session */
    public async StartSessionAsync(sessionId: string, conversationId: string | null, params: ISessionStartParams, orgSessionId: string | null = null): Promise<void> {
 
        let app = await this.BotState.AppAsync()

        // If not continuing an edited session or restarting an expired session 
        if (!params.isContinued && !orgSessionId) {

            // If onEndSession hasn't been called yet, call it
            let calledEndSession = await this.BotState.OnEndSessionCalledAsync();
            if (!calledEndSession) {

                // Default callback will clear the bot memory
                await Blis.CallSessionEndCallback(this, app ? app.appId : null);
            }
        }
        await Blis.CallSessionStartCallback(this, app ? app.appId : null);
        await this.BotState.SetSessionAsync(sessionId, conversationId, params.inTeach, orgSessionId)
    }

    public get BotMemory(): BotMemory {
        return BotMemory.Get(this)
    }

    public get BotState(): BotState {
        return BotState.Get(this)
    }
}

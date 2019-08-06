/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import * as CLM from '@conversationlearner/models'
import * as Utils from './Utils'
import { CLDebug, DebugType } from './CLDebug'
import { EntityState } from './Memory/EntityState'
import { BotState } from './Memory/BotState'
import InProcessMessageState from './Memory/InProcessMessageState'

/**
 * This is a wrapper around BB.Storage that operates in the string domain
 * The higher level operations on the Storage are done through EntityState, BotState, and MessageState
 * 
 * This outer instance of CLStorage has keyPrefix specific to model + conversation.
 * This was required for dispatching when multiple models needed separate state for the same conversation.
 * 
 * The inner conversationStorage instance of CLStorage has keyPrefix mapped to the conversation.
 * This enabled tracking message state within the conversation independently of how many models are used within the conversation.
 */
export class CLStorage {
    private static storage: BB.Storage | null = null
    // TODO: Remove later, after refactor to change hierarchy to State -> ClStorage -> BB.Storage
    private conversationStorage: CLStorage | undefined

    private memCache = {}
    private keyPrefix: string
    public readonly turnContext?: BB.TurnContext

    public static Init(storage: BB.Storage | null): void {
        // If memory storage not defined use disk storage
        if (!storage) {
            CLDebug.Log('Storage not defined.  Defaulting to in-memory storage.')
            storage = new BB.MemoryStorage()
        }

        CLStorage.storage = storage
    }

    private constructor(keyPrefix: string, turnContext?: BB.TurnContext) {
        this.keyPrefix = keyPrefix
        this.turnContext = turnContext
    }

    public static Get(key: string): CLStorage {
        const storage = new CLStorage(key)
        storage.conversationStorage = new CLStorage(key)
        return storage
    }

    public static GetFromContext(turnContext: BB.TurnContext, modelId: string = ''): CLStorage {
        const conversationReference = BB.TurnContext.getConversationReference(turnContext.activity)
        const user = conversationReference.user

        let keyPrefix: string | null = null
        let messageMutexPrefix: string
        if (Utils.isRunningInClUI(turnContext)) {
            if (!user) {
                throw new Error(`Attempted to initialize memory, but cannot get memory key because current request did not have 'from'/user specified`)
            }
            if (!user.id) {
                throw new Error(`Attempted to initialize memory, but user.id was not provided which is required for use as memory key.`)
            }
            // User ID is the browser slot assigned to the UI
            keyPrefix = `${modelId}${user.id}`
            messageMutexPrefix = user.id
        } else {
            // Memory uses conversation Id as the prefix key for all the objects kept in CLMemory when bot is not running against CL UI
            if (!conversationReference.conversation || !conversationReference.conversation.id) {
                throw new Error(`Attempted to initialize memory, but conversationReference.conversation.id was not provided which is required for use as memory key.`)
            }
            // Dispatcher subModels will have the same conversation id thus we need the model id to differentiate
            keyPrefix = `${modelId}${conversationReference.conversation.id}`
            messageMutexPrefix = conversationReference.conversation.id
        }

        const modelStorage = new CLStorage(keyPrefix, turnContext)
        const conversationStorage = new CLStorage(messageMutexPrefix, turnContext)
        modelStorage.conversationStorage = conversationStorage
        return modelStorage
    }

    private Key(datakey: string): string {
        return `${Utils.getSha256Hash(this.keyPrefix)}_${datakey}`
    }

    public async GetAsync(datakey: string): Promise<any> {
        if (!CLStorage.storage) {
            throw new Error('Memory storage not found')
        }

        let key = this.Key(datakey)
        let cacheData = this.memCache[key]
        if (cacheData) {
            CLDebug.Log(`-< ${key} : ${cacheData}`, DebugType.MemVerbose)
            return cacheData
        } else {
            try {
                let data = await CLStorage.storage.read([key])
                if (data[key]) {
                    this.memCache[key] = data[key].value
                } else {
                    this.memCache[key] = null
                }
                CLDebug.Log(`R< ${key} : ${this.memCache[key]}`, DebugType.Memory)
                return this.memCache[key]
            }
            catch (err) {
                CLDebug.Error(err);
                return null;
            }
        }
    }

    public async SetAsync(datakey: string, jsonString: string): Promise<void> {
        if (!CLStorage.storage) {
            throw new Error('Memory storage not found')
        }

        if (jsonString == "null") {
            await this.DeleteAsync(datakey)
            return
        }

        let key = this.Key(datakey)
        try {
            // First check mem cache to see if anything has changed, if not, can skip write
            let cacheData = this.memCache[key]
            if (cacheData == jsonString) {
                CLDebug.Log(`-> ${key} : ${jsonString}`, DebugType.MemVerbose)
            } else {
                // Write to memory storage (use * for etag)
                this.memCache[key] = jsonString
                await CLStorage.storage.write({ [key]: { value: jsonString, eTag: '*' } })
                CLDebug.Log(`W> ${key} : ${jsonString}`, DebugType.Memory)
            }
        } catch (err) {
            CLDebug.Error(err)
        }
    }

    public async DeleteAsync(datakey: string): Promise<void> {
        let key = this.Key(datakey)

        try {
            // TODO: Remove possibility of being null
            if (!CLStorage.storage) {
                CLDebug.Error(`You attempted to delete key: ${key} before memoryStorage was defined`)
            }
            else {
                this.memCache[key] = null
                CLStorage.storage.delete([key])
                CLDebug.Log(`D> ${key} : -----`, DebugType.Memory)
            }
        } catch (err) {
            CLDebug.Error(err)
        }
    }

    public async SetAppAsync(app: CLM.AppBase | null): Promise<void> {
        const curApp = await this.BotState.GetApp();
        await this.BotState._SetAppAsync(app)
        await this.MessageState.remove()

        if (!app || !curApp || curApp.appId !== app.appId) {
            await this.EntityState.ClearAsync()
        }
    }

    public get EntityState(): EntityState {
        return EntityState.Get(this)
    }

    public get BotState(): BotState {
        return BotState.Get(this, this.turnContext ? BB.TurnContext.getConversationReference(this.turnContext.activity) : null)
    }

    public get MessageState(): InProcessMessageState {
        if (!this.conversationStorage) {
            throw new Error(`conversationStorage must be set in order to get MessageState`)
        }

        return InProcessMessageState.Get(this.conversationStorage)
    }

    public get TurnContext(): BB.TurnContext | undefined {
        return this.turnContext
    }
}

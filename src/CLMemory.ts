/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import * as CLM from '@conversationlearner/models'
import * as Utils from './Utils'
import { CLDebug, DebugType } from './CLDebug'
import { BotMemory } from './Memory/BotMemory'
import { BotState } from './Memory/BotState'
import InProcessMessageState from './Memory/InProcessMessageState'

/**
 * This outer instance of CLMemory has keyPrefix specific to model + conversation.
 * This was required for dispatching when multiple models needed separate state for the same conversation.
 * 
 * The inner conversationStorage instance of CLMemory has keyPrefix mapped to the conversation.
 * This enabled tracking message state within the conversation independently of how many models are used within the conversation.
 */
export class CLMemory {
    private static memoryStorage: BB.Storage | null = null
    // TODO: Remove later, after refactor to change hierarchy to State -> ClStorage -> BB.Storage
    private conversationStorage: CLMemory | undefined

    private memCache = {}
    private keyPrefix: string
    private turnContext: BB.TurnContext | null

    public static Init(memoryStorage: BB.Storage | null): void {
        CLMemory.memoryStorage = memoryStorage
        // If memory storage not defined use disk storage
        if (!memoryStorage) {
            CLDebug.Log('Storage not defined.  Defaulting to in-memory storage.')
            CLMemory.memoryStorage = new BB.MemoryStorage()
        }
    }

    private constructor(keyPrefix: string, turnContext: BB.TurnContext | null = null) {
        this.keyPrefix = keyPrefix
        this.turnContext = turnContext
    }

    public static GetMemory(key: string): CLMemory {
        const memory = new CLMemory(key)
        memory.conversationStorage = new CLMemory(key)
        return memory
    }

    // Generate memory key from session
    public static async InitMemory(turnContext: BB.TurnContext, modelId: string = ''): Promise<CLMemory> {
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
            // Dispatcher subModels will have the same converataion id thus we need the model id to differentiate
            keyPrefix = `${modelId}${conversationReference.conversation.id}`
            messageMutexPrefix = conversationReference.conversation.id
        }

        const modelStorage = new CLMemory(keyPrefix, turnContext)
        const conversationStorage = new CLMemory(messageMutexPrefix, turnContext)
        modelStorage.conversationStorage = conversationStorage
        return modelStorage
    }

    private Key(datakey: string): string {
        return `${Utils.getSha256Hash(this.keyPrefix)}_${datakey}`
    }

    public async GetAsync(datakey: string): Promise<any> {
        if (!CLMemory.memoryStorage) {
            throw new Error('Memory storage not found')
        }

        let key = this.Key(datakey)
        let cacheData = this.memCache[key]
        if (cacheData) {
            CLDebug.Log(`-< ${key} : ${cacheData}`, DebugType.MemVerbose)
            return cacheData
        } else {
            try {
                let data = await CLMemory.memoryStorage.read([key])
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
        if (!CLMemory.memoryStorage) {
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
                await CLMemory.memoryStorage.write({ [key]: { value: jsonString, eTag: '*' } })
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
            if (!CLMemory.memoryStorage) {
                CLDebug.Error(`You attempted to delete key: ${key} before memoryStorage was defined`)
            }
            else {
                this.memCache[key] = null
                CLMemory.memoryStorage.delete([key])
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
            await this.BotMemory.ClearAsync()
        }
    }

    public get BotMemory(): BotMemory {
        return BotMemory.Get(this)
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

    public get TurnContext(): BB.TurnContext | null {
        return this.turnContext
    }
}

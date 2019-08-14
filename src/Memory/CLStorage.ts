/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import { CLDebug, DebugType } from '../CLDebug'

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
    private storage: BB.Storage
    private memCache = {}

    constructor(storage?: BB.Storage) {
        // If memory storage not defined use disk storage
        if (!storage) {
            CLDebug.Log('Storage not defined.  Defaulting to in-memory storage.')
            storage = new BB.MemoryStorage()
        }

        this.storage = storage
    }

    public async GetAsync(key: string): Promise<any> {
        let cacheData = this.memCache[key]
        if (cacheData) {
            CLDebug.Log(`-< ${key} : ${cacheData}`, DebugType.MemVerbose)
            return cacheData
        } else {
            try {
                let data = await this.storage.read([key])
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

    public async SetAsync(key: string, jsonString: string): Promise<void> {
        if (jsonString == "null") {
            await this.DeleteAsync(key)
            return
        }

        try {
            // First check mem cache to see if anything has changed, if not, can skip write
            let cacheData = this.memCache[key]
            if (cacheData == jsonString) {
                CLDebug.Log(`-> ${key} : ${jsonString}`, DebugType.MemVerbose)
            } else {
                // Write to memory storage (use * for etag)
                this.memCache[key] = jsonString
                await this.storage.write({ [key]: { value: jsonString, eTag: '*' } })
                CLDebug.Log(`W> ${key} : ${jsonString}`, DebugType.Memory)
            }
        } catch (err) {
            CLDebug.Error(err)
        }
    }

    public async DeleteAsync(key: string): Promise<void> {
        try {
            // TODO: Remove possibility of being null
            if (!this.storage) {
                CLDebug.Error(`You attempted to delete key: ${key} before memoryStorage was defined`)
            }
            else {
                this.memCache[key] = null
                this.storage.delete([key])
                CLDebug.Log(`D> ${key} : -----`, DebugType.Memory)
            }
        } catch (err) {
            CLDebug.Error(err)
        }
    }
}

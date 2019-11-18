/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Storage, StoreItems, StoreItem } from 'botbuilder'
import * as Redis from 'redis'
import { CLDebug } from './CLDebug';

/** Additional settings for configuring an instance of RedisStorage */
export interface RedisStorageSettings {
    /** Redis server. */
    server: string

    /** Storage access key. */
    key: string

    /** Port. */
    port?: number
}

/**
 * Bot storage implimentation using a Redis cache
 */
export class RedisStorage implements Storage {
    private redisClient: Redis.RedisClient
    private _get: (...args: any[]) => Promise<any>
    private _set: (...args: any[]) => Promise<any>
    private _del: (...args: any[]) => Promise<any>

    constructor(settings: RedisStorageSettings) {

        this.redisClient = Redis.createClient(settings.port ? settings.port : 6380, settings.server, {
            auth_pass: settings.key,
            tls: { servername: settings.server }
        })

        this.redisClient.on('error', (err) => {
            CLDebug.Error(err, "RedisStorage")
        })

        this._get = this.promisify(this.redisClient.get)
        this._set = this.promisify(this.redisClient.set)
        this._del = this.promisify(this.redisClient.del)
    }

    /**
     * Loads store items from storage
     *
     * @param keys Array of item keys to read from the store.
     */
    public async read(keys: string[]): Promise<StoreItems> {
        let storeItems: StoreItems = {}

        // foreach key
        for (let iKey in keys) {
            let key = keys[iKey]
            let storeItem = await this._get(key)
            storeItems[key] = JSON.parse(storeItem)
        }
        return storeItems
    }

    /**
     * Saves store items to storage.
     *
     * @param changes Map of items to write to storage.
     */
    public async write(changes: StoreItems): Promise<void> {
        for (let key in changes) {
            let storeItem: StoreItem = changes[key]
            await this._set(key, JSON.stringify(storeItem))
        }
    }

    /**
     * Removes store items from storage
     *
     * @param keys Array of item keys to remove from the store.
     */
    public async delete(keys: string[]) {
        for (let iKey in keys) {
            let key = keys[iKey]
            await this._del(key)
        }
    }

    private promisify(func: Function) {
        return (...args: any[]) =>
            new Promise<any>((resolve, reject) => {
                const callback = (err: any, data: any) => (err ? reject(err) : resolve(data))

                func.apply(this.redisClient, [...args, callback])
            })
    }
}

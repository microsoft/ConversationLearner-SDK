/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { CLStorage } from './CLStorage'

export type GetKey = () => string

/**
 * Tracks the state of messages which are being processed.
 * The memory instances given to this class should be associated with lifetime of messages, eg the conversation
 */
export class InProcessMessageState {
    private storage: CLStorage
    private getKey: GetKey

    constructor(storage: CLStorage, getKey: GetKey) {
        this.storage = storage
        this.getKey = getKey
    }

    async get<T>(): Promise<T> {
        return await this.getStateAsync<T>()
    }

    async remove<T>(): Promise<T> {
        let currentValue = await this.getStateAsync<T>()
        await this.setStateAsync(null);
        return currentValue;
    }

    async set<T>(message: T | null): Promise<void> {
        await this.setStateAsync(message)
    }

    private async getStateAsync<T>(): Promise<T> {
        const key = this.getKey()

        try {
            let data = await this.storage.GetAsync(key);
            return JSON.parse(data) as T;
        }
        catch {
            // If brand new use, need to initialize
            await this.set(null);
            const data = await this.storage.GetAsync(key)
            return JSON.parse(data) as T;
        }
    }

    private async setStateAsync<T>(value: T): Promise<void> {
        const key = this.getKey()
        const json = JSON.stringify(value)
        await this.storage.SetAsync(key, json)
    }
}

export default InProcessMessageState
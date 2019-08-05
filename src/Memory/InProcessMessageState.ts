/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { CLMemory } from '../CLMemory'

// Current message being processed
const MESSAGE_MUTEX = 'MESSAGE_MUTEX'

/**
 * Tracks the state of messages which are being processed.
 * The memory instances given to this class should be associated with lifetime of messages, eg the conversation
 */
export default class InProcessMessageState {
    private static _instance: InProcessMessageState | undefined

    public static Get(clMemory: CLMemory): InProcessMessageState {
        if (!InProcessMessageState._instance) {
            InProcessMessageState._instance = new InProcessMessageState(clMemory)
        }

        return InProcessMessageState._instance
    }

    private clStorage: CLMemory

    private constructor(clStorage: CLMemory) {
        this.clStorage = clStorage
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
        try {
            let data = await this.clStorage.GetAsync(MESSAGE_MUTEX);
            return JSON.parse(data) as T;
        }
        catch {
            // If brand new use, need to initialize
            await this.set(null);
            const data = await this.clStorage.GetAsync(MESSAGE_MUTEX)
            return JSON.parse(data) as T;
        }
    }

    private async setStateAsync<T>(value: T): Promise<void> {
        const json = JSON.stringify(value)
        await this.clStorage.SetAsync(MESSAGE_MUTEX, json)
    }
}
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { CLStorage } from './CLStorage'
import { CLDebug } from '../CLDebug'

const MAX_BROWSER_SLOTS = 10;

type BrowserSlot = {
    browserId: string;
    lastUsed: number;
    id: string;
}

type GetKey = () => string

/**
 * Used to keep track of storage keys associated with open instances of the UI
 * Each UI instance uses a different slot, with a max number of
 * slots available
 */
export class BrowserSlotState {
    private readonly storage: CLStorage
    private readonly getKey: GetKey

    constructor(storage: CLStorage, getKey: GetKey) {
        this.storage = storage
        this.getKey = getKey
    }

    createSlot(browserId: string, offset: number): BrowserSlot {
        return {
            browserId: browserId,
            lastUsed: new Date().getTime(),
            // 0 1 2 3 4 5 6 7 8 9 10
            // A B C D E F G H I J K
            id: String.fromCharCode(offset + 'A'.charCodeAt(0)),
        }
    }

    async get(browserId: string): Promise<string> {
        const browserSlots = await this.getAll();

        // If browser already exists, update last used time, save new slots, and return existing id
        const existingSlot = browserSlots.find(b => b.browserId === browserId)
        if (existingSlot) {
            existingSlot.lastUsed = new Date().getTime();
            await this.update(browserSlots);
            return existingSlot.id
        }
        // If browser not found in existing slots, but spaces is still available, create slot, save, and return new id
        else if (browserSlots.length < MAX_BROWSER_SLOTS) {
            const newSlot = this.createSlot(browserId, browserSlots.length)
            browserSlots.push(newSlot);
            await this.update(browserSlots);
            return newSlot.id;
        }
        // If browser not found, and no slots, overwrite the oldest slot
        const oldestTime = browserSlots.reduce((min, b) => Math.min(min, b.lastUsed), browserSlots[0].lastUsed)
        const oldestSlot = browserSlots.find(b => b.lastUsed === oldestTime);
        if (!oldestSlot) {
            throw new Error("Slot not found. This should never happen.")
        }

        // Claim this slot
        oldestSlot.lastUsed = new Date().getTime();
        oldestSlot.browserId = browserId;
        await this.update(browserSlots);
        return oldestSlot.id;
    }

    private async getAll(): Promise<BrowserSlot[]> {
        try {
            const key = this.getKey()
            const data = await this.storage.GetAsync(key)
            if (data) {
                return JSON.parse(data) as BrowserSlot[];
            }
            return [];
        }
        catch (err) {
            CLDebug.Error(err, "BrowserSlots")
            return [];
        }
    }

    private async update(browserSlots: BrowserSlot[]): Promise<void> {
        try {
            const key = this.getKey()
            await this.storage.SetAsync(key, JSON.stringify(browserSlots))
        }
        catch (err) {
            CLDebug.Error(err, "BrowserSlots")
        }
    }
}
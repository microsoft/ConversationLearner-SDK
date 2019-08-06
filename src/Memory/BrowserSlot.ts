/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { CLStorage } from '../CLStorage'
import { CLDebug } from '../CLDebug'

const MAX_BROWSER_SLOTS = 10;

/**
 * Used to keep track of memory slots used by open instances of the UI
 * Each browser instance uses a different slot, with a max number of
 * slots available
 */
export class BrowserSlot {
    browserId: string;
    lastUsed: number;
    id: string;

    constructor(browserId: string, offset: number) {
        this.browserId = browserId;
        this.lastUsed = new Date().getTime();
        this.id = String.fromCharCode(offset + 65)
    }

    public static async GetSlot(browserId: string): Promise<string> {
        let browserSlots = await this.BrowserSlots();

        // Check if browser already has a spot
        let existingSlot = browserSlots.find(b => b.browserId === browserId)
        if (existingSlot) {
            existingSlot.lastUsed = new Date().getTime();
            await this.UpdateBrowserSlots(browserSlots);
            return existingSlot.id
        }
        // Add slot of spaces still availabled
        if (browserSlots.length < MAX_BROWSER_SLOTS) {
            let newSlot = new BrowserSlot(browserId, browserSlots.length);
            browserSlots.push(newSlot);
            await this.UpdateBrowserSlots(browserSlots);
            return newSlot.id;
        }
        // Use oldest slot
        let oldestTime = browserSlots.reduce((min, b) => Math.min(min, b.lastUsed), browserSlots[0].lastUsed)
        let oldestSlot = browserSlots.find(b => b.lastUsed === oldestTime);

        if (!oldestSlot) {
            throw new Error("Slot not found. This should never happen.")
        }

        // Claim this slot
        oldestSlot.lastUsed = new Date().getTime();
        oldestSlot.browserId = browserId;
        await this.UpdateBrowserSlots(browserSlots);
        return oldestSlot.id;
    }

    private static async BrowserSlots(): Promise<BrowserSlot[]> {
        try {
            let memory = CLStorage.Get("BROWSER")
            let data = await memory.GetAsync("SLOTS")
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

    private static async UpdateBrowserSlots(browserSlots: BrowserSlot[]): Promise<void> {
        try {
            let memory = CLStorage.Get("BROWSER")
            await memory.SetAsync("SLOTS", JSON.stringify(browserSlots))
        }
        catch (err) {
            CLDebug.Error(err, "BrowserSlots")
        }
    }
}
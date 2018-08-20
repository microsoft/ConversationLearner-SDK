/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { CLMemory } from '../CLMemory'
import { CLDebug } from '../CLDebug'
import { Memory, FilledEntity, MemoryValue, FilledEntityMap } from '@conversationlearner/models'
import { ClientMemoryManager } from '..';

const NEGATIVE_PREFIX = '~'

export class BotMemory {
    private static _instance: BotMemory | undefined
    private static MEMKEY = 'BOTMEMORY'
    private memory: CLMemory | undefined
    public filledEntityMap: FilledEntityMap

    private constructor(init?: Partial<BotMemory>) {
        this.filledEntityMap = new FilledEntityMap()
        Object.assign(this, init)
    }

    public static Get(clMemory: CLMemory): BotMemory {
        if (!BotMemory._instance) {
            BotMemory._instance = new BotMemory()
        }
        BotMemory._instance.memory = clMemory
        return BotMemory._instance
    }

    public async FilledEntityMap(): Promise<FilledEntityMap> {
        await this.Init()
        return this.filledEntityMap
    }

    private async Init(): Promise<void> {
        if (!this.memory) {
            throw new Error('BotMemory called without initializing memory')
        }

        let data = await this.memory.GetAsync(BotMemory.MEMKEY)
        if (data) {
            this.Deserialize(data)
        } else {
            this.ClearAsync()
        }
    }

    public Serialize(): string {
        return JSON.stringify(this.filledEntityMap.map)
    }

    private Deserialize(text: string): void {
        if (!text) {
            return
        }
        let json = JSON.parse(text)
        this.filledEntityMap.map = json ? json : {}
    }

    private async Set(): Promise<void> {
        if (!this.memory) {
            throw new Error('BotMemory called without initializing memory')
        }
        await this.memory.SetAsync(BotMemory.MEMKEY, this.Serialize())
    }

    public async RestoreFromMapAsync(filledEntityMap: FilledEntityMap): Promise<void> {
        this.filledEntityMap.map = filledEntityMap.map
        await this.Set()
    }

    public async RestoreFromMemoryManagerAsync(memoryManager: ClientMemoryManager): Promise<void> {
        // Disable memory manager.  Use has been completed
        memoryManager.__Expire()
        this.filledEntityMap.map = memoryManager.curMemories.map
        await this.Set()
    }

    // Clear memory values not in saveList
    public async ClearAsync(saveList?: string[] | void): Promise<void> {
        if (!saveList) {
            this.filledEntityMap = new FilledEntityMap()
        }
        else {
            for (let key of Object.keys(this.filledEntityMap.map)) {
                if (saveList.indexOf(key) < 0) {
                    delete this.filledEntityMap.map[key]
                }
            }

        }
        await this.Set()
    }

    // Remember value for an entity
    public async RememberEntity(entityName: string, entityId: string, entityValue: string, isBucket: boolean = false, builtinType: string | null = null, resolution: any | null = null): Promise<void> {
        await this.Init()
        this.filledEntityMap.Remember(entityName, entityId, entityValue, isBucket, builtinType, resolution)
        await this.Set()
    }

    // Remember multiple values for an entity
    public async RememberMany(entityName: string, entityId: string, entityValues: string[], isBucket: boolean = false, builtinType: string | null = null, resolution: {} | null = null): Promise<void> {
        await this.Init()
        this.filledEntityMap.RememberMany(entityName, entityId, entityValues, isBucket, builtinType, resolution)
        await this.Set()
    }

    /** Return array of entity names for which I've remembered something */
    public async RememberedNames(): Promise<string[]> {
        await this.Init()
        return Object.keys(this.filledEntityMap)
    }

    /** Return array of entity Ids for which I've remembered something */
    public async FilledEntitiesAsync(): Promise<FilledEntity[]> {
        await this.Init()
        return this.filledEntityMap.FilledEntities();
    }

    /** Given negative entity name, return positive version */
    private PositiveName(negativeName: string): string | null {
        if (negativeName.startsWith(NEGATIVE_PREFIX)) {
            return negativeName.slice(1)
        }
        return null
    }

    /** Forget a predicted Entity */
    public async ForgetEntity(entityName: string, entityValue: string, isMultiValue: boolean): Promise<void> {
        let posName = this.PositiveName(entityName)
        if (posName) {
            await this.Forget(posName, entityValue, isMultiValue)
        }
    }

    /** Forget an entity value */
    public async Forget(entityName: string, entityValue: string | null = null, isBucket: boolean = false): Promise<void> {
        try {
            // Check if entity buckets values
            await this.Init()
            this.filledEntityMap.Forget(entityName, entityValue, isBucket)
            await this.Set()
        } catch (error) {
            CLDebug.Error(error)
        }
    }

    public async DumpMemory(): Promise<Memory[]> {
        // Check if entity buckets values
        await this.Init()

        let memory: Memory[] = []
        for (let entityName in this.filledEntityMap.map) {
            memory.push({ entityName: entityName, entityValues: this.MemoryValues(entityName) })
        }
        return memory
    }

    public async Value(entityName: string): Promise<string | null> {
        await this.Init()
        return this.filledEntityMap.ValueAsString(entityName)
    }

    public async ValueAsList(entityName: string): Promise<string[]> {
        await this.Init()
        return this.filledEntityMap.ValueAsList(entityName)
    }

    public async ValueAsPrebuilt(entityName: string): Promise<MemoryValue[]> {
        await this.Init()
        return this.MemoryValues(entityName)
    }

    private MemoryValues(entityName: string): MemoryValue[] {
        if (!this.filledEntityMap.map[entityName]) {
            return []
        }

        return this.filledEntityMap.map[entityName].values
    }
}

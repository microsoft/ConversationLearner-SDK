import { BlisMemory } from '../BlisMemory'
import { BlisDebug } from '../BlisDebug'
import { EntityBase, MemoryValue, FilledEntity } from 'blis-models'

export class ClientMemoryManager {
    public blisMemory: BlisMemory
    private entities: EntityBase[] = []

    public constructor(memory: BlisMemory, entities: EntityBase[]) {
        this.entities = entities
        this.blisMemory = memory
    }

    public FindEntity(entityName: string): EntityBase | undefined {
        let match = this.entities.find(e => e.entityName == entityName)
        return match
    }

    public FindEntityById(entityId: string): EntityBase | undefined {
        let match = this.entities.find(e => e.entityId == entityId)
        return match
    }

    public async RememberEntityAsync(entityName: string, entityValue: string): Promise<void> {
        let entity = this.FindEntity(entityName)

        if (!entity) {
            BlisDebug.Error(`Can't find Entity named: ${entityName}`)
            return
        }

        await this.blisMemory.BotMemory.RememberEntity(entity.entityName, entity.entityId, entityValue, entity.isMultivalue)
    }

    public async RememberEntitiesAsync(entityName: string, entityValues: string[]): Promise<void> {
        let entity = this.FindEntity(entityName)

        if (!entity) {
            BlisDebug.Error(`Can't find Entity named: ${entityName}`)
            return
        }

        await this.blisMemory.BotMemory.RememberMany(entity.entityName, entity.entityId, entityValues, entity.isMultivalue)
    }

    public async ForgetEntityAsync(entityName: string, value: string | null = null): Promise<void> {
        let entity = this.FindEntity(entityName)

        if (!entity) {
            BlisDebug.Error(`Can't find Entity named: ${entityName}`)
            return
        }

        // If no value given, wipe all entites from buckets
        await this.blisMemory.BotMemory.Forget(entity.entityName, value, entity.isMultivalue)
    }

    /** Clear all entity values apart from any included in the list of saveEntityNames
     * Useful in the "onSessionEndCallback" to preserve a subset of entities for the next session
     */
    public async ClearAllEntitiesAsync(saveEntityNames: string[]): Promise<void> {
        
        for (let entity of this.entities) {
            if (saveEntityNames.indexOf(entity.entityName) < 0) {
                await this.blisMemory.BotMemory.Forget(entity.entityName, null, entity.isMultivalue)
            }
        }
    }

    public async CopyEntityAsync(entityNameFrom: string, entityNameTo: string): Promise<void> {
        let entityFrom = this.FindEntity(entityNameFrom)
        let entityTo = this.FindEntity(entityNameTo)

        if (!entityFrom) {
            BlisDebug.Error(`Can't find Entity named: ${entityNameFrom}`)
            return
        }
        if (!entityTo) {
            BlisDebug.Error(`Can't find Entity named: ${entityNameTo}`)
            return
        }

        if (entityFrom.isMultivalue != entityTo.isMultivalue) {
            BlisDebug.Error(`Can't copy between Bucket and Non-Bucket Entities`)
            return
        }

        // Clear "To" entity
        await this.blisMemory.BotMemory.Forget(entityNameTo)

        // Get value of "From" entity
        let values = await this.blisMemory.BotMemory.ValueAsList(entityNameFrom)

        // Copy values from "From"
        for (let value of values) {
            await this.RememberEntityAsync(entityNameTo, value)
        }
    }

    public async EntityValueAsync(entityName: string): Promise<string | null> {
        return await this.blisMemory.BotMemory.Value(entityName)
    }

    public async EntityValueAsPrebuiltAsync(entityName: string): Promise<MemoryValue[]> {
        return await this.blisMemory.BotMemory.ValueAsPrebuilt(entityName)
    }

    public async EntityValueAsListAsync(entityName: string): Promise<string[]> {
        return await this.blisMemory.BotMemory.ValueAsList(entityName)
    }

    public async GetFilledEntitiesAsync(): Promise<FilledEntity[]> {
        return await this.blisMemory.BotMemory.FilledEntitiesAsync()
    }

    public async AppNameAsync(): Promise<string> {
        let app = await this.blisMemory.BotState.AppAsync()
        if (!app) {
            throw new Error(`Attempted to get current app from bot state before app was set.`)
        }
        return app.appName
    }
}

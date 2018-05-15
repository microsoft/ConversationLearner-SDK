/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import { BotMemory } from '../Memory/BotMemory'
import { SessionInfo } from '../Memory/BotState'
import { CLMemory } from '../CLMemory'
import { CLDebug } from '../CLDebug'
import { EntityBase, MemoryValue, FilledEntity, FilledEntityMap, EntityType } from '@conversationlearner/models'

export class ClientMemoryManager {
    public botMemory: BotMemory
    protected entities: EntityBase[] = []
    private sessionInfo: SessionInfo
    private prevMemories: FilledEntityMap

    public static async CreateAsync(clMemory: CLMemory, entities: EntityBase[]): Promise<ClientMemoryManager> {
        let sessionInfo = await clMemory.BotState.SessionInfoAsync()
        let prevMemories = new FilledEntityMap(await clMemory.BotMemory.FilledEntityMap());
        return new ClientMemoryManager(clMemory.BotMemory, prevMemories, entities, sessionInfo);
    }

    private constructor(botMemory: BotMemory, prevMemories: FilledEntityMap, entities: EntityBase[], sessionInfo: SessionInfo) {
        this.entities = entities
        this.botMemory = botMemory
        this.sessionInfo = sessionInfo;
        this.prevMemories = prevMemories;
    }

    private FindEntity(entityName: string): EntityBase | undefined {
        let match = this.entities.find(e => e.entityName == entityName)
        return match
    }

    public async RememberEntityAsync(entityName: string, entityValue: string | number | object): Promise<void> {
        let entity = this.FindEntity(entityName)

        if (!entity) {
            CLDebug.Error(`Can't find Entity named: ${entityName}`)
            return
        }
        if (entity.entityType != EntityType.LOCAL) {
            CLDebug.Error(`Not allowed to set values of pre-built Entities: ${entityName}`)
            return
        }

        if (typeof entityValue == 'object') {
            entityValue = JSON.stringify(entityValue);
        }
        else if (typeof entityValue == 'number' )
        {
            entityValue = entityValue.toString();
        }
        await this.botMemory.RememberEntity(entity.entityName, entity.entityId, entityValue, entity.isMultivalue)
    }

    public async RememberEntitiesAsync(entityName: string, entityValues: string[]): Promise<void> {
        let entity = this.FindEntity(entityName)

        if (!entity) {
            CLDebug.Error(`Can't find Entity named: ${entityName}`)
            return
        }
        if (entity.entityType != EntityType.LOCAL) {
            CLDebug.Error(`Not allowed to set values of pre-built Entities: ${entityName}`)
            return
        }
        if (!entity.isMultivalue) {
            CLDebug.Error(`RememberEntitiesAsync called on entity (${entityName}) that isn't Multi-Value.  Only the last value will be remembered`)
        }

        await this.botMemory.RememberMany(entity.entityName, entity.entityId, entityValues, entity.isMultivalue)
    }

    public async ForgetEntityAsync(entityName: string, value: string | null = null): Promise<void> {
        let entity = this.FindEntity(entityName)

        if (!entity) {
            CLDebug.Error(`Can't find Entity named: ${entityName}`)
            return
        }

        // If no value given, wipe all entites from buckets
        await this.botMemory.Forget(entity.entityName, value, entity.isMultivalue)
    }

    /** Clear all entity values apart from any included in the list of saveEntityNames
     * Useful in the "onSessionEndCallback" to preserve a subset of entities for the next session
     */
    public async ForgetAllEntitiesAsync(saveEntityNames: string[]): Promise<void> {
        
        for (let entity of this.entities) {
            if (saveEntityNames.indexOf(entity.entityName) < 0) {
                await this.botMemory.Forget(entity.entityName, null, entity.isMultivalue)
            }
        }
    }

    public async CopyEntityAsync(entityNameFrom: string, entityNameTo: string): Promise<void> {
        let entityFrom = this.FindEntity(entityNameFrom)
        let entityTo = this.FindEntity(entityNameTo)

        if (!entityFrom) {
            CLDebug.Error(`Can't find Entity named: ${entityNameFrom}`)
            return
        }
        if (!entityTo) {
            CLDebug.Error(`Can't find Entity named: ${entityNameTo}`)
            return
        }

        if (entityFrom.isMultivalue != entityTo.isMultivalue) {
            CLDebug.Error(`Can't copy between Bucket and Non-Bucket Entities`)
            return
        }

        // Clear "To" entity
        await this.botMemory.Forget(entityNameTo)

        // Get value of "From" entity
        let values = await this.botMemory.ValueAsList(entityNameFrom)

        // Copy values from "From"
        for (let value of values) {
            await this.RememberEntityAsync(entityNameTo, value)
        }
    }

    public async EntityValueAsync(entityName: string): Promise<string | null> {
        return await this.botMemory.Value(entityName)
    }

    public async EntityValueAsPrebuiltAsync(entityName: string): Promise<MemoryValue[]> {
        return await this.botMemory.ValueAsPrebuilt(entityName)
    }

    public async EntityValueAsListAsync(entityName: string): Promise<string[]> {
        return await this.botMemory.ValueAsList(entityName)
    }

    public async EntityValueAsNumberAsync(entityName: string): Promise<number | null> {
        const textObj = await this.botMemory.Value(entityName)
        let number = Number(textObj);
        if (isNaN(number)) {
            CLDebug.Error(`EntityValueAsNumberAsync: Entity value "${textObj}" is not number`)
            return null;
        }
        return number;
    }

    public async EntityValueAsBooleanAsync(entityName: string): Promise<boolean | null> {
        const textObj = await this.botMemory.Value(entityName)
        if (textObj) {
            if (textObj.toLowerCase() === 'true') {
                return true;
            }
            if (textObj.toLowerCase() === 'false') {
                return false;
            }
        }
        CLDebug.Error(`EntityValueAsBooleanAsync: Entity value "${textObj}" is not boolean`)
        return null;
    }

    public async EntityValueAsObjectAsync<T>(entityName: string): Promise<T | null> {
        const textObj = await this.botMemory.Value(entityName)
        if (textObj) {
            return JSON.parse(textObj) as T;
        }
        CLDebug.Error(`EntityValueAsObjectAsync: Entity value "${textObj}" is not an object`)
        return null;
    }

    public PrevEntityValue(entityName: string): (string | null) {
        return this.prevMemories.EntityValueAsString(entityName)
    }

    public PrevEntityValueAsPrebuilt(entityName: string): MemoryValue[] {
        if (!this.prevMemories.map[entityName]) {
            return []
        }
        return this.prevMemories.map[entityName].values
    }

    public PrevEntityValueAsList(entityName: string): string[] {
        return this.prevMemories.EntityValueAsList(entityName)
    }

    public PrevValueAsNumber(entityName: string): number | null {
        const textObj = this.prevMemories.EntityValueAsString(entityName)
        let number = Number(textObj);
        if (isNaN(number)) {
            CLDebug.Error(`PrevValueAsNumber: Entity value "${textObj}" is not number`)
            return null;
        }
        return number;
    }

    public PrevValueAsBoolean(entityName: string): boolean | null {
        const textObj = this.prevMemories.EntityValueAsString(entityName)
        if (textObj) {
            if (textObj.toLowerCase() === 'true') {
                return true;
            }
            if (textObj.toLowerCase() === 'false') {
                return false;
            }
        }
        CLDebug.Error(`PrevValueAsBoolean: Entity value "${textObj}" is not boolean`)
        return null;
    }

    public PrevEntityValueAsObject<T>(entityName: string): (T | null) {
        const textObj = this.prevMemories.EntityValueAsString(entityName)
        if (textObj) {
            return JSON.parse(textObj) as T;
        }
        return null;
    }

    public async GetFilledEntitiesAsync(): Promise<FilledEntity[]> {
        return await this.botMemory.FilledEntitiesAsync()
    }

    public SessionInfo(): SessionInfo {
        return this.sessionInfo;
    }
}

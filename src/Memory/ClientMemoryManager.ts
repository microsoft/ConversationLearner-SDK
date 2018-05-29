/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import { SessionInfo } from '../Memory/BotState'
import { CLDebug } from '../CLDebug'
import { EntityBase, MemoryValue, FilledEntity, FilledEntityMap, EntityType } from '@conversationlearner/models'

export class ClientMemoryManager {
    protected allEntities: EntityBase[] = []
    private sessionInfo: SessionInfo
    public prevMemories: FilledEntityMap
    public curMemories: FilledEntityMap

    public constructor(prevMemories: FilledEntityMap, curMemories: FilledEntityMap, allEntities: EntityBase[], sessionInfo: SessionInfo) {
        this.allEntities = allEntities
        this.sessionInfo = sessionInfo
        this.prevMemories = prevMemories
        this.curMemories = curMemories
    }

    private FindEntity(entityName: string): EntityBase | undefined {
        let match = this.allEntities.find(e => e.entityName == entityName)
        return match
    }

    public RememberEntity(entityName: string, entityValue: string | number | object): void {
        let entity = this.FindEntity(entityName)

        if (!entity) {
            CLDebug.Error(`Can't find Entity named: ${entityName}`)
            return
        }
        if (entity.entityType != EntityType.LOCAL && entity.entityType != EntityType.LUIS) {
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
        this.curMemories.Remember(entity.entityName, entity.entityId, entityValue, entity.isMultivalue)
    }

    public RememberEntities(entityName: string, entityValues: string[]): void {
        let entity = this.FindEntity(entityName)

        if (!entity) {
            CLDebug.Error(`Can't find Entity named: ${entityName}`)
            return
        }
        if (entity.entityType != EntityType.LOCAL && entity.entityType != EntityType.LUIS) {
            CLDebug.Error(`Not allowed to set values of pre-built Entities: ${entityName}`)
            return
        }
        if (!entity.isMultivalue) {
            CLDebug.Error(`RememberEntitiesAsync called on entity (${entityName}) that isn't Multi-Value.  Only the last value will be remembered`)
        }

        this.curMemories.RememberMany(entity.entityName, entity.entityId, entityValues, entity.isMultivalue)
    }

    public ForgetEntity(entityName: string, value: string | null = null): void {
        let entity = this.FindEntity(entityName)

        if (!entity) {
            CLDebug.Error(`Can't find Entity named: ${entityName}`)
            return
        }

        // If no value given, wipe all entites from buckets
        this.curMemories.Forget(entity.entityName, value, entity.isMultivalue)
    }

    /** Clear all entity values apart from any included in the list of saveEntityNames
     * Useful in the "onSessionEndCallback" to preserve a subset of entities for the next session
     */
    public ForgetAllEntitiesAsync(saveEntityNames: string[]): void {
        
        for (let entity of this.allEntities) {
            if (saveEntityNames.indexOf(entity.entityName) < 0) {
                this.curMemories.Forget(entity.entityName, null, entity.isMultivalue)
            }
        }
    }

    public CopyEntity(entityNameFrom: string, entityNameTo: string): void {
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
        this.curMemories.Forget(entityNameTo)

        // Get value of "From" entity
        let values = this.curMemories.ValueAsList(entityNameFrom)

        // Copy values from "From"
        for (let value of values) {
            this.RememberEntity(entityNameTo, value)
        }
    }

    public EntityValue(entityName: string): string | null {
        return this.curMemories.ValueAsString(entityName)
    }

    public PrevEntityValue(entityName: string): (string | null) {
        return this.prevMemories.ValueAsString(entityName)
    }

    public EntityValueAsPrebuilt(entityName: string): MemoryValue[] {
        return this.curMemories.ValueAsPrebuilt(entityName)
    }

    public PrevEntityValueAsPrebuilt(entityName: string): MemoryValue[] {
        return this.prevMemories.ValueAsPrebuilt(entityName)
    }

    public EntityValueAsList(entityName: string): string[] {
        return this.curMemories.ValueAsList(entityName)
    }

    public PrevEntityValueAsList(entityName: string): string[] {
        return this.prevMemories.ValueAsList(entityName)
    }

    public EntityValueAsNumber(entityName: string): number | null {
        return this.curMemories.ValueAsNumber(entityName)
    }

    public PrevValueAsNumber(entityName: string): number | null {
        return this.prevMemories.ValueAsNumber(entityName)
    }

    public EntityValueAsBoolean(entityName: string): boolean | null {
        return this.curMemories.ValueAsBoolean(entityName)
    }

    public PrevValueAsBoolean(entityName: string): boolean | null {
        return this.prevMemories.ValueAsBoolean(entityName)
    }

    public EntityValueAsObject<T>(entityName: string): T | null {
        return this.curMemories.ValueAsObject(entityName)
    }

    public PrevEntityValueAsObject<T>(entityName: string): (T | null) {
        return this.prevMemories.ValueAsObject(entityName)
    }

    public GetFilledEntitiesAsync(): FilledEntity[] {
        return this.curMemories.FilledEntities()
    }

    public SessionInfo(): SessionInfo {
        return this.sessionInfo;
    }
}

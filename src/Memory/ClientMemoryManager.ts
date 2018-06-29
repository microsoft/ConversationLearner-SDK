/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import { SessionInfo } from '../Memory/BotState'
import { CLDebug } from '../CLDebug'
import { EntityBase, MemoryValue, FilledEntityMap, EntityType } from '@conversationlearner/models'

const errMsg = "called after your function has already returned. You must await results within your code rather than use callbacks"

export class ClientMemoryManager {
    protected allEntities: EntityBase[] = []
    private sessionInfo: SessionInfo
    public prevMemories: FilledEntityMap
    public curMemories: FilledEntityMap
    private __expired: boolean


    public constructor(prevMemories: FilledEntityMap, curMemories: FilledEntityMap, allEntities: EntityBase[], sessionInfo: SessionInfo) {
        this.allEntities = allEntities
        this.sessionInfo = sessionInfo
        this.prevMemories = prevMemories
        this.curMemories = curMemories
        this.__expired = false
    }

    public __Expire(): void {
        this.__expired = true
    }

    private __FindEntity(entityName: string): EntityBase | undefined {
        let match = this.allEntities.find(e => e.entityName == entityName)
        return match
    }

    public RememberEntity(entityName: string, entityValue: string | number | object): void {

        if (this.__expired) {
            CLDebug.Error(`ClientMemoryManager: RememberEntity "${entityName}" ${errMsg}`)
            return
        }

        let entity = this.__FindEntity(entityName)

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

        if (this.__expired) {
            CLDebug.Error(`ClientMemoryManager: RememberEntities "${entityName}" ${errMsg}`)
            return
        }

        let entity = this.__FindEntity(entityName)

        if (!entity) {
            CLDebug.Error(`Can't find Entity named: ${entityName}`)
            return
        }
        if (entity.entityType != EntityType.LOCAL && entity.entityType != EntityType.LUIS) {
            CLDebug.Error(`Not allowed to set values of pre-built Entities: ${entityName}`)
            return
        }
        if (!entity.isMultivalue) {
            CLDebug.Error(`RememberEntities called on entity (${entityName}) that isn't Multi-Value.  Only the last value will be remembered`)
        }

        this.curMemories.RememberMany(entity.entityName, entity.entityId, entityValues, entity.isMultivalue)
    }

    public ForgetEntity(entityName: string, value: string | null = null): void {

        if (this.__expired) {
            CLDebug.Error(`ClientMemoryManager: ForgetEntity "${entityName}" ${errMsg}`)
            return
        }

        let entity = this.__FindEntity(entityName)

        if (!entity) {
            CLDebug.Error(`Can't find Entity named: ${entityName}`)
            return
        }

        // If no value given, wipe all entites from buckets
        this.curMemories.Forget(entity.entityName, value, entity.isMultivalue)
    }

    /** Clear all entity values apart from any included in the list of saveEntityNames 
     * @param saveEntityNames Array of entity names not to forget
     */
    public ForgetAllEntities(saveEntityNames: string[]): void {
        
        if (this.__expired) {
            CLDebug.Error(`ClientMemoryManager: ForgetAllEntities ${errMsg}`)
            return
        }

        for (let entity of this.allEntities) {
            if (saveEntityNames.indexOf(entity.entityName) < 0) {
                this.curMemories.Forget(entity.entityName, null, entity.isMultivalue)
            }
        }
    }

    /**
     * Copy values from one entity to another
     * @param entityNameFrom Source Entity
     * @param entityNameTo Destination Entity
     */
    public CopyEntity(entityNameFrom: string, entityNameTo: string): void {

        if (this.__expired) {
            CLDebug.Error(`ClientMemoryManager: CopyEntity ${errMsg}`)
            return
        }

        let entityFrom = this.__FindEntity(entityNameFrom)
        let entityTo = this.__FindEntity(entityNameTo)

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

    /**
     * Get value of entity 
     * @param entityName Name of Entity
     */
    public EntityValue(entityName: string): string | null {
        return this.curMemories.ValueAsString(entityName)
    }

    /**
     * Get value of entity before most recent input
     * @param entityName Name of Entity
     */
    public PrevEntityValue(entityName: string): (string | null) {
        return this.prevMemories.ValueAsString(entityName)
    }

    /**
     * Get value of entity as a Prebuilt Entity 
     * @param entityName Name of Entity
     */
    public EntityValueAsPrebuilt(entityName: string): MemoryValue[] {
        return this.curMemories.ValueAsPrebuilt(entityName)
    }

    /**
     * Get value of entity before most recent input as a Prebuilt Entity 
     * @param entityName Name of Entity
     */
    public PrevEntityValueAsPrebuilt(entityName: string): MemoryValue[] {
        return this.prevMemories.ValueAsPrebuilt(entityName)
    }

    /**
     * Get entity values a comma delminated string
     * @param entityName Name of Entity
     */
    public EntityValueAsList(entityName: string): string[] {
        return this.curMemories.ValueAsList(entityName)
    }

    /**
     * Get entity values before most recent input a comma delminated string
     * @param entityName Name of Entity
     */
    public PrevEntityValueAsList(entityName: string): string[] {
        return this.prevMemories.ValueAsList(entityName)
    }

    /**
     * Get entity value as a number
     * @param entityName Name of Entity
     */
    public EntityValueAsNumber(entityName: string): number | null {
        return this.curMemories.ValueAsNumber(entityName)
    }

    /**
     * Get entity value before most recent input as a number
     * @param entityName Name of Entity
     */
    public PrevValueAsNumber(entityName: string): number | null {
        return this.prevMemories.ValueAsNumber(entityName)
    }

    /**
     * Get entity value as a boolean
     * @param entityName Name of Entity
     */
    public EntityValueAsBoolean(entityName: string): boolean | null {
        return this.curMemories.ValueAsBoolean(entityName)
    }

    /**
     * Get entity value before most recent input as a boolean
     * @param entityName Name of Entity
     */
    public PrevValueAsBoolean(entityName: string): boolean | null {
        return this.prevMemories.ValueAsBoolean(entityName)
    }

    /**
     * Get entity value as object of type T
     * @param entityName Name of Entity
     */
    public EntityValueAsObject<T>(entityName: string): T | null {
        return this.curMemories.ValueAsObject(entityName)
    }

    /**
     * Get entity value before most recent input as object of type T
     * @param entityName Name of Entity
     */
    public PrevEntityValueAsObject<T>(entityName: string): (T | null) {
        return this.prevMemories.ValueAsObject(entityName)
    }

    /**
     * Get information about the current running session
     */
    public SessionInfo(): SessionInfo {
        return this.sessionInfo;
    }
}

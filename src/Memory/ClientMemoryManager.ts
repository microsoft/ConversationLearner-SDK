/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { SessionInfo } from '../Memory/BotState'
import { CLStrings } from '../CLStrings'
import { EntityBase, MemoryValue, FilledEntityMap, EntityType } from '@conversationlearner/models'

const errMsg = "called after your function has already returned. You must await results within your code rather than use callbacks"

export class ReadOnlyClientMemoryManager {
    protected allEntities: EntityBase[] = []
    private sessionInfo: SessionInfo
    public prevMemories: FilledEntityMap
    public curMemories: FilledEntityMap
    protected __expired: boolean


    public constructor(prevMemories: FilledEntityMap, curMemories: FilledEntityMap, allEntities: EntityBase[], sessionInfo: SessionInfo) {
        this.allEntities = allEntities
        this.sessionInfo = sessionInfo
        this.prevMemories = prevMemories
        this.curMemories = curMemories
        this.__expired = false
    }

    // TODO: Why is this public but prefixed with __ to indicate private
    public __Expire(): void {
        this.__expired = true
    }

    protected __FindEntity(entityName: string): EntityBase | undefined {
        let match = this.allEntities.find(e => e.entityName == entityName)
        return match
    }

    /**
     * Get value of entity as a string
     * @param entityName Name of Entity
     */
    public EntityValueAsString(entityName: string): string | null {
        return this.curMemories.ValueAsString(entityName)
    }

    /**
     * Get value of entity as string before most recent input
     * @param entityName Name of Entity
     */
    public PrevEntityValueAsString(entityName: string): (string | null) {
        return this.prevMemories.ValueAsString(entityName)
    }

    /**
     * Get array of MemoryValues 
     * @param entityName Name of Entity
     */
    public EntityValues(entityName: string): MemoryValue[] {
        return this.curMemories.Values(entityName)
    }

    /**
     * Get array of MemoryValues before most recent input as a Prebuilt Entity
     * @param entityName Name of Entity
     */
    public PrevEntityValues(entityName: string): MemoryValue[] {
        return this.prevMemories.Values(entityName)
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

export class ClientMemoryManager extends ReadOnlyClientMemoryManager {
    public constructor(prevMemories: FilledEntityMap, curMemories: FilledEntityMap, allEntities: EntityBase[], sessionInfo: SessionInfo) {
        super(prevMemories, curMemories, allEntities, sessionInfo)
    }

    public AsReadOnly(): ReadOnlyClientMemoryManager {
        return this
    }

    public RememberEntity(entityName: string, entityValue: string | number | object): void {
        if (this.__expired) {
            throw new Error(`ClientMemoryManager: RememberEntity "${entityName}" ${errMsg}`)
        }

        let entity = this.__FindEntity(entityName)

        if (!entity) {
            throw new Error(`${CLStrings.API_MISSING_ENTITY} ${entityName}`)
        }
        if (entity.entityType != EntityType.LOCAL && entity.entityType != EntityType.LUIS) {
            throw new Error(`Not allowed to set values of pre-built Entities: ${entityName}`)
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
            throw new Error(`ClientMemoryManager: RememberEntities "${entityName}" ${errMsg}`)
        }

        let entity = this.__FindEntity(entityName)

        if (!entity) {
            throw new Error(`${CLStrings.API_MISSING_ENTITY} ${entityName}`)
        }
        if (entity.entityType != EntityType.LOCAL && entity.entityType != EntityType.LUIS) {
            throw new Error(`Not allowed to set values of pre-built Entities: ${entityName}`)
        }
        if (!entity.isMultivalue) {
            throw new Error(`RememberEntities called on entity (${entityName}) that isn't Multi-Value.  Only the last value will be remembered`)
        }

        this.curMemories.RememberMany(entity.entityName, entity.entityId, entityValues, entity.isMultivalue)
    }

    public ForgetEntity(entityName: string, value: string | null = null): void {

        if (this.__expired) {
            throw new Error(`ClientMemoryManager: ForgetEntity "${entityName}" ${errMsg}`)
        }

        let entity = this.__FindEntity(entityName)

        if (!entity) {
            throw new Error(`${CLStrings.API_MISSING_ENTITY} ${entityName}`)
        }

        // If no value given, wipe all entites from buckets
        this.curMemories.Forget(entity.entityName, value, entity.isMultivalue)
    }

    /** Clear all entity values apart from any included in the list of saveEntityNames
     * @param saveEntityNames Array of entity names not to forget
     */
    public ForgetAllEntities(saveEntityNames: string[]): void {
        if (this.__expired) {
            throw new Error(`ClientMemoryManager: ForgetAllEntities ${errMsg}`)
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
            throw new Error(`ClientMemoryManager: CopyEntity ${errMsg}`)
        }

        let entityFrom = this.__FindEntity(entityNameFrom)
        let entityTo = this.__FindEntity(entityNameTo)

        if (!entityFrom) {
            throw new Error(`${CLStrings.API_MISSING_ENTITY} ${entityNameFrom}`)
        }
        if (!entityTo) {
            throw new Error(`${CLStrings.API_MISSING_ENTITY} ${entityNameTo}`)
        }
        if (entityFrom.isMultivalue != entityTo.isMultivalue) {
            throw new Error(`Can't copy between multivalue and non-multivalue Entity (${entityNameFrom} -> ${entityNameTo})`)
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
}
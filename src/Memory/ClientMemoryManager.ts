/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { SessionInfo } from '../Memory/BotState'
import { CLStrings } from '../CLStrings'
import { EntityBase, MemoryValue, FilledEntityMap, EntityType, memoryValuesAsString } from '@conversationlearner/models'

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

    public Expire(): void {
        this.__expired = true
    }

    protected __FindEntity(entityName: string): EntityBase | undefined {
        let match = this.allEntities.find(e => e.entityName == entityName)
        return match
    }

    protected __ToString(value: string | number | boolean | object): string {
        if (typeof value == 'object') {
            return JSON.stringify(value);
        }
        return value.toString()
    }

    /**
     * Get current value of entity 
     */
    public Get<T = MemoryValue[]>(entityName: string, converter?: (memoryValues: MemoryValue[]) => T): T extends MemoryValue[] ? MemoryValue[] : T {
        return this.GetValues(entityName, this.curMemories, converter)
    }

    /**
     * Get value of entity before most recent input
     */
    public GetPrevious<T = MemoryValue[]>(entityName: string, converter?: (memoryValues: MemoryValue[]) => T): T extends MemoryValue[] ? MemoryValue[] : T {
        return this.GetValues(entityName, this.prevMemories, converter)
    }

    /**
     * Get information about the current running session
     */
    public SessionInfo(): SessionInfo {
        return this.sessionInfo;
    }

    public static AS_VALUE(memoryValues: MemoryValue[]): MemoryValue {
        if (memoryValues.length > 0) {
            throw new Error(CLStrings.MEMORY_MANAGER_VALUE_LIST_EXCEPTION)
        }
        return memoryValues[0]
    }

    public static AS_VALUE_LIST(memoryValues: MemoryValue[]): MemoryValue[] {
        return memoryValues
    }

    public static AS_STRING(memoryValues: MemoryValue[]): string {
        return memoryValuesAsString(memoryValues)
    }

    public static AS_STRING_LIST(memoryValues: MemoryValue[]): string[] {
        return memoryValues.map(mv => {
            if (typeof mv.userText !== 'string') {
                throw new Error(CLStrings.MEMORY_MANAGER_NOT_A_STRING_EXCEPTION)
            }
            return mv.userText
        })
    }

    public static AS_NUMBER(memoryValues: MemoryValue[]): number {
        if (memoryValues.length > 0) {
            throw new Error(CLStrings.MEMORY_MANAGER_NUMBER_LIST_EXCEPTION)
        }
        let number = Number(memoryValues[0].userText)
        if (isNaN(number)) {
            throw new Error(CLStrings.MEMORY_MANAGER_NOT_A_NUMBER_EXCEPTION)
        }
        return number
    }

    public static AS_NUMBER_LIST(memoryValues: MemoryValue[]): number[] {
        return memoryValues.map(mv => {
            let number = Number(mv.userText)
            if (isNaN(number)) {
                throw new Error(CLStrings.MEMORY_MANAGER_NOT_A_NUMBER_EXCEPTION)
            }
            return number
        })
    }

    public static AS_BOOLEAN(memoryValues: MemoryValue[]): boolean {
        if (memoryValues.length > 0) {
            throw new Error(CLStrings.MEMORY_MANAGER_BOOLEAN_LIST_EXCEPTION)
        }
        let text = memoryValuesAsString(memoryValues)
        if (text.toLowerCase() === 'true') {
            return true
        }
        if (text.toLowerCase() === 'false') {
            return false
        }
        throw new Error(CLStrings.MEMORY_MANAGER_NOT_A_BOOLEAN_EXCEPTION)
    }

    public static AS_BOOLEAN_LIST(memoryValues: MemoryValue[]): boolean[] {
        return memoryValues.map(mv => {
            if (!mv.userText) {
                throw new Error(CLStrings.MEMORY_MANAGER_NOT_A_BOOLEAN_EXCEPTION)
            }
            if (mv.userText.toLowerCase() === 'true') {
                return true
            }
            if (mv.userText.toLowerCase() === 'false') {
                return false
            }
            throw new Error(CLStrings.MEMORY_MANAGER_NOT_A_BOOLEAN_EXCEPTION)
        })
    }

    private GetValues<T = MemoryValue[]>(entityName: string, entityMap: FilledEntityMap, converter?: (memoryValues: MemoryValue[]) => T): T extends MemoryValue[] ? MemoryValue[] : T {
        // cast to conditional type is necessary
        // see here for description https://github.com/Microsoft/TypeScript/issues/22735#issuecomment-376960435
        if (!converter) {
            return <T extends MemoryValue[] ? MemoryValue[] : T>entityMap.Values(entityName)
        }
        return <T extends MemoryValue[] ? MemoryValue[] : T>converter(entityMap.Values(entityName))
    }
}

export class ClientMemoryManager extends ReadOnlyClientMemoryManager {
    public constructor(prevMemories: FilledEntityMap, curMemories: FilledEntityMap, allEntities: EntityBase[], sessionInfo: SessionInfo) {
        super(prevMemories, curMemories, allEntities, sessionInfo)
    }

    public AsReadOnly(): ReadOnlyClientMemoryManager {
        return this
    }

    public Set(entityName: string, value: string | number | boolean | object | string[] | number[] | boolean[] | object[]): void {
        if (this.__expired) {
            throw new Error(`ClientMemoryManager: RememberEntity "${entityName}" ${errMsg}`)
        }

        let entity = this.__FindEntity(entityName)

        if (!entity) {
            throw new Error(`${CLStrings.API_MISSING_ENTITY} ${entityName}`)
        }
        if (entity.entityType != EntityType.LOCAL && entity.entityType != EntityType.LUIS) {
            throw new Error(`${CLStrings.MEMORY_MANAGER_PRETRAINED_EXCEPTION} ${entityName}`)
        }

        if (Array.isArray(value)) {
            if (!entity.isMultivalue) {
                throw new Error(`Array passed to Set for entity (${entityName}) that isn't Multi-Value.`)
            }
            let stringValues = (value as any).map((v: any) => {
                return this.__ToString(v)
            })
            this.curMemories.RememberMany(entity.entityName, entity.entityId, stringValues, entity.isMultivalue)
        }
        else {
            let stringValue = this.__ToString(value)
            this.curMemories.Remember(entity.entityName, entity.entityId, stringValue, entity.isMultivalue)
        }
    }

    public Delete(entityName: string, value: string | null = null): void {
        if (this.__expired) {
            throw new Error(`ClientMemoryManager: ForgetEntity "${entityName}" ${errMsg}`)
        }

        let entity = this.__FindEntity(entityName)

        if (!entity) {
            throw new Error(`${CLStrings.API_MISSING_ENTITY} ${entityName}`)
        }

        // delete entity if it is single value or specified value if it is multivalue
        if (value || !entity.isMultivalue) {
            this.curMemories.Forget(entity.entityName, value, entity.isMultivalue)
        }
    }

    /** Clear all entity values apart from any included in the list of saveEntityNames
     * @param saveEntityNames Array of entity names not to forget
     */
    public DeleteAll(saveEntityNames: string[]): void {
        if (this.__expired) {
            throw new Error(`ClientMemoryManager: DeleteAll ${errMsg}`)
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
            this.Set(entityNameTo, value)
        }
    }
}
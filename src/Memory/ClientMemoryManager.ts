/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { SessionInfo } from '../Memory/BotState'
import { CLStrings } from '../CLStrings'
import * as CLM from '@conversationlearner/models'

export type MemoryManagerReturnType<T> =
    T extends CLM.MemoryValue[] | CLM.MemoryValue
    ? T extends CLM.MemoryValue[]
    ? CLM.MemoryValue[]
    : CLM.MemoryValue
    : T

export enum ChangeType {
    ADDED = 'ADDED',
    REMOVED = 'REMOVED',
    CHANGED = 'CHANGED',
    UNCHANGED = 'UNCHANGED',
    UNKNOWN = 'UNKNOWN',
}

export interface IChangedEntity {
    changeType: ChangeType
}

export interface IChangedMemory<T> extends IChangedEntity {
    name: string
    value: CLM.MemoryValue | CLM.MemoryValue[]
}

export class ReadOnlyClientMemoryManager {
    protected allEntities: CLM.EntityBase[] = []
    private sessionInfo: SessionInfo
    public prevMemories: CLM.FilledEntityMap
    public curMemories: CLM.FilledEntityMap
    protected __expired: boolean


    public constructor(prevMemories: CLM.FilledEntityMap, curMemories: CLM.FilledEntityMap, allEntities: CLM.EntityBase[], sessionInfo: SessionInfo) {
        this.allEntities = allEntities
        this.sessionInfo = sessionInfo
        this.prevMemories = prevMemories
        this.curMemories = curMemories
        this.__expired = false
    }

    public Expire(): void {
        this.__expired = true
    }

    protected __FindEntity(entityName: string): CLM.EntityBase | undefined {
        return this.allEntities.find(e => e.entityName == entityName)
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
    public Get<T = CLM.MemoryValue[] | CLM.MemoryValue>(entityName: string, converter?: (memoryValues: CLM.MemoryValue[]) => T): MemoryManagerReturnType<T> {
        return this.GetValues(entityName, this.curMemories, converter)
    }

    /**
     * Get value of entity before most recent input
     */
    public GetPrevious<T = CLM.MemoryValue[] | CLM.MemoryValue>(entityName: string, converter?: (memoryValues: CLM.MemoryValue[]) => T): MemoryManagerReturnType<T> {
        return this.GetValues(entityName, this.prevMemories, converter)
    }

    /**
     * Categorize each entity as ADDED, REMOVED, CHANGED, or UNCHANGED
     * @param converter Method to transform string text into typed value
     */
    changes<T = CLM.MemoryValue[] | CLM.MemoryValue>(converter?: (memoryValues: CLM.MemoryValue[]) => T): IChangedMemory<T>[] {
        return this.allEntities.map<IChangedMemory<T>>(entity => {
            const current = this.Get(entity.entityName)
            const previous = this.GetPrevious(entity.entityName)

            let change: IChangedMemory<T> | undefined

            /**
             * For multi-value when entity is not present this.Get returns empty arrays
             * For single-value when entity is not present this.Get returns null
             */

            // If both entities are single-value
            if (!Array.isArray(current) && !Array.isArray(previous)) {
                // If added
                if (current && !previous) {
                    change = {
                        name: entity.entityName,
                        value: current,
                        changeType: ChangeType.ADDED,
                    }
                }
                // If removed
                else if (!current && previous) {
                    change = {
                        name: entity.entityName,
                        value: current,
                        changeType: ChangeType.REMOVED,
                    }
                }
                // If both are not present or both are present and have same userText, consider UNCHANGED
                else if ((!current && !previous)
                    || ((current && previous)
                        && (current.userText === previous.userText))) {
                    // Note: Would need to get raw value and then convert later to avoid comparing after conversion
                    // This could generate new objects which would always show as CHANGED
                    change = {
                        name: entity.entityName,
                        value: current,
                        changeType: ChangeType.UNCHANGED,
                    }
                }
                else {
                    change = {
                        name: entity.entityName,
                        value: current,
                        changeType: ChangeType.CHANGED,
                    }
                }
            }
            // If both entities are multi-value
            else if (Array.isArray(current) && Array.isArray(previous)) {
                // If added
                if ((current.length !== 0) && (previous.length === 0)) {
                    change = {
                        name: entity.entityName,
                        value: current,
                        changeType: ChangeType.ADDED,
                    }
                }
                // If removed
                else if ((current.length === 0) && (previous.length !== 0)) {
                    change = {
                        name: entity.entityName,
                        value: current,
                        changeType: ChangeType.REMOVED,
                    }
                }
                // If values are same length (could be empty) and userText of each item is the same assume unchanged.
                // TODO: Could go further with ITEMS_ADDED, ITEMS_REMOVED, but adds a lot of complexity as you can ADD_ITEMS while also editing items etc.
                // Otherwise, assume it has changed
                else if (current.length === previous.length
                    && current.every((value, i) => previous[i].userText === value.userText)) {
                    change = {
                        name: entity.entityName,
                        value: current,
                        changeType: ChangeType.UNCHANGED
                    }
                }
                else {
                    change = {
                        name: entity.entityName,
                        value: current,
                        changeType: ChangeType.CHANGED
                    }
                }
            }
            // Based on other logic it shouldn't be possible, but there is no guarantee that an entity values can't go from [] to null
            // We can't compare these types so set it as UNKNOWN type
            else {
                change = {
                    name: entity.entityName,
                    value: current,
                    changeType: ChangeType.UNKNOWN
                }
            }

            if (!change) {
                throw new Error(`You attempted to add a change to list of changes in memory but change was undefined. There is likely an error, this should not be possible.`)
            }

            return change
        }, [])
    }

    added() {
        return this.changes()
            .filter(c => c.changeType === ChangeType.ADDED)
    }

    removed() {
        return this.changes()
            .filter(c => c.changeType === ChangeType.REMOVED)
    }

    /**
     * Get information about the current running session
     */
    public SessionInfo(): SessionInfo {
        return this.sessionInfo;
    }

    public static AS_VALUE(memoryValues: CLM.MemoryValue[]): CLM.MemoryValue | null {
        if (memoryValues.length > 1) {
            throw new Error(CLStrings.MEMORY_MANAGER_VALUE_LIST_EXCEPTION)
        }
        return memoryValues.length == 0 ? null : memoryValues[0]
    }

    public static AS_VALUE_LIST(memoryValues: CLM.MemoryValue[]): CLM.MemoryValue[] {
        return memoryValues
    }

    public static AS_STRING(memoryValues: CLM.MemoryValue[]): string | null {
        return memoryValues.length == 0 ? null : CLM.memoryValuesAsString(memoryValues)
    }

    public static AS_STRING_LIST(memoryValues: CLM.MemoryValue[]): string[] {
        return memoryValues.map(mv => {
            if (typeof mv.userText !== 'string') {
                throw new Error(CLStrings.MEMORY_MANAGER_NOT_A_STRING_EXCEPTION)
            }
            return mv.userText
        })
    }

    public static AS_NUMBER(memoryValues: CLM.MemoryValue[]): number | null {
        if (memoryValues.length == 0) {
            return null
        }
        if (memoryValues.length > 1) {
            throw new Error(CLStrings.MEMORY_MANAGER_NUMBER_LIST_EXCEPTION)
        }
        const number = Number(memoryValues[0].userText)
        if (isNaN(number)) {
            throw new Error(CLStrings.MEMORY_MANAGER_NOT_A_NUMBER_EXCEPTION)
        }
        return number
    }

    public static AS_NUMBER_LIST(memoryValues: CLM.MemoryValue[]): number[] {
        return memoryValues.map(mv => {
            let number = Number(mv.userText)
            if (isNaN(number)) {
                throw new Error(CLStrings.MEMORY_MANAGER_NOT_A_NUMBER_EXCEPTION)
            }
            return number
        })
    }

    public static AS_BOOLEAN(memoryValues: CLM.MemoryValue[]): boolean | null {
        if (memoryValues.length == 0) {
            return null
        }
        if (memoryValues.length > 1) {
            throw new Error(CLStrings.MEMORY_MANAGER_BOOLEAN_LIST_EXCEPTION)
        }
        let text = CLM.memoryValuesAsString(memoryValues)
        if (text.toLowerCase() === 'true') {
            return true
        }
        if (text.toLowerCase() === 'false') {
            return false
        }
        throw new Error(CLStrings.MEMORY_MANAGER_NOT_A_BOOLEAN_EXCEPTION)
    }

    public static AS_BOOLEAN_LIST(memoryValues: CLM.MemoryValue[]): boolean[] {
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

    private GetValues<T = CLM.MemoryValue[]>(entityName: string, entityMap: CLM.FilledEntityMap, converter?: (memoryValues: CLM.MemoryValue[]) => T): MemoryManagerReturnType<T> {

        let values = entityMap.Values(entityName)
        const entity = this.__FindEntity(entityName);
        if (entity && entity.entityType === CLM.EntityType.LUIS && entity.enumValues) {
            for (let value of values) {
                const enumValue = entity.enumValues.find(ev => ev.enumValue === value.enumValueId)
                value.displayText = enumValue ? enumValue.enumValue : null
            }
        }

        // cast to conditional type is necessary
        // see here for description https://github.com/Microsoft/TypeScript/issues/22735#issuecomment-376960435
        if (!converter) {
            const entityValues = entityMap.Values(entityName)
            const foundEntity = this.__FindEntity(entityName);
            if (foundEntity && !foundEntity.isMultivalue) {
                return <MemoryManagerReturnType<T>>ClientMemoryManager.AS_VALUE(entityValues)
            }
            return <MemoryManagerReturnType<T>>entityValues
        }
        return <MemoryManagerReturnType<T>>converter(entityMap.Values(entityName))
    }
}

export class ClientMemoryManager extends ReadOnlyClientMemoryManager {

    public constructor(prevMemories: CLM.FilledEntityMap, curMemories: CLM.FilledEntityMap, allEntities: CLM.EntityBase[], sessionInfo: SessionInfo) {
        super(prevMemories, curMemories, allEntities, sessionInfo)
    }

    public AsReadOnly(): ReadOnlyClientMemoryManager {
        return this
    }

    public Set(entityName: string, value: string | number | boolean | object | string[] | number[] | boolean[] | object[]): void {
        if (this.__expired) {
            throw new Error(`ClientMemoryManager: RememberEntity "${entityName}" ${CLStrings.MEMORY_MANAGER_EXPIRED_EXCEPTION}`)
        }

        let entity = this.__FindEntity(entityName)

        if (!entity) {
            throw new Error(`${CLStrings.API_MISSING_ENTITY} ${entityName}`)
        }
        if (CLM.isPrebuilt(entity)) {
            throw new Error(`${CLStrings.MEMORY_MANAGER_PRETRAINED_EXCEPTION} ${entityName}`)
        }

        // ENUM entity type
        if (entity.entityType === CLM.EntityType.ENUM && entity.enumValues) {
            const stringVal = this.__ToString(value).toUpperCase()
            const enumValue = entity.enumValues.find(ev => ev.enumValue === stringVal)
            if (!enumValue) {
                const enumValues = entity.enumValues.map(ev => ev.enumValue).join(", ")
                // Throw w/o a stack trace
                throw `"${entityName}"${CLStrings.MEMORY_MANAGER_INVALID_ENUM_EXCEPTION1}"${stringVal}"${CLStrings.MEMORY_MANAGER_INVALID_ENUM_EXCEPTION2}(${enumValues})`
            }
            else {
                // Store ENUM ID not the string value
                this.curMemories.Remember(entity.entityName, entity.entityId, enumValue.enumValue, entity.isMultivalue, null, null, enumValue.enumValueId!)
            }
        }
        else if (Array.isArray(value)) {
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
            throw new Error(`ClientMemoryManager: ForgetEntity "${entityName}" ${CLStrings.MEMORY_MANAGER_EXPIRED_EXCEPTION}`)
        }

        let entity = this.__FindEntity(entityName)

        if (!entity) {
            throw new Error(`${CLStrings.API_MISSING_ENTITY} ${entityName}`)
        }

        this.curMemories.Forget(entity.entityName, value, entity.isMultivalue)
    }

    public DeleteAll = () => this.DeleteAllExcept()

    /** Delete all entity values apart from any included in the list of saveEntityNames
     * @param saveEntityNames Array of entity names not to forget
     */
    public DeleteAllExcept(...saveEntityNames: string[]): void {
        if (this.__expired) {
            throw new Error(`ClientMemoryManager: DeleteAll ${CLStrings.MEMORY_MANAGER_EXPIRED_EXCEPTION}`)
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
    public Copy(entityNameFrom: string, entityNameTo: string): void {

        if (this.__expired) {
            throw new Error(`ClientMemoryManager: Copy ${CLStrings.MEMORY_MANAGER_EXPIRED_EXCEPTION}`)
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
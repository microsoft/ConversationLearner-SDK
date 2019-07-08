/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { FilledEntityMap, EntityBase, EntityType, MemoryValue } from '@conversationlearner/models'
import { ClientMemoryManager } from '..'
import { SessionInfo } from './BotState'
import { ChangeType } from './ClientMemoryManager';

describe('ClientMemoryManager', () => {
    describe('ReadOnlyClientMemoryManager', () => {
        describe('changed', () => {
            const baseEntity: EntityBase = {
                entityId: 'entityBaseId',
                entityName: 'entityBaseName',
                entityType: EntityType.LUIS,
                resolverType: null,
                createdDateTime: '',
                version: null,
                packageCreationId: null,
                packageDeletionId: null,
                isMultivalue: false,
                isNegatible: false,
                negativeId: null,
                positiveId: null,
                doNotMemorize: null
            }

            const entities: EntityBase[] = [
                {
                    ...baseEntity,
                    entityId: 'entityId1',
                    entityName: 'entityName1',
                },
                {
                    ...baseEntity,
                    entityId: 'entityId2',
                    entityName: 'entityName2',
                },
                {
                    ...baseEntity,
                    entityId: 'entityId3',
                    entityName: 'entityName3',
                },
                {
                    ...baseEntity,
                    entityId: 'entityId4',
                    entityName: 'entityName4',
                },
                {
                    ...baseEntity,
                    isMultivalue: true,
                    entityId: 'entityId5',
                    entityName: 'entityName5',
                },
                {
                    ...baseEntity,
                    isMultivalue: true,
                    entityId: 'entityId6',
                    entityName: 'entityName6',
                },
                {
                    ...baseEntity,
                    isMultivalue: true,
                    entityId: 'entityId7',
                    entityName: 'entityName7',
                },
                {
                    ...baseEntity,
                    isMultivalue: true,
                    entityId: 'entityId8',
                    entityName: 'entityName8',
                },
                {
                    ...baseEntity,
                    isMultivalue: true,
                    entityId: 'entityId9',
                    entityName: 'entityName9',
                },
                {
                    ...baseEntity,
                    isMultivalue: true,
                    entityId: 'entityId10',
                    entityName: 'entityName10',
                },
            ]

            // Do not use directly, use as template and make copies
            const memoryValueBase: MemoryValue = {
                userText: "Entity 1 - Single Value String",
                displayText: "displayText",
                builtinType: "builtinType",
                resolution: {},
                enumValueId: null
            }

            /**
             * Conditions to create with maps for tests
             * 
             * Single Value Changes
             * Entity 1: Value 1            -> Value 1                  -> Unchanged
             * Entity 2: Value 1            -> Value 1 Edited           -> Modified
             * Entity 3: Value 1            ->                          -> Removed
             * Entity 4:                    -> Value 1                  -> Added
             *
             * MultiValue
             * Entity 5: Value 1            -> Value 1                  -> Unchanged
             * Entity 6: Value 1            -> Value 1, Value 2         -> Modified (Add Item)
             * Entity 7: Value 1            -> Value 1 Edited           -> Modified (Edited Item)
             * Entity 8: Value 1, Value 2   -> Value 1                  -> Modified (Removed Item)
             * Entity 9: Value 1            ->                          -> Removed
             * Entity 10:                   -> Value 1, Value 2         -> Added
             * 
             * Future Extension:
             * For more complicated manipulations like adding to multi-value and editing an item, we can assign the entity multiple types, edited - add item
             */
            const previousFilledEntityMap = new FilledEntityMap({
                map: {
                    // Single Values
                    [entities[0].entityName]: {
                        entityId: entities[0].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 1 - Single Value String",
                            },
                        ],
                    },
                    [entities[1].entityName]: {
                        entityId: entities[1].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 2  - Single Value String",
                            },
                        ],
                    },
                    [entities[2].entityName]: {
                        entityId: entities[2].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 3 - Single Value String",
                            },
                        ],
                    },

                    // Multi Value
                    [entities[4].entityName]: {
                        entityId: entities[4].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 5 - Value 1",
                            },
                            {
                                ...memoryValueBase,
                                userText: "Entity 5 - Value 2",
                            },
                        ],
                    },
                    [entities[5].entityName]: {
                        entityId: entities[5].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 6 - Value 1",
                            },
                        ],
                    },
                    [entities[6].entityName]: {
                        entityId: entities[6].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 7 - Value 1",
                            },
                        ],
                    },
                    [entities[7].entityName]: {
                        entityId: entities[7].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 8 - Value 1",
                            },
                            {
                                ...memoryValueBase,
                                userText: "Entity 8 - Value 2",
                            },
                        ],
                    },
                    [entities[8].entityName]: {
                        entityId: entities[8].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 5 - Value 1",
                            },
                            {
                                ...memoryValueBase,
                                userText: "Entity 5 - Value 2",
                            },
                        ],
                    },
                    // 9 Will Be Added
                }
            })

            const currentFilledEntityMap = new FilledEntityMap({
                map: {
                    [entities[0].entityName]: {
                        entityId: entities[0].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 1 - Single Value String",
                            },
                        ],
                    },
                    [entities[1].entityName]: {
                        entityId: entities[1].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 2  - Single Value String Edited",
                            },
                        ],
                    },
                    [entities[3].entityName]: {
                        entityId: entities[3].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 4 - Single Value String",
                            },
                        ],
                    },


                    // Multi Value
                    [entities[4].entityName]: {
                        entityId: entities[4].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 5 - Value 1",
                            },
                            {
                                ...memoryValueBase,
                                userText: "Entity 5 - Value 2",
                            },
                        ],
                    },
                    [entities[5].entityName]: {
                        entityId: entities[5].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 6 - Value 1",
                            },
                            {
                                ...memoryValueBase,
                                userText: "Entity 6 - Value 2",
                            },
                        ],
                    },
                    [entities[6].entityName]: {
                        entityId: entities[6].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 7 - Value 1 Edited",
                            },
                        ],
                    },
                    [entities[7].entityName]: {
                        entityId: entities[7].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 8 - Value 1",
                            },
                        ],
                    },
                    // Removed 8
                    [entities[9].entityName]: {
                        entityId: entities[9].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 5 - Value 1",
                            },
                            {
                                ...memoryValueBase,
                                userText: "Entity 5 - Value 2",
                            },
                        ],
                    },
                }
            })

            const fakeSessionInfo: SessionInfo = {
                userName: '',
                userId: '',
                logDialogId: ''
            }

            const clientMemoryManager = new ClientMemoryManager(previousFilledEntityMap, currentFilledEntityMap, entities, fakeSessionInfo)

            it('should return the ADDED, REMOVED, CHANGED, and UNCHANGED entities', () => {
                // Arrange

                // Act
                const changed = clientMemoryManager.changed()

                const added = changed.filter(c => c.changeType === ChangeType.ADDED)
                const removed = changed.filter(c => c.changeType === ChangeType.REMOVED)
                const modified = changed.filter(c => c.changeType === ChangeType.CHANGED)
                const unchanged = changed.filter(c => c.changeType === ChangeType.UNCHANGED)

                // Assert
                expect(unchanged.length).toBe(2)
                expect(unchanged[0].name).toEqual(entities[0].entityName)

                expect(modified.length).toBe(3)
                expect(modified[0].name).toEqual(entities[1].entityName)

                expect(added.length).toBe(2)
                expect(added[0].name).toEqual(entities[3].entityName)

                expect(removed.length).toBe(2)
                expect(removed[0].name).toEqual(entities[2].entityName)
            })
        })
    })
})
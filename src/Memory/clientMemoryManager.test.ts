/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { FilledEntityMap, EntityBase, EntityType, MemoryValue } from '@conversationlearner/models'
import { ClientMemoryManager } from '..'
import { SessionInfo } from './BotState'

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
                    entityName: 'entityName1'
                },
                {
                    ...baseEntity,
                    entityId: 'entityId2',
                    entityName: 'entityName2'
                },
                {
                    ...baseEntity,
                    entityId: 'entityId3',
                    entityName: 'entityName3'
                },
                {
                    ...baseEntity,
                    entityId: 'entityId4',
                    entityName: 'entityName4'
                }
            ]

            const memoryValueBase: MemoryValue = {
                userText: "Entity 1 - Single Value String",
                displayText: "displayText",
                builtinType: "builtinType",
                resolution: {},
                enumValueId: null
            }

            const previousFilledEntityMap = new FilledEntityMap({
                map: {
                    [entities[0].entityName]: {
                        entityId: entities[0].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 1 - Single Value String"
                            }
                        ]
                    },
                    [entities[1].entityName]: {
                        entityId: entities[1].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 2  - Single Value String"
                            }
                        ]
                    },
                    [entities[2].entityName]: {
                        entityId: entities[2].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "Entity 3 - Multi Value String 1"
                            },
                            {
                                ...memoryValueBase,
                                userText: "Entity 3 - Multi Value String 2"
                            }
                        ]
                    },
                    [entities[4].entityName]: {
                        entityId: entities[4].entityId,
                        values: [
                            {
                                ...memoryValueBase,
                                userText: "5"
                            },
                            {
                                ...memoryValueBase,
                                userText: "5"
                            }
                        ]
                    }
                }
            })

            const currentFilledEntityMap = new FilledEntityMap({
                map: {
                    'entityName1': {
                        entityId: 'entityId1',
                        values: [
                            {
                                userText: "userText",
                                displayText: "displayText",
                                builtinType: "builtinType",
                                resolution: {}
                            }
                        ]
                    }
                }
            })


            const fakeSessionInfo: SessionInfo = {
                userName: '',
                userId: '',
                logDialogId: ''
            }

            const clientMemoryManager = new ClientMemoryManager(previousFilledEntityMap, currentFilledEntityMap, entities, fakeSessionInfo)

            it('should return the ADDED, REMOVED, CHANGED, and UNCHANGED entities', () => {
                const changed = clientMemoryManager.changed()


            })
        })
    })
})
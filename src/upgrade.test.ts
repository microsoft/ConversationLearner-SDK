/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as upgrade from './upgrade'
import * as models from '@conversationlearner/models'
import { CallbackMap } from './CLRunner';

describe('upgrade', () => {
    describe('getActionPayload', () => {
        test('given single arguments payload callback with argument moved to either logic or render function return a new payload with argument in respective arguments list', () => {
            // Arrange
            const legacyActionPayload: models.ActionPayloadSingleArguments = {
                payload: 'payload',
                arguments: [
                    {
                        parameter: "logicArg",
                        value: {
                            json: {}
                        }
                    },
                    {
                        parameter: "renderArg",
                        value: {
                            json: {}
                        }
                    },
                    {
                        parameter: "sharedArg",
                        value: {
                            json: {}
                        }
                    }
                ]
            }

            const callback: models.Callback = {
                name: "myCallback",
                logicArguments: [
                    "logicArg",
                    "sharedArg"
                ],
                renderArguments: [
                    "renderArg",
                    "sharedArg"
                ]
            }

            // Act
            const actionPayload = upgrade.getActionPayload(legacyActionPayload, callback)

            // Assert
            expect(actionPayload.payload).toEqual(legacyActionPayload.payload)
            expect(actionPayload.logicArguments.some(la => la.parameter === legacyActionPayload.arguments[0].parameter)).toBeTruthy()
        })

        test('given single arguments payload callback with arguments not found in either logic or render it will be dropped', () => {
            // Arrange
            const legacyActionPayload: models.ActionPayloadSingleArguments = {
                payload: 'payload',
                arguments: [
                    {
                        parameter: "arg1",
                        value: {
                            json: {}
                        }
                    }
                ]
            }

            const callback: models.Callback = {
                name: "myCallback",
                logicArguments: [
                ],
                renderArguments: [
                ]
            }

            // Act
            const actionPayload = upgrade.getActionPayload(legacyActionPayload, callback)

            // Assert
            expect(actionPayload.payload).toEqual(legacyActionPayload.payload)
            expect(actionPayload.logicArguments.some(la => la.parameter === legacyActionPayload.arguments[0].parameter)).toBeFalsy()
            expect(actionPayload.renderArguments.some(la => la.parameter === legacyActionPayload.arguments[0].parameter)).toBeFalsy()
        })
    })

    describe('getActionChangeResult', () => {
        test('given a action without need to be changed, return it unmodified with no changes', () => {
            // Arrange
            const action: models.ActionBase = {
                actionId: 'fakeActionId',
                actionType: models.ActionTypes.API_LOCAL,
                createdDateTime: new Date().toJSON(),
                isTerminal: false,
                negativeEntities: [],
                payload: JSON.stringify({
                    payload: "myCallback",
                    logicArguments: [
                        {
                            parameter: "someArg",
                            value: {
                                json: {}
                            }
                        }
                    ],
                    renderArguments: [
                        {
                            parameter: "otherArg",
                            value: {
                                json: {}
                            }
                        }
                    ]
                } as models.ActionPayload),
                requiredEntities: [],
                requiredEntitiesFromPayload: [],
                suggestedEntity: null,
                version: 0,
                packageCreationId: 0,
                packageDeletionId: 0
            }

            const callbackMap: CallbackMap = {}

            // Act
            const defaultActionChangeResult = upgrade.getDefaultChangeResult(action)
            const actionChangeResult = upgrade.getActionChangeResult(action, callbackMap)

            // Assert
            expect(actionChangeResult).toEqual(defaultActionChangeResult)
        })

        test('given an old action return it with list of change descriptions', () => {
            // Arrange
            const action: models.ActionBase = {
                actionId: 'fakeActionId',
                actionType: models.ActionTypes.API_LOCAL,
                createdDateTime: new Date().toJSON(),
                isTerminal: false,
                negativeEntities: [],
                payload: JSON.stringify({
                    payload: "myCallback",
                    arguments: [
                        {
                            parameter: "logicArg",
                            value: {
                                json: {}
                            }
                        },
                        {
                            parameter: "renderArg",
                            value: {
                                json: {}
                            }
                        }
                    ]
                } as models.ActionPayloadSingleArguments),
                requiredEntities: [],
                requiredEntitiesFromPayload: [],
                suggestedEntity: null,
                version: 0,
                packageCreationId: 0,
                packageDeletionId: 0
            }

            const callbackMap: CallbackMap = {}

            // Act
            const actionChangeResult = upgrade.getActionChangeResult(action, callbackMap)

            // Assert
            expect(actionChangeResult.isChanged).toBe(true)
            expect(actionChangeResult.changes.length).toBeGreaterThan(0)
        })
    })

    describe('getAppDefinitionChange', () => {
        test('given app definition without changes return object as is without changes', () => {
            // Arrange
            const appDefinition: models.AppDefinition = {
                actions: [],
                entities: [],
                trainDialogs: []
            }

            // Act
            const appChange = upgrade.default(appDefinition, {})

            // Assert
            expect(appChange.isChanged).toBe(false)
            expect(appChange.currentAppDefinition).toEqual(appDefinition)
        })

        test('given app definition without changes return object as is without changes', () => {
            // Arrange
            const action: models.ActionBase = {
                actionId: 'fakeActionId',
                actionType: models.ActionTypes.API_LOCAL,
                createdDateTime: new Date().toJSON(),
                isTerminal: false,
                negativeEntities: [],
                payload: JSON.stringify({
                    payload: "myCallback",
                    arguments: [
                        {
                            parameter: "logicArg",
                            value: {
                                json: {}
                            }
                        },
                        {
                            parameter: "renderArg",
                            value: {
                                json: {}
                            }
                        }
                    ]
                } as models.ActionPayloadSingleArguments),
                requiredEntities: [],
                requiredEntitiesFromPayload: [],
                suggestedEntity: null,
                version: 0,
                packageCreationId: 0,
                packageDeletionId: 0
            }

            const appDefinition: models.AppDefinition = {
                actions: [
                    action
                ],
                entities: [],
                trainDialogs: []
            }

            // Act
            const appChange = upgrade.default(appDefinition, {})

            // Assert
            expect(appChange.isChanged).toBe(true)
            expect(appChange.currentAppDefinition).toEqual(appDefinition)
        })
    })
})
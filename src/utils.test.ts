/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as utils from './Utils'
import { FilledEntityMap } from '@conversationlearner/models';

describe('Util', () => {
    describe('replace', () => {
        test('Replace function should work', () => {

            interface Otype {
                name: string
                id: string
            }

            let objects: Otype[] = [{ name: "o1", id: "1" }, { name: "o2", id: "2" }]
            let newo: Otype = { name: "o2new", id: "2" }


            // Act
            const actual = utils.replace<Otype>(objects, newo, o => o.id)

            // Assert
            const replaced = actual.find(o => o.id === "2")
            expect(replaced).toBe(newo)
        })
    })

    describe('addEntitiesById', () => {
        test('given filled entity map should return new filled entity map with entities able to be referenced by id', () => {
            const filledEntityMap = new FilledEntityMap({
                map: {
                    'entityName1': {
                        entityId: 'entityId',
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

            const dualFilledEntityMap = utils.addEntitiesById(filledEntityMap)

            expect(dualFilledEntityMap.ValueAsString('entityId')).toBe('displayText')
        })
    })
})

/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as utils from './Utils'

describe('replace', () => {
    test('Replace function should work', () => {

        interface Otype {
            name: string
            id: string
        }

        let objects: Otype[] = [{ name: "o1", id: "1"}, { name: "o2", id: "2"}]
        let newo: Otype = { name: "o2new", id: "2"}


        // Act
        const actual = utils.replace<Otype>(objects, newo, o => o.id)

        // Assert
        const replaced = actual.find(o => o.id === "2")
        expect(replaced).toBe(newo)
    })
})
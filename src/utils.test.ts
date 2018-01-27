import { Utils as utilities } from './Utils'

describe('utilities', () => {
    describe('PrebuiltDisplayText', () => {
        test('given prebuilt type starts with encyclopediea should return entityText', () => {
            // Arrange
            const expected = 'randomValue1'

            // Act
            const actual = utilities.PrebuiltDisplayText('builtin.encyclopedia', null, expected)

            // Assert
            expect(actual).toEqual(expected)
        })
    })
})
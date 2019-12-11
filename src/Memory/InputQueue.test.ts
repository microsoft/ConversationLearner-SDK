/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as util from 'util'
import * as BB from 'botbuilder'
import * as CLM from '@conversationlearner/models'
import { CLState } from './CLState'
import { InputQueue } from '../Memory/InputQueue'

// InputQueue requires tiny delay between inputs or InputQueue mutex won't fishing setting
const mutexDelay = 50
// Delay to simulate CLRunner ProcessInput
const processDelay = 1000
const userAccount: BB.ChannelAccount = { id: "user", name: "user", role: BB.RoleTypes.User, aadObjectId: '' }
const botAccount: BB.ChannelAccount = { id: "bot", name: "bot", role: BB.RoleTypes.Bot, aadObjectId: '' }
let responses: { [key: string]: string[] } = {}

// Use any as return type as is not a full Activity, just bare minimum for test
function makeActivity(message: string, conversationId: string): any {
    return {
        id: CLM.ModelUtils.generateGUID(),
        conversation: { id: conversationId },
        from: botAccount,
        recipient: userAccount,
        type: 'message',
        text: message,
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Simulate AddInput function in CLRunner
async function addInput(state: CLState, message: string, conversationId: string) {
    const activity = makeActivity(message, conversationId)
    let addInputPromise = util.promisify(InputQueue.AddInput)
    let isReady = await addInputPromise(state.MessageState, activity)

    if (isReady) {
        // Handle input with a delay to simulate CLRunner ProcessInput
        await sleep(processDelay)

        if (!responses[conversationId]) {
            responses[conversationId] = []
        }

        responses[conversationId].push(activity.text)
        InputQueue.MessageHandled(state.MessageState, conversationId, activity)
    }
}

describe('InputQueue', () => {

    beforeEach(() => {
        CLState.Init()
        responses = {}
    })

    it('should handle all messages in a single queue', async () => {

        const clState = CLState.Get("InputQueueTest", undefined)
        const conversationId = CLM.ModelUtils.generateGUID()
        const inputs = ["A", "B", "C", "D", "E"]

        // Need longer jest timeout for this test
        const processTime = (mutexDelay + processDelay) * inputs.length
        jest.setTimeout(2 * processTime)

        for (let input of inputs) {
            addInput(clState, input, conversationId)
            await sleep(mutexDelay)
        }

        // Give messages time to process
        await sleep(processTime)

        // Check that they were handled
        const messages = responses[conversationId]
        console.log(messages.join(" "))
        expect(messages.length).toBe(inputs.length)
        messages.forEach((m, i) => expect(m).toBe(inputs[i]))
    })

    it('should handle multiple conversations', async () => {

        const clState1 = CLState.Get("InputQueueTest1", undefined)
        const clState2 = CLState.Get("InputQueueTest2", undefined)
        const conversation1Id = CLM.ModelUtils.generateGUID()
        const conversation2Id = CLM.ModelUtils.generateGUID()
        const inputs1 = ["A", "B", "C", "D", "E"]
        const inputs2 = ["1", "2", "3", "4", "5"]

        // Need longer jest timeout for this test
        const processTime = (mutexDelay + processDelay) * (inputs1.length + inputs2.length)
        jest.setTimeout(2 * processTime)

        for (let i = 0; i < inputs1.length; i = i + 1) {
            addInput(clState1, inputs1[i], conversation1Id)
            await sleep(mutexDelay)
            addInput(clState2, inputs2[i], conversation2Id)
            await sleep(mutexDelay)
        }

        // Give messages time to process
        await sleep(processTime)

        // Check that they were handled
        const messages1 = responses[conversation1Id]
        expect(messages1.length).toBe(inputs1.length)
        messages1.forEach((m, i) => expect(m).toBe(inputs1[i]))

        const messages2 = responses[conversation2Id]
        expect(messages2.length).toBe(inputs2.length)
        messages2.forEach((m, i) => expect(m).toBe(inputs2[i]))
    })
})

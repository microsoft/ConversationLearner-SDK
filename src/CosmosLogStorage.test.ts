/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as CLM from '@conversationlearner/models';
import { CosmosLogStorage } from './CosmosLogStorage';

const options = {
    endpoint: "",
    key: ""
}

function makeLogDialog(logDialogId: string): CLM.LogDialog {
    return {
        ...CLM.makeLogDialog(),
        logDialogId
    }
}

describe('CosmosLogStorage', () => {

    // Before each test clear the database
    beforeEach(async () => {
        const cls = await CosmosLogStorage.Get(options)
        await cls.DeleteAll()
    })


    test('CreateAsync', async () => {

        const cls = await CosmosLogStorage.Get(options)

        const appId = CLM.ModelUtils.generateGUID()
        const logDialog1Id = CLM.ModelUtils.generateGUID()
        const logDialog1 = makeLogDialog(logDialog1Id)
        await cls.Add(appId, logDialog1)

        let queryResult = await cls.GetMany(appId, undefined)
        expect(queryResult.logDialogs.length).toBe(1)
    })

    test('GetAsync', async () => {

        const cls = await CosmosLogStorage.Get(options)

        const appId = CLM.ModelUtils.generateGUID()
        const logDialog1Id = CLM.ModelUtils.generateGUID()
        const logDialog1 = makeLogDialog(logDialog1Id)
        await cls.Add(appId, logDialog1)

        let logDialog = await cls.Get(appId, logDialog1Id)
        expect(logDialog).not.toBe(undefined)
    })

    test('DeleteAsync', async () => {

        const cls = await CosmosLogStorage.Get(options)

        const appId = CLM.ModelUtils.generateGUID()
        const logDialog1Id = CLM.ModelUtils.generateGUID()
        const logDialog1 = makeLogDialog(logDialog1Id)
        await cls.Add(appId, logDialog1)

        let queryResult = await cls.GetMany(appId, undefined)
        expect(queryResult.logDialogs.length).toBe(1)

        await cls.Delete(appId, logDialog1.logDialogId)

        queryResult = await cls.GetMany(appId, undefined)
        expect(queryResult.logDialogs.length).toBe(0)

    })

    test('DeleteAll', async () => {

        const cls = await CosmosLogStorage.Get(options)
        await cls.DeleteAll()

        let queryResult = await cls.GetMany()
        expect(queryResult.logDialogs.length).toBe(0)
        expect(queryResult.continuationToken).toBe(undefined)
    })


    test('GetMany', async () => {

        const cls = await CosmosLogStorage.Get(options)

        // Create 10 items
        for (let i = 0; i < 8; i = i + 1) {
            const appId = CLM.ModelUtils.generateGUID()
            const logDialogId = CLM.ModelUtils.generateGUID()
            const logDialog = makeLogDialog(logDialogId)
            await cls.Add(appId, logDialog)
        }

        // Get the first 5
        let queryResult = await cls.GetMany(undefined, undefined, undefined, 5)
        expect(queryResult.logDialogs.length).toBe(5)
        expect(queryResult.continuationToken).not.toBe(undefined)

        // Get the next
        queryResult = await cls.GetMany(undefined, undefined, queryResult.continuationToken)
        expect(queryResult.logDialogs.length).toBe(3)
        expect(queryResult.continuationToken).toBe(undefined)
    })

    test('AppendScorerStep', async () => {

        const cls = await CosmosLogStorage.Get(options)

        const appId = CLM.ModelUtils.generateGUID()
        const logDialog1Id = CLM.ModelUtils.generateGUID()
        const logDialog1 = makeLogDialog(logDialog1Id)
        await cls.Add(appId, logDialog1)

        const scorerStep = CLM.makeLogScorerStep()
        await cls.AppendScorerStep(appId, logDialog1.logDialogId, scorerStep)

        let logDialog = await cls.Get(appId, logDialog1Id)
        expect(logDialog).not.toBe(undefined)

        if (logDialog) {
            const lastRound = logDialog.rounds[logDialog.rounds.length - 1]
            const lastScorerStep = lastRound.scorerSteps[lastRound.scorerSteps.length - 1]
            expect(lastScorerStep).toEqual(scorerStep)
        }
    })

    test('AppendExtractorStep', async () => {

        const cls = await CosmosLogStorage.Get(options)

        const appId = CLM.ModelUtils.generateGUID()
        const logDialog1Id = CLM.ModelUtils.generateGUID()
        const logDialog1 = makeLogDialog(logDialog1Id)
        await cls.Add(appId, logDialog1)

        const extractorStep = CLM.makeLogExtractorStep()
        await cls.AppendExtractorStep(appId, logDialog1.logDialogId, extractorStep)

        let logDialog = await cls.Get(appId, logDialog1Id)
        expect(logDialog).not.toBe(undefined)

        if (logDialog) {
            const lastRound = logDialog.rounds[logDialog.rounds.length - 1]
            expect(lastRound.extractorStep).toEqual(extractorStep)
            expect(lastRound.scorerSteps.length).toBe(0)
        }
    })
})

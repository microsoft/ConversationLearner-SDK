/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as CLM from '@conversationlearner/models'
import { CosmosLogStorage } from './CosmosLogStorage'

const options = {
    endpoint: "",
    key: ""
}

function makeLogDialog(logDialogId: string): CLM.LogDialog {
    return {
        ...CLM.MockData.makeLogDialog(),
        logDialogId
    }
}

async function getStorage(): Promise<CosmosLogStorage | undefined> {
    if (!options.endpoint || !options.key) {
        console.log("Skipping Test.  Cosmos credentials not defsined.")
        return undefined
    }
    return await CosmosLogStorage.Get(options)
}

async function appendScorerStep(appId: string, logDialogId: string, logScorerStep: CLM.LogScorerStep, cls: CosmosLogStorage) {
    const logDialog: CLM.LogDialog | undefined = await cls.Get(appId, logDialogId)
    if (!logDialog) {
        throw new Error(`Log Dialog does not exist App:${appId} Log:${logDialogId}`)
    }
    const lastRound = logDialog.rounds[logDialog.rounds.length - 1]
    if (!lastRound || !lastRound.extractorStep) {
        throw new Error(`Log Dialogs has no Extractor Step Id:${logDialogId}`)
    }
    lastRound.scorerSteps.push(logScorerStep as any)
    logDialog.dialogEndDatetime = new Date().toJSON()
    await cls.Replace(appId, logDialog)
}

async function appendExtractorStep(appId: string, logDialogId: string, extractorStep: CLM.LogExtractorStep, cls: CosmosLogStorage) {
    // Append an extractor step to already existing log dialog
    const logDialog: CLM.LogDialog | undefined = await cls.Get(appId, logDialogId)
    if (!logDialog) {
        throw new Error(`Log Dialog does not exist App:${appId} Id:${logDialogId}`)
    }
    const newRound: CLM.LogRound = {
        extractorStep: { ...extractorStep, stepBeginDatetime: "", stepEndDatetime: "" },
        scorerSteps: []
    }
    logDialog.rounds.push(newRound)
    logDialog.dialogEndDatetime = new Date().toJSON()
    await cls.Replace(appId, logDialog)
}

describe('CosmosLogStorage', () => {

    // Before each test clear the database
    beforeEach(async () => {

        const cls = await getStorage()
        if (cls) {
            await cls.DeleteAll()
        }
    })

    test('CreateAsync', async () => {

        const cls = await getStorage()
        if (!cls) {
            return
        }
        const appId = CLM.ModelUtils.generateGUID()
        const logDialog1Id = CLM.ModelUtils.generateGUID()
        const logDialog1 = makeLogDialog(logDialog1Id)
        await cls.Add(appId, logDialog1)

        let queryResult = await cls.GetMany(appId, undefined)
        expect(queryResult.logDialogs.length).toBe(1)
    })

    test('GetAsync', async () => {

        const cls = await getStorage()
        if (!cls) {
            return
        }

        const appId = CLM.ModelUtils.generateGUID()
        const logDialog1Id = CLM.ModelUtils.generateGUID()
        const logDialog1 = makeLogDialog(logDialog1Id)
        await cls.Add(appId, logDialog1)

        let logDialog = await cls.Get(appId, logDialog1Id)
        expect(logDialog).not.toBe(undefined)
    })

    test('DeleteAsync', async () => {

        const cls = await getStorage()
        if (!cls) {
            return
        }

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

        const cls = await getStorage()
        if (!cls) {
            return
        }
        await cls.DeleteAll()

        let queryResult = await cls.GetMany()
        expect(queryResult.logDialogs.length).toBe(0)
        expect(queryResult.continuationToken).toBe(undefined)
    })


    test('GetMany', async () => {

        const cls = await getStorage()
        if (!cls) {
            return
        }

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

        const cls = await getStorage()
        if (!cls) {
            return
        }

        const appId = CLM.ModelUtils.generateGUID()
        const logDialog1Id = CLM.ModelUtils.generateGUID()
        const logDialog1 = makeLogDialog(logDialog1Id)
        await cls.Add(appId, logDialog1)

        const scorerStep = CLM.MockData.makeLogScorerStep()
        await appendScorerStep(appId, logDialog1.logDialogId, scorerStep, cls)

        let logDialog = await cls.Get(appId, logDialog1Id)
        expect(logDialog).not.toBe(undefined)

        if (logDialog) {
            const lastRound = logDialog.rounds[logDialog.rounds.length - 1]
            const lastScorerStep = lastRound.scorerSteps[lastRound.scorerSteps.length - 1]
            expect(lastScorerStep).toEqual(scorerStep)
        }
    })

    test('AppendExtractorStep', async () => {

        const cls = await getStorage()
        if (!cls) {
            return
        }

        const appId = CLM.ModelUtils.generateGUID()
        const logDialog1Id = CLM.ModelUtils.generateGUID()
        const logDialog1 = makeLogDialog(logDialog1Id)
        await cls.Add(appId, logDialog1)

        const extractorStep = CLM.MockData.makeLogExtractorStep()
        await appendExtractorStep(appId, logDialog1.logDialogId, extractorStep, cls)

        let logDialog = await cls.Get(appId, logDialog1Id)
        expect(logDialog).not.toBe(undefined)

        if (logDialog) {
            const lastRound = logDialog.rounds[logDialog.rounds.length - 1]
            expect(lastRound.extractorStep).toEqual(extractorStep)
            expect(lastRound.scorerSteps.length).toBe(0)
        }
    })
})

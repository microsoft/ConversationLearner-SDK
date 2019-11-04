/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as Cosmos from '@azure/cosmos'
import { CLDebug } from './CLDebug'
import { ILogStorage, LogQueryResult } from './Memory/ILogStorage'
import * as CLM from '@conversationlearner/models'

const DATABASE_ID = "LOG_DIALOGS"
const COLLECTION_ID = "LOG_DIALOGS"
const MAX_PAGE_SIZE = 100
const PARTITION_KEY = { kind: 'Hash', paths: ['/appId', '/packageId'] }

interface StoredLogDialog extends CLM.LogDialog {
    // CosmosId
    id: string,
    appId: string
}

export class CosmosLogStorage implements ILogStorage {
    private client: Cosmos.CosmosClient
    private database: Cosmos.Database | undefined
    private container: Cosmos.Container | undefined

    /**
     * 
     * @param options endpoint, key
     *  endpoint = Cosmos server (i.e. "https://your-account.documents.azure.com") 
     *  key = Master key of the endpoint
     */
    constructor(options: Cosmos.CosmosClientOptions) {
        this.client = new Cosmos.CosmosClient(options)
    }

    static async Get(options: Cosmos.CosmosClientOptions): Promise<CosmosLogStorage> {

        const storage = new CosmosLogStorage(options)

        const dbResponse = await storage.client.databases.createIfNotExists({ id: DATABASE_ID })
        storage.database = dbResponse.database

        const coResponse = await storage.database.containers.createIfNotExists({ id: COLLECTION_ID, partitionKey: PARTITION_KEY })
        storage.container = coResponse.container

        return storage
    }

    /** Add a log dialog to storage */
    public async Add(appId: string, logDialog: CLM.LogDialog): Promise<CLM.LogDialog> {
        if (!this.container) {
            throw new Error("Cosmos Container Doesn't exist")
        }

        const storedLog = logDialog as StoredLogDialog
        storedLog.id = this.GetDialogDocumentId(appId, logDialog.logDialogId)
        storedLog.appId = appId
        await this.container.items.create(storedLog)
        return storedLog
    }

    public async NewSession(appId: string, logDialog: CLM.LogDialog): Promise<CLM.LogDialog> {
        return await this.Add(appId, logDialog)
    }

    /** Append a scorer step to already existing log dialog */
    public async AppendScorerStep(appId: string, logDialogId: string, scorerStep: CLM.LogScorerStep): Promise<CLM.LogDialog> {
        if (!this.container) {
            throw new Error("Cosmos Container Doesn't exist")
        }
        const { resource: logDialog } = await this.container.item(this.GetDialogDocumentId(appId, logDialogId), appId).read()
        if (!logDialog) {
            throw new Error(`Log Dialog does not exist App:${appId} Log:${logDialogId}`)
        }
        const lastRound = logDialog.rounds[logDialog.rounds.length - 1]
        if (!lastRound || lastRound.scorerSteps.length === 0) {
            throw new Error(`Log Dialogs has no Extractor Step Log:${logDialogId}`)
        }
        lastRound.scorerSteps.push(scorerStep)
        await this.container.items.upsert(logDialog)
        return logDialog
    }

    /** Append an extractor step to already existing log dialog */
    public async AppendExtractorStep(appId: string, logDialogId: string, extractorStep: CLM.LogExtractorStep): Promise<CLM.LogDialog> {
        if (!this.container) {
            throw new Error("Cosmos Constainer Doesn't exist")
        }
        const { resource: logDialog } = await this.container.item(this.GetDialogDocumentId(appId, logDialogId), appId).read()
        if (!logDialog) {
            throw new Error(`Log Dialog does not exist App:${appId} Log:${logDialogId}`)
        }
        const newRound: CLM.LogRound = {
            extractorStep: extractorStep,
            scorerSteps: []
        }
        logDialog.rounds.push(newRound)
        await this.container.items.upsert(logDialog)
        return logDialog
    }

    /**
     * Get all log dialogs matching parameters
     * @param appId Filer by appId if set
     * @param packageId Filter by Package if set
     * @param continuationToken Continuation token
     * @param pageSize Number to retrieve (max 100)
     */
    public async GetMany(appId?: string, packageId?: string, continuationToken?: string, pageSize = MAX_PAGE_SIZE): Promise<LogQueryResult> {

        let querySpec: Cosmos.SqlQuerySpec
        if (!appId && !packageId) {
            querySpec = {
                query: `SELECT * FROM c`
            }
        }
        else if (appId) {
            querySpec = {
                query: `SELECT * FROM c WHERE c.appId = @appId`,
                parameters: [
                    {
                        name: "@appId",
                        value: appId
                    }
                ]
            }
        }
        else {
            querySpec = {
                //query: `SELECT * FROM c WHERE c.packageId = @packageId`,LARS
                query: `SELECT * FROM c WHERE ARRAY_CONTAINS(@packageList, c.packageId)`,
                parameters: [
                    {
                        //name: "@packageId",
                        //value: packageId!

                    }
                ]
            }
        }

        const feedOptions: Cosmos.FeedOptions = {
            maxItemCount: Math.min(pageSize, MAX_PAGE_SIZE),
            continuation: continuationToken
        }

        if (this.container) {
            const feedResponse = await this.container.items.query(querySpec, feedOptions).fetchNext();
            return {
                logDialogs: feedResponse.resources,
                continuationToken: feedResponse.continuation
            }
        }
        throw new Error("Contained undefined")
    }

    /** Retrieve a log dialog from storage */
    public async Get(appId: string, logDialogId: string): Promise<CLM.LogDialog | undefined> {
        if (this.container) {
            // this.container.
            const { resource } = await this.container.item(this.GetDialogDocumentId(appId, logDialogId), appId).read()
            return resource
        }
        return undefined
    }

    /** Delete a log dialog in storage */
    public async Delete(appId: string, logDialogId: string): Promise<void> {
        if (this.container) {
            await this.container.item(this.GetDialogDocumentId(appId, logDialogId), appId).delete()
            CLDebug.Log(`Deleted ${logDialogId} / ${this.GetDialogDocumentId(appId, logDialogId)}`)
        }
    }

    /** Delete all log dialogs in storage */
    public async DeleteAll() {
        if (!this.container) {
            throw new Error("Continer is undefined")
        }
        const querySpec: Cosmos.SqlQuerySpec = {
            query: `SELECT * FROM c`
        }

        let continuationToken: string | undefined
        do {
            const feedOptions: Cosmos.FeedOptions = {
                maxItemCount: 5,
                continuation: continuationToken
            }
            const feedResponse = await this.container.items.query(querySpec, feedOptions).fetchNext()
            for (const logDialog of feedResponse.resources) {
                await this.container.item(logDialog.id, logDialog.appId).delete(logDialog)
            }
            continuationToken = feedResponse.continuation
        }
        while (continuationToken);
    }

    /** Generate document id used in cosmos */
    private GetDialogDocumentId(appId: string, dialogId: string): string {
        return `${appId}_${dialogId}`;
    }
}

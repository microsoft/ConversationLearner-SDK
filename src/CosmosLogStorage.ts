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
const DELETE_BATCH_SIZE = 10
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
    // Queue of items to be deleted
    private deleteQueue: string[]

    /**
     * 
     * @param options endpoint, key
     *  endpoint = Cosmos server (i.e. "https://your-account.documents.azure.com") 
     *  key = Master key of the endpoint
     */
    constructor(options: Cosmos.CosmosClientOptions) {
        this.client = new Cosmos.CosmosClient(options)
        this.deleteQueue = []
    }

    static async Get(options: Cosmos.CosmosClientOptions): Promise<CosmosLogStorage> {

        const storage = new CosmosLogStorage(options)

        const dbResponse = await storage.client.databases.createIfNotExists({ id: DATABASE_ID })
        storage.database = dbResponse.database

        const coResponse = await storage.database.containers.createIfNotExists({ id: COLLECTION_ID, partitionKey: PARTITION_KEY })
        storage.container = coResponse.container

        return storage
    }

    private get Container(): Cosmos.Container {
        if (!this.container) {
            throw new Error("Cosmos Container Doesn't exist")
        }
        return this.container
    }

    /** Add a new log dialog to storage */
    public async Add(appId: string, logDialog: CLM.LogDialog): Promise<CLM.LogDialog | undefined> {
        try {
            const storedLog = logDialog as StoredLogDialog
            storedLog.id = this.GetDialogDocumentId(appId, logDialog.logDialogId)
            storedLog.appId = appId
            const itemResponse = await this.Container.items.create<StoredLogDialog>(storedLog)
            const { resource: createdLog, statusCode } = await itemResponse.item.read<StoredLogDialog>()
            if (statusCode < 200 || statusCode >= 300) {
                throw new Error(`${statusCode}`)
            }
            return createdLog
        }
        catch (err) {
            CLDebug.Error(err)
            return undefined
        }
    }

    /** Retrieve a log dialog from storage */
    public async Get(appId: string, logDialogId: string): Promise<CLM.LogDialog | undefined> {
        try {
            // Check if scheduled for deletion
            if (this.deleteQueue.includes(logDialogId)) {
                return undefined
            }
            const { resource, statusCode } = await this.container!.item(this.GetDialogDocumentId(appId, logDialogId), appId).read<StoredLogDialog>()
            if (statusCode < 200 || statusCode >= 300) {
                throw new Error(`${statusCode}`)
            }
            return resource
        }
        catch (err) {
            CLDebug.Error(err)
        }
    }

    /**
     * Get all log dialogs matching parameters
     * @param appId Filer by appId if set
     * @param packageIds Filter by Package if set
     * @param continuationToken Continuation token
     * @param pageSize Number to retrieve (max 100)
     */
    public async GetMany(appId?: string, packageIds?: string[], continuationToken?: string, pageSize = MAX_PAGE_SIZE): Promise<LogQueryResult> {
        try {
            let and = ""
            const querySpec: Cosmos.SqlQuerySpec = {
                query: `SELECT * FROM c`,
                parameters: []
            }
            if (appId) {
                querySpec.query = querySpec.query.concat(' WHERE c.appId = @appId')
                querySpec.parameters!.push({ name: "@appId", value: appId })
                and = " AND"
            }
            if (packageIds && packageIds.length > 0) {
                querySpec.query = querySpec.query.concat(`${and} ARRAY_CONTAINS(@packageList, c.packageId)`)
                querySpec.parameters!.push({ name: '@packageList', value: packageIds })
                and = " AND"
            }
            if (this.deleteQueue && this.deleteQueue.length > 0) {
                querySpec.query = querySpec.query.concat(`${and} NOT ARRAY_CONTAINS(@logIdList, c.logDialogId)`)
                querySpec.parameters!.push({ name: '@logIdList', value: this.deleteQueue })
            }

            const feedOptions: Cosmos.FeedOptions = {
                maxItemCount: Math.min(pageSize, MAX_PAGE_SIZE),
                continuation: continuationToken
            }

            const feedResponse = await this.Container.items.query(querySpec, feedOptions).fetchNext()

            return {
                logDialogs: feedResponse.resources as CLM.LogDialog[],
                continuationToken: feedResponse.continuation
            }
        }
        catch (err) {
            CLDebug.Error(err)
            return {
                logDialogs: [],
                continuationToken: undefined
            }
        }
    }

    /** Replace and exisiting log dialog */
    public async Replace(appId: string, logDialog: CLM.LogDialog): Promise<void> {
        try {
            const { statusCode } = await this.Container.item(this.GetDialogDocumentId(appId, logDialog.logDialogId), appId).replace(logDialog)
            if (statusCode < 200 || statusCode >= 300) {
                throw new Error(`${statusCode}`)
            }
        }
        catch (err) {
            CLDebug.Error(err)
        }
    }

    /** Delete a log dialog in storage */
    public async Delete(appId: string, logDialogId: string): Promise<void> {
        try {
            const { statusCode } = await this.Container.item(this.GetDialogDocumentId(appId, logDialogId), appId).delete()
            if (statusCode < 200 || statusCode >= 300) {
                throw new Error(`${statusCode}`)
            }
        }
        catch (err) {
            CLDebug.Error(err)
        }
    }

    /** Delete multiple log dialogs */
    public async DeleteMany(appId: string, logDialogIds: string[]): Promise<void> {
        try {
            // Add items to existing delete queue
            if (this.deleteQueue.length > 0) {
                this.deleteQueue.push(...logDialogIds)
            }
            // Otherwise set queue and start deleting. 
            else {
                this.deleteQueue.push(...logDialogIds)
                while (this.deleteQueue.length > 0) {
                    // Batch in batches of DELETE_BATCH_SIZE
                    const logSet = this.deleteQueue.slice(0, DELETE_BATCH_SIZE)
                    const promises = logSet.map(lid => this.Delete(appId, lid))
                    // TODO: Handle 429's
                    await Promise.all(promises)

                    // Remove them from the delete queue w/o mutating the object
                    logSet.forEach(id => this.deleteQueue.splice(this.deleteQueue.indexOf(id), 1))
                }
            }
        }
        catch (err) {
            CLDebug.Error(err)
        }
    }

    /** Delete all log dialogs in storage 
     * @param appId If provided will only delete log dialogs from the given appId
     */
    public async DeleteAll(appId?: string) {
        try {
            const querySpec: Cosmos.SqlQuerySpec = {
                query: `SELECT * FROM c`
            }

            if (appId) {
                querySpec.query = querySpec.query.concat(' WHERE c.appId = @appId`')
                querySpec.parameters = [{ name: "@appId", value: appId }]
            }

            let continuationToken: string | undefined
            do {
                const feedOptions: Cosmos.FeedOptions = {
                    maxItemCount: DELETE_BATCH_SIZE,
                    continuation: continuationToken
                }
                const feedResponse = await this.Container.items.query(querySpec, feedOptions).fetchNext()
                const logDialogs: StoredLogDialog[] = feedResponse.resources
                const promises = logDialogs.map(ld => this.Delete(ld.logDialogId, ld.appId))
                // TODO: Handle 429's
                await Promise.all(promises)

                continuationToken = feedResponse.continuation
            }
            while (continuationToken);
        }
        catch (err) {
            CLDebug.Error(err)
        }
    }

    /** Generate document id used in cosmos */
    private GetDialogDocumentId(appId: string, dialogId: string): string {
        return `${appId}_${dialogId}`;
    }
}

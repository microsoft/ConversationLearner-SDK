/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as CLM from '@conversationlearner/models'

export interface LogQueryResult {
    logDialogs: CLM.LogDialog[]
    continuationToken: string | undefined
}

export interface ILogStorage {

    /** Add a log dialog to storage */
    Add(appId: string, logDialog: CLM.LogDialog): Promise<CLM.LogDialog>

    /** Retrieve a log dialog from storage */
    Get(appId: string, logDialogId: string): Promise<CLM.LogDialog | undefined>

    /**
     * Get all log dialogs matching parameters
     * @param appId Filer by appId if set
     * @param packageId Filter by Package if set
     * @param continuationToken Continuation token
     * @param pageSize Number to retrieve (max 100)
     */
    GetMany(appId: string, packageIds: string[], continuationToken?: string, pageSize?: number): Promise<LogQueryResult>

    /** Delete a log dialog in storage */
    Delete(appId: string, lodDialogId: string): Promise<void>

    /** Delete multiple log dialogs */
    DeleteMany(appId: string, logDialogIds: string[]): Promise<void>

    /** Delete all log dialogs in storage */
    DeleteAll(appID?: string): Promise<void>

    Replace(appId: string, logDialog: CLM.LogDialog): Promise<void>
}

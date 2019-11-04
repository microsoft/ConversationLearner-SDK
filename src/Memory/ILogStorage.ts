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

    /** Delete a log dialog in storage */
    Delete(appId: string, lodDialogId: string): Promise<void>

    NewSession(appId: string, logDialog: CLM.LogDialog): Promise<CLM.LogDialog>

    /**
     * Get all log dialogs matching parameters
     * @param appId Filer by appId if set
     * @param packageId Filter by Package if set
     * @param continuationToken Continuation token
     * @param pageSize Number to retrieve (max 100)
     */
    GetMany(appId: string, packageId: string, continuationToken?: string, pageSize?: number): Promise<LogQueryResult>

    /** Append an extractor step to already existing log dialog */
    AppendExtractorStep(appId: string, logDialogId: string, extractorStep: Partial<CLM.LogExtractorStep>): Promise<CLM.LogDialog>

    /** Append a scorer step to already existing log dialog */
    AppendScorerStep(appId: string, logDialogId: string, scorerStep: CLM.LogScorerStep): Promise<CLM.LogDialog>

    /** Delete all log dialogs in storage */
    DeleteAll(): Promise<void>
}

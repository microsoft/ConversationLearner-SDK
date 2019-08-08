/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import { ConversationLearner } from './ConversationLearner'
import { ICLOptions, CLClient } from '.'
import getRouter from './http/router'
import * as express from 'express'
import CLStateFactory from './Memory/CLStateFactory';

/**
 * Conversation Learner Factory. Produces instances that all use the same storage, client, and options.
 * Alternative which ConversationLearner.Init() which set the statics but this created temporal coupling (need to call Init before constructor)
 */
export default class ConversationLearnerFactory {
    private storageFactory: CLStateFactory
    private client: CLClient
    private options: ICLOptions
    sdkRouter: express.Router

    constructor(options: ICLOptions, bbStorage: BB.Storage = new BB.MemoryStorage()) {
        this.storageFactory = new CLStateFactory(bbStorage)
        this.options = options

        const client = new CLClient(options)
        this.client = client

        this.sdkRouter = getRouter(client, this.storageFactory, options)
    }

    create(modelId?: string) {
        return new ConversationLearner(this.storageFactory, this.client, this.options, modelId)
    }
}

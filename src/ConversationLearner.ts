/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import { CLRunner, ApiCallback, EntityDetectionCallback, OnSessionStartCallback, OnSessionEndCallback } from './CLRunner'
import { ICLOptions } from './CLOptions'
import { CLMemory } from './CLMemory'
import { CLDebug } from './CLDebug'
import { CLClient } from './CLClient'
import addSdkRoutes from './Http/Server'
import { CL_DEVELOPER, DEFAULT_MAX_SESSION_LENGTH } from './Utils'
import { CLRecognizerResult } from './CLRecognizeResult'
import * as directline from 'offline-directline'
import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as cors from 'cors'

export class ConversationLearner {
    public static options: ICLOptions | null = null;
    public static clClient: CLClient
    public clRunner: CLRunner
    public appId: string | undefined

    public static Init(options: ICLOptions, storage: BB.Storage | null = null) {

        ConversationLearner.options = options

        try {
            CLDebug.Log('Creating Conversation Learner Client....')
            this.clClient = new CLClient(options)
            CLMemory.Init(storage)

            // Should we start DirectOffline server (for Editing UI)
            if (options.DOL_START) {
                const { DOL_SERVICE_URL: dolServiceUrl, DOL_BOT_URL: dolBotUrl } = options
                console.log(`Starting DOL (Direct Offline):`)
                console.log(`- Service Url: ${dolServiceUrl}`)
                console.log(`- Bot Url: ${dolBotUrl}`)
                
                const dolServer = express()
                // Don't require conversation initialization. This allows
                // UI to continue conversation even after bot restart
                const conversationInitRequired = false
                directline.initializeRoutes(dolServer, dolServiceUrl, dolBotUrl, conversationInitRequired)
            }

            // Create SDK server
            const sdkServer = express()
            sdkServer.use(cors())
            sdkServer.use(bodyParser.json())
            addSdkRoutes(sdkServer, this.clClient, options)
            
            const sdkPort = options.CONVERSATION_LEARNER_SDK_PORT
            const listener = sdkServer.listen(sdkPort, () => {
                CLDebug.Log(`SDK Server listening on http://localhost:${listener.address().port}`)
            }).on('error', (error: NodeJS.ErrnoException) => {
                if (error.code === 'EADDRINUSE') {
                    console.log(`ERROR: The SDK is either already running or the port (${sdkPort}) is in use by another process`)
                    return
                }

                throw error
            })

            CLDebug.Log('Initialization complete.')
        } catch (error) {
            CLDebug.Error(error, 'Conversation Learner Initialization')
        }
    }

    constructor(appId: string | undefined, maxTimeout?: number) {
        if (!ConversationLearner.options) {
            throw new Error("Init() must be called on ConversationLearner before instances are created")
        }

        if (typeof maxTimeout !== 'number') {
            maxTimeout = DEFAULT_MAX_SESSION_LENGTH
        }

        this.appId = appId;
        this.clRunner = CLRunner.Create(appId, maxTimeout, ConversationLearner.clClient)
    }

    public async recognize(turnContext: BB.TurnContext, force?: boolean): Promise<CLRecognizerResult | null> {
        return await this.clRunner.recognize(turnContext, force);
    }

    /**
     * OPTIONAL: Sessions are started automatically, StartSession call is only needed if bot needs
     * to start Conversation Learner Session with initial entity values.  
     * Results in clearing of existing Entity values, and a call to the OnSessionStartCallback
     * @param turnContext BotBuilder Context
     */
    public async StartSession(turnContext: BB.TurnContext): Promise<void> {
        await this.clRunner.BotStartSession(turnContext);
    }

    /**
     * Provide an callback that will be invoked whenever a Session is started
     * @param target Callback of the form (context: BB.TurnContext, memoryManager: ClientMemoryManager) => Promise<void>
     */
    public OnSessionStartCallback(target: OnSessionStartCallback) {
        this.clRunner.onSessionStartCallback = target
    }
    
    /**
     * Provide a callback that will be invoked whenever a Session ends.  Sessions
     * can end because of a timeout or the selection of an EndSession activity
     * @param target Callback of the form (context: BB.TurnContext, memoryManager: ClientMemoryManager, sessionEndState: CLM.SessionEndState, data: string | undefined) => Promise<string[] | undefined>
     */
    public OnSessionEndCallback(target: OnSessionEndCallback) {
        this.clRunner.onSessionEndCallback = target
    }

    public async SendResult(result: CLRecognizerResult): Promise<void> {
        return this.clRunner.SendIntent(result)
    }

    /** Returns true is bot is running in the Training UI
     * @param turnContext BotBuilder Context
     */
    public inTrainingUI(context: BB.TurnContext): boolean {
        return (context.activity.from.name === CL_DEVELOPER);
    }

    /** Define an API callback that can be used by the Model 
     * @param name Name of function that will be displayed in CL UI
     * @param target Callback of the form (memoryManager: ClientMemoryManager, ...args: string[]) => Promise<Partial<BB.Activity> | string | void>
     */
    public AddAPICallback(name: string, target: ApiCallback) {
        this.clRunner.AddAPICallback(name, target);
    }

    /** Define an Callback that will be called after Entity Detection
     * @param target Callback of the form (text: string, memoryManager: ClientMemoryManager) => Promise<void>
     */
    public EntityDetectionCallback(target: EntityDetectionCallback) {
        this.clRunner.entityDetectionCallback = target
    }
}

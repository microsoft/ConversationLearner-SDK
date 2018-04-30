/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import { CLRunner } from './CLRunner'
import { ICLOptions } from './CLOptions'
import { CLMemory } from './CLMemory'
import { CLDebug } from './CLDebug'
import { CLClient } from './CLClient'
import createSdkServer from './Http/Server'
import { startDirectOffLineServer } from './DOLRunner'
import { CL_DEVELOPER, DEFAULT_MAX_SESSION_LENGTH } from './Utils'
import { ClientMemoryManager } from './Memory/ClientMemoryManager'
import { CLRecognizerResult } from './CLRecognizeResult'

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
                startDirectOffLineServer(options.DOL_SERVICE_URL, options.DOL_BOT_URL)
            }

            const sdkServer = createSdkServer(this.clClient)
            sdkServer.listen(options.CONVERSATION_LEARNER_SDK_PORT, (err: any) => {
                if (err) {
                    CLDebug.Error(err, 'Server/Init')
                } else {
                    CLDebug.Log(`${sdkServer.name} listening to ${sdkServer.url}`)
                }
            })

            CLDebug.Log('Initialization complete.')
        } catch (error) {
            CLDebug.Error(error, 'Dialog Constructor')
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

    public async SendResult(result: CLRecognizerResult): Promise<void> {
        this.clRunner.SendIntent(result);
    }

    // Returns true is bot is running in the Training UI
    public inTrainingUI(activity: BB.Activity): boolean {
        return (activity.from.name === CL_DEVELOPER);
    }

    public AddAPICallback(
        name: string,
        target: (memoryManager: ClientMemoryManager, ...args: string[]) => Promise<Partial<BB.Activity> | string | void>
    ) {
        this.clRunner.AddAPICallback(name, target);
    }

    public EntityDetectionCallback(
        target: (text: string, memoryManager: ClientMemoryManager) => Promise<void>
    ) {
        this.clRunner.entityDetectionCallback = target
    }

    public OnSessionEndCallback(
        target: (memoryManager: ClientMemoryManager) => Promise<void>
    ) {
        this.clRunner.onSessionEndCallback = target
    }

    public OnSessionStartCallback(
        target: (memoryManager: ClientMemoryManager) => Promise<void>
    ) {
        this.clRunner.onSessionStartCallback = target
    }
}

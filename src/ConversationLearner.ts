import * as BB from 'botbuilder'
import { CLRecognizer } from './CLRecognizer'
import { CLRunner } from './CLRunner'
import { ICLOptions } from './CLOptions'
import { CLMemory } from './CLMemory'
import { CLDebug } from './CLDebug'
import { CLClient } from './CLClient'
import createSdkServer from './Http/Server'
import { startDirectOffLineServer } from './DOLRunner'
import { ClientMemoryManager } from './Memory/ClientMemoryManager'
import { CLRecognizerResult } from './CLRecognizeResult'

const DEFAULT_MAX_SESSION_LENGTH = 20 * 60 * 1000;  // 20 minutes

export class ConversationLearner {
    public static options: ICLOptions
    public static clRecognizer: CLRecognizer
    public static clRunner: CLRunner

    public static Init(options: ICLOptions, storage: BB.Storage | null = null) {
        if (typeof options.sessionMaxTimeout !== 'number') {
            options.sessionMaxTimeout = DEFAULT_MAX_SESSION_LENGTH
        }

        ConversationLearner.options = options

        try {
            CLDebug.Log('Creating Conversation Learner Client....')
            let clClient = new CLClient(options)
            CLMemory.Init(storage)

            // If app not set, assume running on localhost init DOL Runner
            if (options.localhost) {
                startDirectOffLineServer(options.dolServiceUrl, options.dolBotUrl)
            }

            const sdkServer = createSdkServer(clClient)
            sdkServer.listen(options.sdkPort, (err: any) => {
                if (err) {
                    CLDebug.Error(err, 'Server/Init')
                } else {
                    CLDebug.Log(`${sdkServer.name} listening to ${sdkServer.url}`)
                }
            })

            CLDebug.Log('Initialization complete.')

            ConversationLearner.clRecognizer = new CLRecognizer(options, clClient)
            ConversationLearner.clRunner = CLRunner.Create(clClient, this.clRecognizer);
        } catch (error) {
            CLDebug.Error(error, 'Dialog Constructor')
        }
    }

    public static async recognize(turnContext: BB.TurnContext, force?: boolean): Promise<CLRecognizerResult | null> {
        return await ConversationLearner.clRecognizer.recognize(turnContext, force);
    }

    public static async SendResult(result: CLRecognizerResult): Promise<void> {
        this.clRunner.SendIntent(result);
    }

    public static AddAPICallback(
        name: string,
        target: (memoryManager: ClientMemoryManager, ...args: string[]) => Promise<BB.Activity | string | undefined>
    ) {
        this.clRunner.AddAPICallback(name, target);
    }

    public static EntityDetectionCallback(
        target: (text: string, memoryManager: ClientMemoryManager) => Promise<void>
    ) {
        ConversationLearner.clRunner.entityDetectionCallback = target
    }

    public static OnSessionEndCallback(
        target: (memoryManager: ClientMemoryManager) => Promise<void>
    ) {
        ConversationLearner.clRunner.onSessionEndCallback = target
    }

    public static OnSessionStartCallback(
        target: (memoryManager: ClientMemoryManager) => Promise<void>
    ) {
        ConversationLearner.clRunner.onSessionStartCallback = target
    }
}

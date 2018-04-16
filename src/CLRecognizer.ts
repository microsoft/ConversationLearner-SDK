import * as BB from 'botbuilder'
import { UserInput, PredictedEntity, EntityBase, ScoredAction, SessionCreateParams, AppBase } from 'conversationlearner-models'
import { CLDebug } from './CLDebug'
import { CLMemory } from './CLMemory'
import { CLClient } from './CLClient'
import { CLContext } from './CLContext'
import { CLRecognizerResult } from './CLIntent'
import { ConversationLearner } from './ConversationLearner'
import { ICLOptions } from './CLOptions'
import { CL_DEVELOPER } from './Utils';
import { InputQueue } from './Memory/InputQueue';
const util = require('util');

export const CL_INTENT_WRAPPER = 'CL_INTENT_WRAPPER'

export class CLRecognizer implements BB.Middleware {
    private client: CLClient
    private options: ICLOptions

    constructor(options: ICLOptions, client: CLClient) {
        this.options = options
        this.client = client
    }

    public onTurn(turnContext: BB.TurnContext, next: () => Promise<void>): Promise<void> {
        return this.recognize(turnContext, true)
                   .then(() => next());
    }

    public recognize(turnContext: BB.TurnContext, force?: boolean): Promise<CLRecognizerResult | null> {

        return this.AddInput(turnContext).then(res => {
            return res;
        })
    }

    // Add input queu
    private async AddInput(turnContext: BB.TurnContext) : Promise<CLRecognizerResult | null> {

        if (turnContext.activity.from === undefined || turnContext.activity.id == undefined) {
            return null;
        }

        let conversationReference = BB.TurnContext.getConversationReference(turnContext.activity);

        ConversationLearner.SetAdapter(turnContext.adapter, conversationReference);

        let clContext = await CLContext.CreateAsync(turnContext.activity.from, conversationReference)
        let botState = clContext.Memory().BotState;
        let addInputPromise = util.promisify(InputQueue.AddInput);
        let isReady = await addInputPromise(botState, turnContext.activity, conversationReference);
        
        if (isReady)
        {
            let intents = await this.ProcessInput(turnContext.activity, conversationReference);

            // Remove message from queue
            InputQueue.InputQueuePop(botState, turnContext.activity.id);
            return intents;
        }
        // Message has expired 
        return null;
    }

    private async StartSessionAsync(user: BB.ChannelAccount | undefined, memory: CLMemory, appId: string, saveToLog: boolean, packageId: string): Promise<string> {

        let sessionCreateParams = {saveToLog, packageId} as SessionCreateParams
        let sessionResponse = await this.client.StartSession(appId, sessionCreateParams)
        if (!user) {
            throw new Error(`Attempted to start session but user was not set on current request.`)
        }

        if (!user.id) {
            throw new Error(`Attempted to start session but user.id was not set on current request.`)
        }

        await memory.StartSessionAsync(sessionResponse.sessionId, user.id, { inTeach: false, isContinued: false })
        CLDebug.Verbose(`Started Session: ${sessionResponse.sessionId} - ${user.id}`)
        return sessionResponse.sessionId
    }

    private async SetApp(memory: CLMemory, inEditingUI: boolean) : Promise<AppBase | null> {

        let app = await memory.BotState.AppAsync()

        // If I'm not in the editing UI, always use app specified by options
        if (app) {         
            if (!inEditingUI && app.appId != this.options.appId)
            {
                // Use config value
                CLDebug.Log(`Switching to app specified in config: ${this.options.appId}`)
                app = await this.client.GetApp(this.options.appId)
                await memory.SetAppAsync(app)
            }
        }
        // If I don't have an app, attempt to use one set in config
        else if (this.options.appId) {
            CLDebug.Log(`Selecting app specified in config: ${this.options.appId}`)
            app = await this.client.GetApp(this.options.appId)
            await memory.SetAppAsync(app)
        }

        return app;
    }

    private async ProcessInput(request: BB.Activity, conversationReference: Partial<BB.ConversationReference>): Promise<CLRecognizerResult | null> {
        let errComponent = 'ProcessInput'
        let memory: CLMemory | null = null
        try {
            CLDebug.Verbose(`Process Input...`)

            // Validate request
            if (!request.from || !request.from.id) {
                throw new Error(`Attempted to get current session for user, but user was not defined on bot request.`)
            }

            let clContext = await CLContext.CreateAsync(request.from, conversationReference)
            memory = clContext.Memory()

            // Validate setup
            let validationError = ConversationLearner.OptionsValidationErrors()
            if (validationError) {
                CLDebug.Error(validationError)
                await ConversationLearner.SendMessage(memory, validationError)
                return null
            }

            let inTeach = await memory.BotState.InTeachAsync()
            let inEditingUI = 
                conversationReference.user &&
                conversationReference.user.name === CL_DEVELOPER || false;

            let app = await this.SetApp(memory, inEditingUI);
            
            if (!app) {
                let error = "ERROR: AppId not specified.  When running in a channel (i.e. Skype) or the Bot Framework Emulator, CONVERSATION_LEARNER_APP_ID must be specified in your Bot's .env file or Application Settings on the server"
                await ConversationLearner.SendMessage(memory, error)
                return null;
            }


            let sessionId = await memory.BotState.SessionIdAsync(request.from.id)

            // Make sure session hasn't expired
            if (!inTeach && sessionId) {
                const currentTicks = new Date().getTime();
                let lastActive = await memory.BotState.LastActiveAsync()
                let passedTicks = currentTicks - lastActive;

                // If session expired, create a new one
                if (passedTicks > this.options.sessionMaxTimeout!) { 

                    // End the current session, clear the memory
                    await this.client.EndSession(app.appId, sessionId);
                    memory.EndSessionAsync()

                    // If I'm not in the UI, reload the App to get any changes (live package version may have been updated)
                    if (!inEditingUI) {
                        app = await this.client.GetApp(this.options.appId)
                        await memory.SetAppAsync(app)
              
                        if (!app) {
                            let error = "ERROR: AppId not specified.  When running in a channel (i.e. Skype) or the Bot Framework Emulator, CONVERSATION_LEARNER_APP_ID must be specified in your Bot's .env file or Application Settings on the server"
                            await ConversationLearner.SendMessage(memory, error)
                            return null;
                        }
                    }
                    
                    // Start a new session 
                    let sessionResponse = await this.client.StartSession(app.appId, {saveToLog: app.metadata.isLoggingOn})
        
                    // Update Memory, passing in original sessionId for reference
                    let conversationId = await memory.BotState.ConversationIdAsync()
                    memory.StartSessionAsync(sessionResponse.sessionId, conversationId, { inTeach: inTeach, isContinued: false }, sessionId)

                    // Set new sessionId
                    sessionId = sessionResponse.sessionId;
                }
                // Otherwise update last access time
                else {
                    await memory.BotState.SetLastActiveAsync(currentTicks);
                }
            }

            // PackageId: Use live package id if not in editing UI, default to devPackage if no active package set
            let packageId = (inEditingUI ? await memory.BotState.EditingPackageAsync(app.appId) : app.livePackageId) || app.devPackageId
            if (!packageId) {
                let error = "ERROR: No PackageId has been set"
                await ConversationLearner.SendMessage(memory, error)
                return null;
            }

            // If no session for this conversation (or it's expired), create a new one
            if (!sessionId) {
                sessionId = await this.StartSessionAsync(request.from, memory, app.appId, app.metadata.isLoggingOn !== false, packageId)
            }

            // Process any form data
            let buttonResponse = await this.ProcessFormData(request, memory, app.appId)

            // Teach inputs are handled via API calls from the Conversation Learner UI
            if (!inTeach) {

                // Was it a conversationUpdate message?
                if (request.type == "conversationUpdate") {
                    // Do nothing
                    CLDebug.Verbose(`Conversation update...  ${+JSON.stringify(request.membersAdded)} -${JSON.stringify(request.membersRemoved)}`);
                    return null;
                }

                let entities: EntityBase[] = []

                errComponent = 'SessionExtract'
                let userInput: UserInput = { text: buttonResponse || request.text || '  ' }
                let extractResponse = await this.client.SessionExtract(app.appId, sessionId, userInput)
                entities = extractResponse.definitions.entities
                errComponent = 'ProcessExtraction'
                const scoredAction = await this.Score(
                    app.appId,
                    sessionId,
                    memory,
                    extractResponse.text,
                    extractResponse.predictedEntities,
                    entities,
                    inTeach
                )
                return {
                    scoredAction: scoredAction,
                    clEntities: entities,
                    memory: memory,
                    inTeach: false
                } as CLRecognizerResult
            }
            return null
        } catch (error) {
            CLDebug.Log(`Error during ProcessInput: ${error.message}`)
            // TODO: This code makes assumption about memory being assigned above, but memory would remain as null if it reached this point of catch statement.
            // Session is invalid
            if (memory) {
                CLDebug.Verbose('ProcessInput Failure. Clearing Session')
                // memory.EndSession()
            }
            let msg = CLDebug.Error(error, errComponent)
            if (memory) {
                await ConversationLearner.SendMessage(memory, msg)
            }
            return null
        }
    }

    private async ProcessFormData(request: BB.Activity, clMemory: CLMemory, appId: string): Promise<string | null> {
        const data = request.value as FormData
        if (data) {
            // Get list of all entities
            let entityList = await this.client.GetEntities(appId)

            // For each form entry
            for (let entityName of Object.keys(data)) {
                // Reserved parameter
                if (entityName == 'submit') {
                    continue
                }

                // Find the entity
                let entity = entityList.entities.find(e => e.entityName == entityName)

                if (!entity) {
                    CLDebug.Error(`Form - Can't find Entity named: ${entityName}`)
                    return null
                }
                // Set it
                await clMemory.BotMemory.RememberEntity(entity.entityName, entity.entityId, data[entityName], entity.isMultivalue)
            }

            // If submit type return as a response
            if (data['submit']) {
                return data['submit']
            } else {
                CLDebug.Error(`Adaptive Card has no Sumbit data`)
                return null
            }
        }
        return null
    }

    public async Score(
        appId: string,
        sessionId: string,
        memory: CLMemory,
        text: string,
        predictedEntities: PredictedEntity[],
        allEntities: EntityBase[],
        inTeach: boolean
    ): Promise<ScoredAction> {
        // Call LUIS callback
        let scoreInput = await ConversationLearner.CallEntityDetectionCallback(text, predictedEntities, memory, allEntities)

        // Call the scorer
        let scoreResponse = null
        if (inTeach) {
            scoreResponse = await this.client.TeachScore(appId, sessionId, scoreInput)
        } else {
            scoreResponse = await this.client.SessionScore(appId, sessionId, scoreInput)
        }

        // Get best action
        let bestAction = scoreResponse.scoredActions[0]

        // Return the action
        return bestAction
    }
}

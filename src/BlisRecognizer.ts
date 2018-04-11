import * as BB from 'botbuilder'
import { UserInput, PredictedEntity, EntityBase, ScoredAction, SessionCreateParams, BlisAppBase } from 'blis-models'
import { BlisDebug } from './BlisDebug'
import { BlisMemory } from './BlisMemory'
import { BlisClient } from './BlisClient'
import { BlisContext } from './BlisContext'
import { BlisIntent } from './BlisIntent'
import { Blis } from './Blis'
import { IBlisOptions } from './BlisOptions'
import { BLIS_DEVELOPER } from './Utils';
import { InputQueue } from './Memory/InputQueue';
const util = require('util');

export const BLIS_INTENT_WRAPPER = 'BLIS_INTENT_WRAPPER'

export class BlisRecognizer extends BB.IntentRecognizer {
    private client: BlisClient
    private options: IBlisOptions

    constructor(options: IBlisOptions, client: BlisClient) {
        super()

        this.options = options
        this.client = client

        this.onRecognize(botContext => {

            const intents: BB.Intent[] = []
            return this.AddInput(botContext).then(res => {
                if (res) {
                    intents.push(res)
                }
                return intents
            })
        })
    }

    private async AddInput(botContext: BotContext) : Promise<BB.Intent | null> {

        Blis.SetBot(botContext)

        let conversationReference = botContext.conversationReference;
        let request = botContext.request;

        if (request.from === undefined || request.id == undefined) {
            return null;
        }

        let blisContext = await BlisContext.CreateAsync(Blis.bot, request.from, conversationReference)
        let botState = blisContext.Memory().BotState;

        let addInputPromise = util.promisify(InputQueue.AddInput);
        let isReady = await addInputPromise(botState, request, conversationReference);
        
        if (isReady)
        {
            let intents2 = await this.ProcessInput(request, conversationReference);
            botState.InputQueuePop(request.id);
            return intents2;
        }

        return null;

        /*
                let intents = await addInputPromise(blisContext.Memory().BotState, botContext.request, botContext.conversationReference, (async () => 
            {
                let intents2 = await this.ProcessInput(botContext.request, botContext.conversationReference);
                return intents2;
            }))  
        */
    }

    private async StartSessionAsync(user: BB.ChannelAccount | undefined, memory: BlisMemory, appId: string, saveToLog: boolean, packageId: string): Promise<string> {

        let sessionCreateParams = {saveToLog, packageId} as SessionCreateParams
        let sessionResponse = await this.client.StartSession(appId, sessionCreateParams)
        if (!user) {
            throw new Error(`Attempted to start session but user was not set on current request.`)
        }

        if (!user.id) {
            throw new Error(`Attempted to start session but user.id was not set on current request.`)
        }

        await memory.StartSessionAsync(sessionResponse.sessionId, user.id, { inTeach: false, isContinued: false })
        BlisDebug.Verbose(`Started Session: ${sessionResponse.sessionId} - ${user.id}`)
        return sessionResponse.sessionId
    }

    private async SetApp(memory: BlisMemory, inEditingUI: boolean) : Promise<BlisAppBase | null> {

        let app = await memory.BotState.AppAsync()

        // If I'm not in the editing UI, always use app specified by options
        if (app) {         
            if (!inEditingUI && app.appId != this.options.appId)
            {
                // Use config value
                BlisDebug.Log(`Switching to app specified in config: ${this.options.appId}`)
                app = await this.client.GetApp(this.options.appId)
                await memory.SetAppAsync(app)
            }
        }
        // If I don't have an app, attempt to use one set in config
        else if (this.options.appId) {
            BlisDebug.Log(`Selecting app specified in config: ${this.options.appId}`)
            app = await this.client.GetApp(this.options.appId)
            await memory.SetAppAsync(app)
        }

        return app;
    }

    private async ProcessInput(request: BB.Activity, conversationReference: BB.ConversationReference): Promise<BB.Intent | null> {
        let errComponent = 'ProcessInput'
        let memory: BlisMemory | null = null
        try {
            BlisDebug.Verbose(`Process Input...`)

            // Validate request
            if (!request.from || !request.from.id) {
                throw new Error(`Attempted to get current session for user, but user was not defined on bot request.`)
            }

            let blisContext = await BlisContext.CreateAsync(Blis.bot, request.from, conversationReference)
            memory = blisContext.Memory()

            // Validate setup
            let validationError = Blis.OptionsValidationErrors()
            if (validationError) {
                BlisDebug.Error(validationError)
                await Blis.SendMessage(memory, validationError)
                return null
            }

            let inTeach = await memory.BotState.InTeachAsync()
            let inEditingUI = 
                conversationReference.user &&
                conversationReference.user.name === BLIS_DEVELOPER || false;

            let app = await this.SetApp(memory, inEditingUI);
            
            if (!app) {
                let error = "ERROR: AppId not specified.  When running in a channel (i.e. Skype) or the Bot Framework Emulator, BLIS_APP_ID must be specified in your Bot's .env file or Application Settings on the server"
                await Blis.SendMessage(memory, error)
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
                await Blis.SendMessage(memory, error)
                return null;
            }

            // If no session for this conversation (or it's expired), create a new one
            if (!sessionId) {
                sessionId = await this.StartSessionAsync(request.from, memory, app.appId, app.metadata.isLoggingOn !== false, packageId)
            }

            // Process any form data
            let buttonResponse = await this.ProcessFormData(request, memory, app.appId)

            // Teach inputs are handled via API calls from the BLIS api
            if (!inTeach) {

                // Was it a conversationUpdate message?
                if (request.type == "conversationUpdate") {
                    // Do nothing
                    BlisDebug.Verbose(`Conversation update...  ${+JSON.stringify(request.membersAdded)} -${JSON.stringify(request.membersRemoved)}`);
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
                    name: scoredAction.actionId,
                    score: 1.0,
                    scoredAction: scoredAction,
                    blisEntities: entities,
                    memory: memory,
                    inTeach: false
                } as BlisIntent
            }
            return null
        } catch (error) {
            BlisDebug.Log(`Error during ProcessInput: ${error.message}`)
            // TODO: This code makes assumption about memory being assigned above, but memory would remain as null if it reached this point of catch statement.
            // Session is invalid
            if (memory) {
                BlisDebug.Verbose('ProcessInput Failure. Clearing Session')
                // memory.EndSession()
            }
            let msg = BlisDebug.Error(error, errComponent)
            if (memory) {
                await Blis.SendMessage(memory, msg)
            }
            return null
        }
    }

    private async ProcessFormData(request: BB.Activity, blisMemory: BlisMemory, appId: string): Promise<string | null> {
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
                    BlisDebug.Error(`Form - Can't find Entity named: ${entityName}`)
                    return null
                }
                // Set it
                await blisMemory.BotMemory.RememberEntity(entity.entityName, entity.entityId, data[entityName], entity.isMultivalue)
            }

            // If submit type return as a response
            if (data['submit']) {
                return data['submit']
            } else {
                BlisDebug.Error(`Adaptive Card has no Sumbit data`)
                return null
            }
        }
        return null
    }

    public async Score(
        appId: string,
        sessionId: string,
        memory: BlisMemory,
        text: string,
        predictedEntities: PredictedEntity[],
        allEntities: EntityBase[],
        inTeach: boolean
    ): Promise<ScoredAction> {
        // Call LUIS callback
        let scoreInput = await Blis.CallEntityDetectionCallback(text, predictedEntities, memory, allEntities)

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

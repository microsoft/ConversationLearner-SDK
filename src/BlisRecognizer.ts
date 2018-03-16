import * as BB from 'botbuilder'
import { UserInput, PredictedEntity, EntityBase, ScoredAction, SessionCreateParams } from 'blis-models'
import { BlisDebug } from './BlisDebug'
import { BlisMemory } from './BlisMemory'
import { BlisClient } from './BlisClient'
import { BlisContext } from './BlisContext'
import { BlisIntent } from './BlisIntent'
import { Blis } from './Blis'
import { IBlisOptions } from './BlisOptions'

export const BLIS_INTENT_WRAPPER = 'BLIS_INTENT_WRAPPER'

// Maxium allowed chat session length
const MAX_SESSION_LENGTH = 20*60*1000;  // 20 minutes

export class BlisRecognizer extends BB.IntentRecognizer {
    private client: BlisClient

    constructor(options: IBlisOptions, client: BlisClient) {
        super()

        this.client = client

        this.onRecognize(botContext => {

            Blis.SetBot(botContext)

            const intents: BB.Intent[] = []
            return this.ProcessInput(botContext).then(res => {
                if (res) {
                    intents.push(res)
                }
                return intents
            })
        })
    }

    private async StartSessionAsync(botContext: BotContext, memory: BlisMemory, appId: string, saveToLog: boolean, packageId: string): Promise<string> {

        let sessionCreateParams = {saveToLog, packageId} as SessionCreateParams
        let sessionResponse = await this.client.StartSession(appId, sessionCreateParams)
        const user = botContext.request.from
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

    private async ProcessInput(botContext: BotContext): Promise<BB.Intent | null> {
        let errComponent = 'ProcessInput'
        let memory: BlisMemory | null = null
        try {
            BlisDebug.Verbose(`Process Input...`)
            let blisContext = await BlisContext.CreateAsync(Blis.bot, botContext)

            memory = blisContext.Memory()

            // Validate setup
            let validationError = Blis.ValidationErrors()
            if (validationError) {
                BlisDebug.Error(validationError)
                await Blis.SendMessage(memory, validationError)
                return null
            }

            let inTeach = await memory.BotState.InTeachAsync()
            let app = await memory.BotState.AppAsync()
            let sessionId = null

            // If I don't have an app, default to using config
            if (!app && Blis.options.appId) {

                BlisDebug.Log(`Selecting app specified in config: ${Blis.options.appId}`)
                app = await this.client.GetApp(Blis.options.appId)
                await memory.SetAppAsync(app)
            }
            
            if (!app) {
                throw new Error('BLIS AppID not specified')
            }
            
            let packageId = await memory.BotState.ActiveAppAsync(app.appId)

            // Attempt to load the session
            const user = botContext.request.from
            if (!user || !user.id) {
                throw new Error(`Attempted to get current session for user, but user was not defined on bot request.`)
            }

            sessionId = await memory.BotState.SessionIdAsync(user.id)

            // Make sure session hasn't expired
            if (!inTeach && sessionId) {
                const currentTicks = new Date().getTime();
                let lastActive = await memory.BotState.LastActiveAsync()
                let passedTicks = currentTicks - lastActive;

                // If session expired, create a new one
                if (passedTicks > MAX_SESSION_LENGTH) { 

                    // Store conversationId
                    let conversationId = await memory.BotState.ConversationIdAsync()

                    // End the current session, clear the memory
                    await Blis.blisClient.EndSession(app.appId, sessionId);
                    memory.EndSessionAsync()

                    // Start a new session 
                    let sessionResponse = await Blis.blisClient.StartSession(app.appId, {saveToLog: app.metadata.isLoggingOn, packageId: packageId})
        
                    // Update Memory, passing in original sessionId for reference

                    memory.StartSessionAsync(sessionResponse.sessionId, conversationId, { inTeach: inTeach, isContinued: false }, sessionId)

                    // Set new sessionId
                    sessionId = sessionResponse.sessionId;
                }
                // Otherwise update last access time
                else {
                    await memory.BotState.SetLastActiveAsync(currentTicks);
                }
            }

            // If no session for this conversation (or it's expired), create a new one
            if (!sessionId) {
                sessionId = await this.StartSessionAsync(botContext, memory, app.appId, app.metadata.isLoggingOn !== false, packageId)
            }

            // Process any form data
            let buttonResponse = await this.ProcessFormData(botContext, memory, app.appId)

            // Teach inputs are handled via API calls from the BLIS api
            if (!inTeach) {
                let entities: EntityBase[] = []

                errComponent = 'SessionExtract'
                let userInput: UserInput = { text: buttonResponse || botContext.request.text || '  ' }
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

    private async ProcessFormData(context: BotContext, blisMemory: BlisMemory, appId: string): Promise<string | null> {
        const data = context.request.value as FormData
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

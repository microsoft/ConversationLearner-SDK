/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as BB from 'botbuilder'
import { CLMemory } from './CLMemory'
import { BotMemory } from './Memory/BotMemory'
import { CLDebug } from './CLDebug'
import { CLClient } from './CLClient'
import { TemplateProvider } from './TemplateProvider'
import * as CLM from 'conversationlearner-models'
import { ClientMemoryManager } from './Memory/ClientMemoryManager'
import { addEntitiesById,CL_DEVELOPER, generateGUID } from './Utils'
import { CLRecognizerResult } from './CLRecognizeResult'
import { ConversationLearner } from './ConversationLearner'
import { InputQueue } from './Memory/InputQueue'
import * as util from 'util'

interface RunnerLookup {
    [appId: string] : CLRunner
}

export interface ISessionStartParams {
    inTeach: boolean
    isContinued: boolean
}

export class CLRunner {

    // Lookup table for incoming calls from UI
    private static Runners: RunnerLookup = {}
    private static UIRunner: CLRunner;

    public clClient: CLClient
    public adapter: BB.BotAdapter
    private appId: string;
    private maxTimeout: number | undefined;  // TODO: Move timeout to app settings

    // Mapping between user defined API names and functions
    public apiCallbacks: { [name: string]: (memoryManager: ClientMemoryManager, ...args: string[]) => Promise<Partial<BB.Activity> | string | void> } = {}
    public apiParams: CLM.CallbackAPI[] = []   

    public static Create(appId: string | undefined, maxTimeout: number | undefined, client: CLClient): CLRunner {

        // Ok to not provide appId when just running in training UI 
        if (!appId) {
            appId = "UIRunner";
        }

        let newRunner = new CLRunner(appId, maxTimeout, client);
        CLRunner.Runners[appId] = newRunner;

        // Always run UI on first CL defined in the bot
        if (!CLRunner.UIRunner) {
            CLRunner.UIRunner = newRunner;
        }
        return newRunner;
    }

    // Get CLRunner for an app
    public static Get(appId: string) : CLRunner {

        // If runner with the appId doesn't exist, use the UI Runner
        if (!CLRunner.Runners[appId]) {
            if (CLRunner.UIRunner) {
                return CLRunner.UIRunner;
            } else {
                throw new Error(`Not in UI and requested CLRunner that doesn't exist: ${appId}`)
            }
        }
        return CLRunner.Runners[appId];
    }

    private constructor(appId: string, maxTimeout: number | undefined, client: CLClient) {
        this.appId = appId
        this.maxTimeout = maxTimeout
        this.clClient = client
    }


    public onTurn(turnContext: BB.TurnContext, next: () => Promise<void>): Promise<void> {
        return this.recognize(turnContext, true)
                   .then(next);
    }

    public recognize(turnContext: BB.TurnContext, force?: boolean): Promise<CLRecognizerResult | null> {

        // Add input to queue
        return this.AddInput(turnContext).then(res => {
            return res;
        })
    }

    public SetAdapter(adapter: BB.BotAdapter, conversationReference: Partial<BB.ConversationReference>) {
        if (!this.adapter) {
            this.adapter = adapter
            CLDebug.InitLogger(adapter, conversationReference)
        }
    }

    // Add input to queue.  Allows CL to handle out-of-order messages
    private async AddInput(turnContext: BB.TurnContext) : Promise<CLRecognizerResult | null> {

        // Set adapter / conversation reference even if from field not set
        let conversationReference = BB.TurnContext.getConversationReference(turnContext.activity);
        this.SetAdapter(turnContext.adapter, conversationReference);

        if (turnContext.activity.from === undefined || turnContext.activity.id == undefined) {
            return null;
        }

        let clMemory = await CLMemory.InitMemory(turnContext.activity.from, conversationReference)
        let botState = clMemory.BotState;

        // If I'm in teach mode process message right away
        let inTeach = await botState.GetInTeach();
        if (inTeach) {
            return await this.ProcessInput(turnContext.activity, conversationReference);
        }

        // Otherwise I have to queue up messages as user may input them faster than bot reponds
        else {
            let addInputPromise = util.promisify(InputQueue.AddInput);
            let isReady = await addInputPromise(botState, turnContext.activity, conversationReference);
            
            if (isReady)
            {
                let intents = await this.ProcessInput(turnContext.activity, conversationReference);
                return intents;
            }
            // Message has expired 
            return null;
        }
    }

    private async StartSessionAsync(memory: CLMemory, user: BB.ChannelAccount | undefined, appId: string, saveToLog: boolean, packageId: string): Promise<string> {

        let sessionCreateParams = {saveToLog, packageId} as CLM.SessionCreateParams
        let sessionResponse = await this.clClient.StartSession(appId, sessionCreateParams)
        if (!user) {
            throw new Error(`Attempted to start session but user was not set on current request.`)
        }

        if (!user.id) {
            throw new Error(`Attempted to start session but user.id was not set on current request.`)
        }

        await this.InitSessionAsync(memory, sessionResponse.sessionId, sessionResponse.logDialogId, user.id, { inTeach: false, isContinued: false })
        CLDebug.Verbose(`Started Session: ${sessionResponse.sessionId} - ${user.id}`)
        return sessionResponse.sessionId
    }

    // Get the currently runing app
    private async GetApp(memory: CLMemory, inEditingUI: boolean) : Promise<CLM.AppBase | null> {

        let app = await memory.BotState.GetApp()

        // If I'm not in the editing UI, always use app specified by options
        if (app) {         
            if (!inEditingUI && app.appId != this.appId)
            {
                // Use config value
                CLDebug.Log(`Switching to app specified in config: ${this.appId}`)
                app = await this.clClient.GetApp(this.appId)
                await memory.SetAppAsync(app)
            }
        }
        // If I don't have an app, attempt to use one set in config
        else if (this.appId) {
            CLDebug.Log(`Selecting app specified in config: ${this.appId}`)
            app = await this.clClient.GetApp(this.appId)
            await memory.SetAppAsync(app)
        }

        return app;
    }


    // Initialize a log or teach session 
    public async InitSessionAsync(clMemory: CLMemory, sessionId: string, logDialogId: string | null, conversationId: string | null, params: ISessionStartParams, orgSessionId: string | null = null): Promise<void> {
    
        let app = await clMemory.BotState.GetApp()

        // If not continuing an edited session or restarting an expired session 
        if (!params.isContinued && !orgSessionId) {

            // If onEndSession hasn't been called yet, call it
            let calledEndSession = await clMemory.BotState.GetEndSessionCalled();
            if (!calledEndSession) {

                // Default callback will clear the bot memory
                await this.CallSessionEndCallback(clMemory, app ? app.appId : null);
            }
        }
        await this.CallSessionStartCallback(clMemory, app ? app.appId : null);
        await clMemory.BotState.SetSessionAsync(sessionId, logDialogId, conversationId, params.inTeach, orgSessionId)
    }

    // End a teach or log session
    public async EndSessionAsync(key: string): Promise<void> {

        let memory = CLMemory.GetMemory(key)
        let app = await memory.BotState.GetApp()

        // Default callback will clear the bot memory
        await this.CallSessionEndCallback(memory, app ? app.appId : null);

        await memory.BotState.EndSessionAsync();
    }

    // Proces user input
    private async ProcessInput(activity: BB.Activity, conversationReference: Partial<BB.ConversationReference>): Promise<CLRecognizerResult | null> {
        let errComponent = 'ProcessInput'

        // Validate request
        if (!activity.from || !activity.from.id) {
            throw new Error(`Attempted to get current session for user, but user was not defined on bot request.`)
        }

        let memory = await CLMemory.InitMemory(activity.from, conversationReference)

        try {
            CLDebug.Verbose(`Process Input...`)

            let inTeach = await memory.BotState.GetInTeach()
            let inEditingUI = 
                conversationReference.user &&
                conversationReference.user.name === CL_DEVELOPER || false;

            // Validate setup
            if (!inEditingUI && !this.appId) {
                let msg =  'Must specify appId in CL constructor when not running bot in Editing UI\n\n'
                CLDebug.Error(msg)
                await this.SendMessage(memory, msg, activity.id)
                return null
            }

            if (!ConversationLearner.options || !ConversationLearner.options.LUIS_AUTHORING_KEY) {
                // TODO: Remove mention of environment variables. They are not guaranteed and are part of different repository.
                let msg =  'Options must specify luisAuthoringKey.  Set the LUIS_AUTHORING_KEY.\n\n'
                CLDebug.Error(msg)
                await this.SendMessage(memory, msg, activity.id)
                return null
            }

            let app = await this.GetApp(memory, inEditingUI);
            
            if (!app) {
                let error = "ERROR: AppId not specified.  When running in a channel (i.e. Skype) or the Bot Framework Emulator, CONVERSATION_LEARNER_APP_ID must be specified in your Bot's .env file or Application Settings on the server"
                await this.SendMessage(memory, error, activity.id)
                return null;
            }

            let sessionId = await memory.BotState.GetSessionId(activity.from.id)

            // Make sure session hasn't expired
            if (!inTeach && sessionId) {


                if (activity.type == "conversationUpdate")  {
                    
                    CLDebug.Verbose(`Conversation update...  +${JSON.stringify(activity.membersAdded)} -${JSON.stringify(activity.membersRemoved)}`);

                    // End the current session for user joining the conversation
                    if (activity.membersAdded &&
                        activity.from.id === activity.membersAdded[0].id) {
                        await this.clClient.EndSession(app.appId, sessionId);
                        await this.EndSessionAsync(activity.from.id)
                    }

                    await InputQueue.MessageHandled(memory.BotState, activity.id);
                    return null;
                }
                
                // If session expired, create a new one
                const currentTicks = new Date().getTime();
                let lastActive = await memory.BotState.GetLastActive()
                let passedTicks = currentTicks - lastActive;
                if (passedTicks > this.maxTimeout!) { 

                    // End the current session, clear the memory
                    await this.clClient.EndSession(app.appId, sessionId);
                    await this.EndSessionAsync(activity.from.id)

                    // If I'm not in the UI, reload the App to get any changes (live package version may have been updated)
                    if (!inEditingUI) {
                        app = await this.clClient.GetApp(this.appId)
                        await memory.SetAppAsync(app)
              
                        if (!app) {
                            let error = "ERROR: AppId not specified.  When running in a channel (i.e. Skype) or the Bot Framework Emulator, CONVERSATION_LEARNER_APP_ID must be specified in your Bot's .env file or Application Settings on the server"
                            await this.SendMessage(memory, error, activity.id)
                            return null
                        }
                    }
                    
                    // Start a new session 
                    let sessionResponse = await this.clClient.StartSession(app.appId, {saveToLog: app.metadata.isLoggingOn})
        
                    // Update Memory, passing in original sessionId for reference
                    let conversationId = await memory.BotState.GetConversationId()
                    this.InitSessionAsync(memory, sessionResponse.sessionId, sessionResponse.logDialogId, conversationId, { inTeach: inTeach, isContinued: false }, sessionId)

                    // Set new sessionId
                    sessionId = sessionResponse.sessionId;
                }
                // Otherwise update last access time
                else {
                    await memory.BotState.SetLastActive(currentTicks);
                }
            }

            // PackageId: Use live package id if not in editing UI, default to devPackage if no active package set
            let packageId = (inEditingUI ? await memory.BotState.GetEditingPackageForApp(app.appId) : app.livePackageId) || app.devPackageId
            if (!packageId) {
                await this.SendMessage(memory, "ERROR: No PackageId has been set", activity.id)
                return null;
            }

            // If no session for this conversation (or it's expired), create a new one
            if (!sessionId) {
                sessionId = await this.StartSessionAsync(memory, activity.from, app.appId, app.metadata.isLoggingOn !== false, packageId)
            }

            // Process any form data
            let buttonResponse = await this.ProcessFormData(activity, memory, app.appId)

            // Teach inputs are handled via API calls from the Conversation Learner UI
            if (!inTeach) {

                let entities: CLM.EntityBase[] = []

                errComponent = 'SessionExtract'
                let userInput: CLM.UserInput = { text: buttonResponse || activity.text || '  ' }
                let extractResponse = await this.clClient.SessionExtract(app.appId, sessionId, userInput)
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
                    inTeach: false,
                    activity: activity
                } as CLRecognizerResult
            }
            return null
        } catch (error) {
            CLDebug.Log(`Error during ProcessInput: ${error.message}`)

            // End the session, so use can potentially recover
            await this.EndSessionAsync(activity.from.id)

            // Special message for 403 as it's like a bad appId
            let customError = null;
            if (error.statusCode === 403) {
                customError = `403 Forbidden:  Please check you have set a valid CONVERSATION_LEARNER_APP_ID`
            }

            let msg = CLDebug.Error(customError || error, errComponent)
            if (memory) {
                await this.SendMessage(memory, msg, activity.id)
            }
            return null
        }
    }

    private async ProcessFormData(request: BB.Activity, clMemory: CLMemory, appId: string): Promise<string | null> {
        const data = request.value as FormData
        if (data) {
            // Get list of all entities
            let entityList = await this.clClient.GetEntities(appId)

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
        predictedEntities: CLM.PredictedEntity[],
        allEntities: CLM.EntityBase[],
        inTeach: boolean
    ): Promise<CLM.ScoredAction> {
        // Call LUIS callback
        let scoreInput = await this.CallEntityDetectionCallback(text, predictedEntities, memory, allEntities)

        // Call the scorer
        let scoreResponse = null
        if (inTeach) {
            scoreResponse = await this.clClient.TeachScore(appId, sessionId, scoreInput)
        } else {
            scoreResponse = await this.clClient.SessionScore(appId, sessionId, scoreInput)
        }

        // Get best action
        let bestAction = scoreResponse.scoredActions[0]

        // Return the action
        return bestAction
    }

    //-------------------------------------------
    // Optional callback than runs after LUIS but before Conversation Learner.  Allows Bot to substitute entities
    public entityDetectionCallback: (text: string,memoryManager: ClientMemoryManager) => Promise<void>

    // Optional callback than runs before a new chat session starts.  Allows Bot to set initial entities
    public onSessionStartCallback: (memoryManager: ClientMemoryManager) => Promise<void>

    // Optional callback than runs when a session ends.  Allows Bot set and/or preserve memories after session end
    public onSessionEndCallback: (memoryManager: ClientMemoryManager) => Promise<void>
  
    public AddAPICallback(
        name: string,
        target: (memoryManager: ClientMemoryManager, ...args: string[]) => Promise<Partial<BB.Activity> | string | void>
    ) {
        this.apiCallbacks[name] = target
        this.apiParams.push({ name, arguments: this.GetArguments(target) })
    }

    private GetArguments(func: any): string[] {
        const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/gm
        const ARGUMENT_NAMES = /([^\s,]+)/g

        let fnStr = func.toString().replace(STRIP_COMMENTS, '')
        let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES)
        if (result === null) {
            result = []
        }
        return result.filter((f: string) => f !== 'memoryManager')
    }

    private async ProcessPredictedEntities(text: string, memory: BotMemory, predictedEntities: CLM.PredictedEntity[], allEntities: CLM.EntityBase[]): Promise<void> {

        // Update entities in my memory
        for (let predictedEntity of predictedEntities) {
            let entity = allEntities.find(e => e.entityId == predictedEntity.entityId)
            if (!entity) {
                throw new Error(`Could not find entity by id: ${predictedEntity.entityId}`)
            }
            // If negative entity will have a positive counter entity
            if (entity.positiveId) {
                await memory.ForgetEntity(entity.entityName, predictedEntity.entityText, entity.isMultivalue)
            } else {
                await memory.RememberEntity(
                    entity.entityName,
                    entity.entityId,
                    predictedEntity.entityText,
                    entity.isMultivalue,
                    predictedEntity.builtinType,
                    predictedEntity.resolution
                )
            }
        }
    }

    public async CallEntityDetectionCallback(text: string, predictedEntities: CLM.PredictedEntity[], memory: CLMemory, allEntities: CLM.EntityBase[]): Promise<CLM.ScoreInput> {

        let memoryManager = await ClientMemoryManager.CreateAsync(memory, allEntities)

        // Update memory with predicted entities
        await this.ProcessPredictedEntities(text, memory.BotMemory, predictedEntities, allEntities)

        // If bot has callback, call it
        if (this.entityDetectionCallback) {
            try {
                await this.entityDetectionCallback(text, memoryManager)
            }
            catch (err) {
                await this.SendMessage(memory, "Exception hit in Bot's EntityDetectionCallback")
                let errMsg = CLDebug.Error(err);
                this.SendMessage(memory, errMsg);
            }
        }

        // Get entities from my memory
        const filledEntities = await memory.BotMemory.FilledEntitiesAsync()

        let scoreInput: CLM.ScoreInput = {
            filledEntities,
            context: {},
            maskedActions: []
        }
        return scoreInput
    }

    public async CallSessionStartCallback(memory: CLMemory, appId: string | null): Promise<void> {

        // If bot has callback, call it
        if (appId && this.onSessionStartCallback) {
            let entityList = await this.clClient.GetEntities(appId)
            let memoryManager = await ClientMemoryManager.CreateAsync(memory, entityList.entities)
            await this.onSessionStartCallback(memoryManager)
        }
    }

    public async CallSessionEndCallback(memory: CLMemory, appId: string | null): Promise<void> {

        // If bot has callback, call it to determine which entites to clear / edit
        if (appId && this.onSessionEndCallback) {
            let entityList = await this.clClient.GetEntities(appId)
            let memoryManager = await ClientMemoryManager.CreateAsync(memory, entityList.entities)
            await this.onSessionEndCallback(memoryManager)
        } 
        // Otherwise just clear the memory
        else {
            await memory.BotMemory.ClearAsync()
        }
    }

    public async RenderTemplateAsync(conversationReference: Partial<BB.ConversationReference>, clRecognizeResult: CLRecognizerResult): Promise<Partial<BB.Activity> | string | null> {
        // Get filled entities from memory
        let filledEntityMap = await clRecognizeResult.memory.BotMemory.FilledEntityMap()
        filledEntityMap = addEntitiesById(filledEntityMap)

        // If the action was terminal, free up the mutex allowing queued messages to be processed
        // Activity won't be present if running in training as messages aren't queued
        if (clRecognizeResult.scoredAction.isTerminal && clRecognizeResult.activity) {
            await InputQueue.MessageHandled(clRecognizeResult.memory.BotState, clRecognizeResult.activity.id);
        }

        let message = null
        switch (clRecognizeResult.scoredAction.actionType) {
            case CLM.ActionTypes.TEXT:
                // This is hack to allow ScoredAction to be accepted as ActionBase
                // TODO: Remove extra properties from ScoredAction so it only had actionId and up service to return actions definitions of scored/unscored actions
                // so UI can link the two together instead of having "partial" actions being incorrectly treated as full actions
                const textAction = new CLM.TextAction(clRecognizeResult.scoredAction as any)
                message = await this.TakeTextAction(textAction, filledEntityMap)
                break
            case CLM.ActionTypes.API_LOCAL:
                const apiAction = new CLM.ApiAction(clRecognizeResult.scoredAction as any)
                message = await this.TakeLocalAPIAction(
                    apiAction,
                    filledEntityMap,
                    clRecognizeResult.memory,
                    clRecognizeResult.clEntities
                )
                break
            case CLM.ActionTypes.CARD:
                const cardAction = new CLM.CardAction(clRecognizeResult.scoredAction as any)
                message = await this.TakeCardAction(cardAction, filledEntityMap)
                break
            default:
                throw new Error(`Could not find matching renderer for action type: ${clRecognizeResult.scoredAction.actionType}`)
        }

        // If action wasn't terminal loop, through Conversation Learner again after a short delay
        if (!clRecognizeResult.scoredAction.isTerminal) {
            setTimeout(async () => {
                let app = await clRecognizeResult.memory.BotState.GetApp()
                if (!app) {
                    throw new Error(`Attempted to get current app before app was set.`)
                }

                const user = conversationReference.user
                if(!user || !user.id) {
                    throw new Error(`Attempted to get session by user id, but user was not defined on current conversation`)
                }

                let sessionId = await clRecognizeResult.memory.BotState.GetSessionId(user.id)
                if (!sessionId) {
                    throw new Error(`Attempted to get session by user id: ${user.id} but session was not found`)
                }

                let bestAction = await this.Score(
                    app.appId,
                    sessionId,
                    clRecognizeResult.memory,
                    '',
                    [],
                    clRecognizeResult.clEntities,
                    clRecognizeResult.inTeach
                )

                // If not inTeach, send message to user
                if (!clRecognizeResult.inTeach) {
                    clRecognizeResult.scoredAction = bestAction
                    message = await this.RenderTemplateAsync(conversationReference, clRecognizeResult)
                    if (message != null) {
                        this.SendMessage(clRecognizeResult.memory, message)
                    }
                }
            }, 100)
        }
        return message
    }

    public async SendIntent(intent: CLRecognizerResult): Promise<void> {

        let conversationReference = await intent.memory.BotState.GetConversationReverence();

        if (!conversationReference) {
            CLDebug.Error('Missing ConversationReference')
            return
        }

        let message = await this.RenderTemplateAsync(conversationReference, intent)
    
        if (message != null) {
            await this.adapter.continueConversation(conversationReference, async (context) => {
                // Need to repeat null check as compiler is catching one above for explicit null
                if (message != null) {
                    await context.sendActivity(message)
                }
            });
        }
    }

    public async SendMessage(memory: CLMemory, message: string | Partial<BB.Activity>, incomingActivityId?: string | undefined): Promise<void> {

        // If requested, pop incoming acitivty from message queue
        if (incomingActivityId) {
            await InputQueue.MessageHandled(memory.BotState, incomingActivityId);
        }
                
        let conversationReference = await memory.BotState.GetConversationReverence()
        if (!conversationReference) {
            CLDebug.Error('Missing ConversationReference')
            return
        }

        await this.adapter.continueConversation(conversationReference, async (context) => {
            await context.sendActivity(message)
        });
    }

    public async TakeLocalAPIAction(apiAction: CLM.ApiAction, filledEntityMap: CLM.FilledEntityMap, memory: CLMemory, allEntities: CLM.EntityBase[]): Promise<Partial<BB.Activity> | string | null> {
        if (!this.apiCallbacks) {
            CLDebug.Error('No Local APIs defined.')
            return null
        }

        // Extract API name and args
        const apiName = apiAction.name
        const api = this.apiCallbacks[apiName]
        const callbackParams = this.apiParams.find(apip => apip.name == apiName)
        if (!api || !callbackParams) {
            return CLDebug.Error(`API "${apiName}" is undefined`)
        }

        // TODO: This issue arises because we only save non-null non-empty argument values on the actions
        // which means callback may accept more arguments than is actually available on the action.arguments
        // To me, it seeems it would make more sense to always have these be same length, but perhaps there is
        // dependency on action not being defined somewhere else in the application like AcionCreatorEditor
        let missingEntities: string[] = []
        // Get arguments in order specified by the API
        const argArray = callbackParams.arguments.map((param: string) => {
            let argument = apiAction.arguments.find(arg => arg.parameter === param)
            if (!argument) {
                return ''
            }

            try {
                return argument.renderValue(CLM.getEntityDisplayValueMap(filledEntityMap))
            }
            catch (error) {
                missingEntities.push(param);
                return '';
            }
        }, missingEntities)

        if (missingEntities.length > 0) {
            return `ERROR: Missing Entity value(s) for ${missingEntities.join(', ')}`;
        }

        let memoryManager = await ClientMemoryManager.CreateAsync(memory, allEntities)

        try {
            try {
                let response = await api(memoryManager, ...argArray)
                return response ? response : null;
            }
            catch (err) {
                await this.SendMessage(memory, `Exception hit in Bot's API Callback: '${apiName}'`)
                let errMsg = CLDebug.Error(err);
                return errMsg;
            }
        }
        catch (err) {
            return CLDebug.Error(err)
        }
    }

    public async TakeTextAction(textAction: CLM.TextAction, filledEntityMap: CLM.FilledEntityMap): Promise<Partial<BB.Activity> | string> {
        return Promise.resolve(textAction.renderValue(CLM.getEntityDisplayValueMap(filledEntityMap)))
    }

    public async TakeCardAction(cardAction: CLM.CardAction, filledEntityMap: CLM.FilledEntityMap): Promise<Partial<BB.Activity> | string> {
        try {
            const entityDisplayValues = CLM.getEntityDisplayValueMap(filledEntityMap)
            const renderedArguments = cardAction.renderArguments(entityDisplayValues)

            const missingEntities = renderedArguments.filter(ra => ra.value === null);
            if (missingEntities.length > 0) {
                return `ERROR: Missing Entity value(s) for ${missingEntities.map(me => me.parameter).join(', ')}`;
            }

            const form = await TemplateProvider.RenderTemplate(cardAction.templateName, renderedArguments)

            if (form == null) {
                return CLDebug.Error(`Missing Template: ${cardAction.templateName}`)
            }
            const attachment = BB.CardFactory.adaptiveCard(form)
            const message = BB.MessageFactory.attachment(attachment)
            message.text = undefined
            return message
        } catch (error) {
            let msg = CLDebug.Error(error, 'Failed to Render Template')
            return msg
        }
    }

    // Validate that training round memory is the same as what in the bot's memory
    // This checks that API calls didn't change when restoring the bot's state
    private EntityDiscrepancy(userInput: string, round: CLM.TrainRound, memory: CLMemory, entities: CLM.EntityBase[]): CLM.ReplayErrorEntityDiscrepancy | null {
        let isSame = true
        let oldEntities = round.scorerSteps[0] && round.scorerSteps[0].input ? round.scorerSteps[0].input.filledEntities : []
        let newEntities = Object.keys(memory.BotMemory.filledEntities.map).map(k => memory.BotMemory.filledEntities.map[k] as CLM.FilledEntity)

        if (oldEntities.length != newEntities.length) {
            isSame = false
        } else {
            for (let oldEntity of oldEntities) {
                let newEntity = newEntities.find(ne => ne.entityId == oldEntity.entityId)
                if (!newEntity) {
                    isSame = false
                } else if (oldEntity.values.length != newEntity.values.length) {
                    isSame = false
                } else {
                    for (let oldValue of oldEntity.values) {
                        let newValue = newEntity.values.find(v => v.userText == oldValue.userText)
                        if (!newValue) {
                            isSame = false
                        }
                        else if (oldValue.userText !== newValue.userText) {
                            isSame = false
                        }
                    }
                }
            }
        }
        if (isSame) {
            return null;
        }

        let originalEntities = [];
        for (let oldEntity of oldEntities) {
            const entity = entities.find(e => e.entityId == oldEntity.entityId)

            let name = entity ? entity.entityName : "MISSING ENTITY";
            let values = CLM.filledEntityValueAsString(oldEntity)
            originalEntities.push(`${name} = (${values})`)
        }

        let updatedEntities = [];
        for (let newEntity of newEntities) {
            const entity = entities.find(e => e.entityId == newEntity.entityId)

            let name = entity? entity.entityName : "MISSING ENTITY"
            let values = CLM.filledEntityValueAsString(newEntity)
            updatedEntities.push(`${name} = (${values})`)
        }

        return new CLM.ReplayErrorEntityDiscrepancy(userInput, originalEntities, updatedEntities);
    }

    // Returns true if Action is available given Entities in Memory
    public isActionAvailable(action: CLM.ActionBase, filledEntities: CLM.FilledEntity[]): boolean {

        for (let entityId of action.requiredEntities) {
            let found = filledEntities.find(e => e.entityId == entityId);
            if (!found) {
                return false;
            }
        }
        for (let entityId of action.negativeEntities) {
            let found = filledEntities.find(e => e.entityId == entityId);
            if (found) {
                return false;
            }
        }
        return true;
    }

    /** Convert list of filled entities into a filled entity map lookup table */
    private CreateFilledEntityMap(filledEntities: CLM.FilledEntity[], entityList: CLM.EntityList): CLM.FilledEntityMap {
        let filledEntityMap = new CLM.FilledEntityMap()
        for (let filledEntity of filledEntities) {
            let entity = entityList.entities.find(e => e.entityId == filledEntity.entityId)
            if (entity) {
                filledEntityMap.map[entity.entityName] = filledEntity
                filledEntityMap.map[entity.entityId] = filledEntity
            }
        }
        return filledEntityMap
    }

    /**
     * Identify any validation issues 
     * Missing Entities
     * Missing Actions
     * Unavailble Actions
     */
    public DialogValidationErrors(trainDialog: CLM.TrainDialog, entities: CLM.EntityBase[], actions: CLM.ActionBase[]) : string[] {

        let validationErrors: string[] = [];

        for (let round of trainDialog.rounds) {
            let userText = round.extractorStep.textVariations[0].text;
            let filledEntities = round.scorerSteps[0] && round.scorerSteps[0].input ? round.scorerSteps[0].input.filledEntities : []

            // Check that entities exist
            for (let fentity of filledEntities) {
                if (!entities.find(e => e.entityId == fentity.entityId)) {
                    validationErrors.push(`Missing Entity for "${CLM.filledEntityValueAsString(fentity)}"`);
                }
            }

            for (let scorerStep of round.scorerSteps) {
                let labelAction = scorerStep.labelAction

                // Check that action exists
                let selectedAction = actions.find(a => a.actionId == labelAction)
                if (!selectedAction)
                {
                    validationErrors.push(`Missing Action response for "${userText}"`);
                }
                else {
                    // Check action availability
                    if (!this.isActionAvailable(selectedAction, scorerStep.input.filledEntities)) {
                        validationErrors.push(`Selected Action in unavailable in response to "${userText}"`);
                    }
                }
            }
        }
        // Make errors unique using Set operator
        validationErrors = [...new Set(validationErrors)]
        return validationErrors;
    }

    /** Return a list of trainDialogs that are invalid for the given set of entities and actions */
    public validateTrainDialogs(appDefinition: CLM.AppDefinition): string[] {
        let invalidTrainDialogIds = [];
        for (let trainDialog of appDefinition.trainDialogs) {
            // Ignore train dialogs that are already invalid
            if (!trainDialog.invalid) {
                let validationErrors = this.DialogValidationErrors(trainDialog, appDefinition.entities, appDefinition.actions);
                if (validationErrors.length > 0) {
                    invalidTrainDialogIds.push(trainDialog.trainDialogId);
                }
            }
        }
        return invalidTrainDialogIds;
    }

    /** Get Activites generated by trainDialog.  
     * NOTE: Will set bot memory to state at end of history
     */
    public async GetHistory(
        appId: string,
        trainDialog: CLM.TrainDialog,
        userName: string,
        userId: string,
        memory: CLMemory,
        ignoreLastExtract: boolean = false
    ): Promise<CLM.TeachWithHistory | null> {
        let entities: CLM.EntityBase[] = trainDialog.definitions ? trainDialog.definitions.entities : []
        let actions: CLM.ActionBase[] = trainDialog.definitions ? trainDialog.definitions.actions : []
        let entityList: CLM.EntityList = { entities }
        let prevMemories: CLM.Memory[] = []

        // Reset the memory
        await memory.BotMemory.ClearAsync()

        if (!trainDialog || !trainDialog.rounds) {
            return null
        }

        let activities = []
        let replayErrors: CLM.ReplayError[] = [];
        let isLastActionTerminal = false

        for (let [roundNum, round] of trainDialog.rounds.entries()) {
            let userText = round.extractorStep.textVariations[0].text
            let filledEntities = round.scorerSteps[0] && round.scorerSteps[0].input ? round.scorerSteps[0].input.filledEntities : []

            // VALIDATION
            // Check that entities exist
            let chatHighlight = null;
            for (let fentity of filledEntities) {
                if (!entities.find(e => e.entityId == fentity.entityId)) {
                    replayErrors.push(new CLM.ReplayErrorMissingEntity(CLM.filledEntityValueAsString(fentity)));
                    chatHighlight = "warning"
                }
            }

            // Generate activity
            let userActivity = {
                id: generateGUID(),
                from: { id: userId, name: userName },
                channelData: { 
                    senderType: CLM.SenderType.User, 
                    roundIndex: roundNum, 
                    scoreIndex: 0, 
                    clientActivityId: generateGUID(),
                    highlight: chatHighlight},  
                type: 'message',
                text: userText
            } as BB.Activity
            activities.push(userActivity)

            // If I'm updating the bot's state, save memory before this step (used to show changes in UI)
            prevMemories = await memory.BotMemory.DumpMemory()

            // Call entity detection callback
            let textVariation = round.extractorStep.textVariations[0]
            let predictedEntities = CLM.ModelUtils.ToPredictedEntities(textVariation.labelEntities)

            await this.CallEntityDetectionCallback(textVariation.text, predictedEntities, memory, entities)

            // Look for discrenancies when replaying API calls
            // Unless asked to ignore the last as user trigged an edit by editing last extract step
            if (!ignoreLastExtract || roundNum != trainDialog.rounds.length - 1) {
                let discrepancyError = this.EntityDiscrepancy(userText, round, memory, entities)
                if (discrepancyError) {
                    replayErrors.push(discrepancyError);
                }
            }

            for (let [scoreNum, scorerStep] of round.scorerSteps.entries()) {
                let labelAction = scorerStep.labelAction
                let botResponse = null

                // VALIDATION
                chatHighlight = null;
                // Check that action exists
                let selectedAction = actions.find(a => a.actionId == labelAction)
                if (!selectedAction)
                {
                    chatHighlight = "error";
                    replayErrors.push(new CLM.ReplayErrorMissingAction(userText));
                }
                else {
                    // Check action availability
                    if (!this.isActionAvailable(selectedAction, scorerStep.input.filledEntities)) {
                        chatHighlight = "error";
                        replayErrors.push(new CLM.ReplayErrorActionUnavailable(userText));
                    }
                }

                let channelData = { 
                    senderType: CLM.SenderType.Bot, 
                    roundIndex: roundNum, 
                    scoreIndex: scoreNum,
                    highlight: chatHighlight
                }

                // Generate bot response
                let action = actions.filter((a: CLM.ActionBase) => a.actionId === labelAction)[0]
                if (!action) {
                    botResponse = CLDebug.Error(`Can't find Action Id ${labelAction}`);
                }
                else {
                    isLastActionTerminal = action.isTerminal

                    let filledEntityMap = this.CreateFilledEntityMap(scorerStep.input.filledEntities, entityList)

                    if (action.actionType === CLM.ActionTypes.CARD) {
                        const cardAction = new CLM.CardAction(action)
                        botResponse = await this.TakeCardAction(cardAction, filledEntityMap)
                    } else if (action.actionType === CLM.ActionTypes.API_LOCAL) {
                        const apiAction = new CLM.ApiAction(action)
                        botResponse = await this.TakeLocalAPIAction(apiAction, filledEntityMap, memory, entityList.entities)
                        // API may not have output, but need to show something to user in WebChat do they can edit
                        if (!botResponse) {
                            botResponse = this.APICard(apiAction);
                        }
                    } else if (action.actionType === CLM.ActionTypes.TEXT) {
                        const textAction = new CLM.TextAction(action)
                        botResponse = await this.TakeTextAction(textAction, filledEntityMap)
                    }
                    // TODO
                    //  TakeAzureAPIAction
                    else {
                        throw new Error(`Cannont construct bot response for unknown action type: ${action.actionType}`)
                    }
                }

                let botActivity: Partial<BB.Activity> | null = null
                if (typeof botResponse == 'string') {
                    botActivity = {
                        id: generateGUID(),
                        from: { id: CLM.CL_USER_NAME_ID, name: CLM.CL_USER_NAME_ID, role: BB.RoleTypes.Bot },
                        type: 'message',
                        text: botResponse,
                        channelData: channelData
                    }
                } else if (botResponse) {
                    botActivity = botResponse as BB.Activity
                    botActivity.id = generateGUID()
                    botActivity.from = { id: CLM.CL_USER_NAME_ID, name: CLM.CL_USER_NAME_ID, role: BB.RoleTypes.Bot }
                    botActivity.channelData = channelData
                }

                if (botActivity) {
                    activities.push(botActivity)
                }
            }
        }

        let memories = await memory.BotMemory.DumpMemory()

        let hasRounds = trainDialog.rounds.length > 0;
        let hasScorerRound = (hasRounds && trainDialog.rounds[trainDialog.rounds.length-1].scorerSteps.length > 0)
        let dialogMode = (isLastActionTerminal && hasScorerRound) || !hasRounds ? CLM.DialogMode.Wait : CLM.DialogMode.Scorer

        // Make errors unique using Set operator 
        replayErrors = [...new Set(replayErrors)]

        let teachWithHistory: CLM.TeachWithHistory = {
            teach: undefined,
            scoreInput: undefined,
            scoreResponse: undefined,
            history: activities,
            memories: memories,
            prevMemories: prevMemories,
            dialogMode: dialogMode,
            replayErrors: replayErrors
        }
        return teachWithHistory
    }

    // Generate a card to show for an API action w/o output
    private APICard(apiAction: CLM.ApiAction): Partial<BB.Activity> {
        let card = {
            type: "AdaptiveCard",
            version: "1.0",
            body: [
                {
                    type: "TextBlock",
                    text: `API Call: *${apiAction.name}*`
                }
            ]
        }
        const attachment = BB.CardFactory.adaptiveCard(card)
        const message = BB.MessageFactory.attachment(attachment)
        return message;
    }
}
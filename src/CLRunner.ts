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
import * as CLM from '@conversationlearner/models'
import { ReadOnlyClientMemoryManager, ClientMemoryManager } from './Memory/ClientMemoryManager'
import { addEntitiesById, CL_DEVELOPER, UI_RUNNER_APPID } from './Utils'
import { CLRecognizerResult } from './CLRecognizeResult'
import { ConversationLearner } from './ConversationLearner'
import { InputQueue } from './Memory/InputQueue'
import * as util from 'util'

interface RunnerLookup {
    [appId: string] : CLRunner
}

export enum SessionStartFlags {
    NONE = 0,
    /* Start a teaching session */
    IN_TEACH = 1 << 0,
    /* Session is an edit and continue with existing turns */
    IS_EDIT_CONTINUE = 1 << 1,
    /* Session created by manual timeout by user in UI */
    IS_MANUAL_TIMEOUT = 1 << 2
}

export interface InternalCallback<T> extends CLM.Callback, ICallback<T> {
}

/**
 * Processes messages received from the user. Called by the dialog system.
 */
export type EntityDetectionCallback = (text: string, memoryManager: ClientMemoryManager) => Promise<void>

/**
 * Called at session start.
 * Allows bot to set initial entities before conversation begins
 */
export type OnSessionStartCallback = (context: BB.TurnContext, memoryManager: ClientMemoryManager) => Promise<void>

/**
 * Called when Session ends.
 * If not implemented all entity values will be cleared.
 * If implemented, developer may return a list of entities to preserve for the next session
 * as well as store them in the Bot State
 */
export type OnSessionEndCallback = (context: BB.TurnContext, memoryManager: ClientMemoryManager, sessionEndState: CLM.SessionEndState, data: string | undefined) => Promise<string[] | void>

/**
 * Called when the associated action in your bot is sent.
 * Common use cases are to call external APIs to gather data and save into entities for usage later.
 */
export type LogicCallback<T> = (memoryManager: ClientMemoryManager, ...args: string[]) => Promise<T | void>
// tslint:disable-next-line:no-empty
export const defaultLogicCallback = async () => {}
/**
 * Called when the associated action in your bot is sent AND during dialog replay.
 * Common use cases are to construct text or card messages based on current entity values.
 */
export type RenderCallback<T> = (logicResult: T, memoryManager: ReadOnlyClientMemoryManager, ...args: string[]) => Promise<Partial<BB.Activity> | string>
export const defaultRenderCallback = async (x: Partial<BB.Activity> | string) => x

export interface ICallbackInput<T> {
    name: string
    logic?: LogicCallback<T>
    render?: RenderCallback<T>
}

interface ICallback<T> {
    name: string
    logic: LogicCallback<T>
    render: RenderCallback<T>
}

enum ActionInputType {
    LOGIC_ONLY,
    RENDER_ONLY,
    LOGIC_AND_RENDER
}

interface IActionInputLogic {
    type: ActionInputType.RENDER_ONLY
    value: string | undefined
}
interface IActionInputRenderOnly {
    type: ActionInputType
}

type IActionInput = IActionInputRenderOnly | IActionInputLogic

export interface IActionResult {
    logicResult: object | void
    response: Partial<BB.Activity> | string | null
}

export type CallbackMap = { [name: string]: InternalCallback<any> }

export class CLRunner {

    /* Lookup table for CLRunners.  One CLRunner per CL Model */
    private static Runners: RunnerLookup = {}
    private static UIRunner: CLRunner;

    public clClient: CLClient
    public adapter: BB.BotAdapter | undefined

    /* Model Id passed in from configuration.  Used when not running in Conversation Learner UI */
    private configModelId: string | undefined;
    private maxTimeout: number | undefined;  // TODO: Move timeout to app settings

    /* Mapping between user defined API names and functions */
    public callbacks: CallbackMap = {}

    public static Create(configModelId: string | undefined, maxTimeout: number | undefined, client: CLClient): CLRunner {

        // Ok to not provide modelId when just running in training UI.
        // If not, Use UI_RUNNER_APPID const as lookup value
        let newRunner = new CLRunner(configModelId, maxTimeout, client);
        CLRunner.Runners[configModelId || UI_RUNNER_APPID] = newRunner;

        // Bot can define multiple CLs.  Always run UI on first CL defined in the bot
        if (!CLRunner.UIRunner) {
            CLRunner.UIRunner = newRunner;
        }

        return newRunner;
    }

    // Get CLRunner for the UI
    public static GetRunnerForUI(appId?: string) : CLRunner {

        // Runner with the appId may not exist if running training UI, if so use the UI Runner
        if (!appId || !CLRunner.Runners[appId]) {
            if (CLRunner.UIRunner) {
                return CLRunner.UIRunner;
            } else {
                throw new Error(`Not in UI and requested CLRunner that doesn't exist: ${appId}`)
            }
        }
        return CLRunner.Runners[appId];
    }

    private constructor(configModelId: string | undefined, maxTimeout: number | undefined, client: CLClient) {
        this.configModelId = configModelId
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

    public async InTrainingUI(turnContext: BB.TurnContext): Promise<boolean> {
        if (turnContext.activity.from && turnContext.activity.from.name === CL_DEVELOPER) {
            let clMemory = CLMemory.GetMemory(turnContext.activity.from.id)
            let app = await clMemory.BotState.GetApp()
            // If no app selected in UI or no app set in config, or they don't match return true
            if (!app || !this.configModelId || app.appId !== this.configModelId) {
                return true
            }
        }
        return false
    }

    // Allows Bot developer to start a new Session with initial parameters (never in Teach)
    public async BotStartSession(turnContext: BB.TurnContext): Promise<void> {

        // Set adapter / conversation reference even if from field not set
        let conversationReference = BB.TurnContext.getConversationReference(turnContext.activity);
        this.SetAdapter(turnContext.adapter, conversationReference);

        const activity = turnContext.activity
        if (activity.from === undefined || activity.id == undefined) {
            return;
        }

        try {
            let app = await this.GetRunningApp(activity.from.id, false);
            let clMemory = await CLMemory.InitMemory(activity.from, conversationReference)

            if (app) {
                let packageId = (app.livePackageId || app.devPackageId)
                if (packageId) {
                    const sessionCreateParams: CLM.SessionCreateParams = {
                        saveToLog: app.metadata.isLoggingOn !== false,
                        packageId: packageId,
                        initialFilledEntities: []
                    }
                    await this.StartSessionAsync(clMemory, activity.conversation.id, app.appId, SessionStartFlags.NONE, sessionCreateParams)
                }
            }
        }
        catch (error) {
            CLDebug.Error(error)
        }
    }

    public SetAdapter(adapter: BB.BotAdapter, conversationReference: Partial<BB.ConversationReference>) {
        this.adapter = adapter
        CLDebug.InitLogger(adapter, conversationReference)
    }

    // Add input to queue.  Allows CL to handle out-of-order messages
    private async AddInput(turnContext: BB.TurnContext) : Promise<CLRecognizerResult | null> {

        // Set adapter / conversation reference even if from field not set
        let conversationReference = BB.TurnContext.getConversationReference(turnContext.activity);
        this.SetAdapter(turnContext.adapter, conversationReference);

        // ConversationUpdate messages are not processed by ConversationLearner
        // They should be handled in the general bot code
        if (turnContext.activity.type == "conversationUpdate")  {
            CLDebug.Verbose(`Ignoring Conversation update...  +${JSON.stringify(turnContext.activity.membersAdded)} -${JSON.stringify(turnContext.activity.membersRemoved)}`);
            return null
        }

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

        // Otherwise I have to queue up messages as user may input them faster than bot responds
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

    public async StartSessionAsync(clMemory: CLMemory, conversationId: string | null, appId: string, sessionStartFlags: SessionStartFlags, createParams: CLM.SessionCreateParams | CLM.CreateTeachParams): Promise<CLM.Teach | CLM.Session> {

        const inTeach = ((sessionStartFlags & SessionStartFlags.IN_TEACH) > 0) 
        let entityList = await this.clClient.GetEntities(appId)   

        // If not continuing an edited session, call endSession
        if (!(sessionStartFlags && SessionStartFlags.IS_EDIT_CONTINUE)) {
            // Default callback will clear the bot memory.
            // END_SESSION action was never triggered, so SessionEndState.OPEN
            await this.CheckSessionEndCallback(clMemory, entityList.entities, CLM.SessionEndState.OPEN);
   
            // Clear memory after SessionEndCallback
            await clMemory.BotMemory.ClearAsync()
        }

        //  check that this works = should it be inside edit continue above
        // Check if StartSession call is required
        await this.CheckSessionStartCallback(clMemory, entityList.entities);
        let startSessionEntities = await clMemory.BotMemory.FilledEntitiesAsync()
        startSessionEntities = [...createParams.initialFilledEntities || [], ...startSessionEntities]

        const filledEntityMap = CLM.FilledEntityMap.FromFilledEntities(startSessionEntities, entityList.entities)
        clMemory.BotMemory.RestoreFromMapAsync(filledEntityMap)

        // Start the new session
        let sessionId: string
        let logDialogId: string | null
        let startResponse: CLM.Teach | CLM.Session
        if (inTeach) {
            const teachResponse = await this.clClient.StartTeach(appId, createParams as CLM.CreateTeachParams)
            startResponse = CLM.ModelUtils.ToTeach(teachResponse)
            sessionId = teachResponse.teachId
            logDialogId = null
        }
        else {
            startResponse = await this.clClient.StartSession(appId, createParams as CLM.SessionCreateParams)
            sessionId = startResponse.sessionId
            logDialogId = startResponse.logDialogId
        }

        // Initizize Bot State
        await clMemory.BotState.InitSessionAsync(sessionId, logDialogId, conversationId, sessionStartFlags)

        CLDebug.Verbose(`Started Session: ${sessionId} - ${conversationId}`)
        return startResponse
    }

    // Get the currently running app
    private async GetRunningApp(key: string, inEditingUI: boolean) : Promise<CLM.AppBase | null> {

        let clMemory = CLMemory.GetMemory(key)
        let app = await clMemory.BotState.GetApp()

        if (app) {
            // If I'm not in the editing UI, always use app specified by options
            if (!inEditingUI && this.configModelId && this.configModelId != app.appId)
            {
                // Use config value
                CLDebug.Log(`Switching to app specified in config: ${this.configModelId}`)
                app = await this.clClient.GetApp(this.configModelId)
                await clMemory.SetAppAsync(app)
            }
        }
        // If I don't have an app, attempt to use one set in config
        else if (this.configModelId) {
            CLDebug.Log(`Selecting app specified in config: ${this.configModelId}`)
            app = await this.clClient.GetApp(this.configModelId)
            await clMemory.SetAppAsync(app)
        }
        return app;
    }

    // End a teach or log session
    // originalSessionId is sent when session terminated from EndSession action or expiration
    public async EndSessionAsync(key: string, sessionEndState: CLM.SessionEndState, originalSessionId: string | null = null, data?: string): Promise<void> {

        let memory = CLMemory.GetMemory(key)
        let app = await memory.BotState.GetApp()

        if (app) {
            let entityList = await this.clClient.GetEntities(app.appId) 

            // Default callback will clear the bot memory
            await this.CheckSessionEndCallback(memory, entityList.entities, sessionEndState, data);

            await memory.BotState.EndSessionAsync(originalSessionId);
        }
    }

    // Process user input
    private async ProcessInput(activity: BB.Activity, conversationReference: Partial<BB.ConversationReference>): Promise<CLRecognizerResult | null> {
        let errComponent = 'ProcessInput'

        // Validate request
        if (!activity.from || !activity.from.id) {
            throw new Error(`Attempted to get current session for user, but user was not defined on bot request.`)
        }

        try {

            let inEditingUI =
                conversationReference.user &&
                conversationReference.user.name === CL_DEVELOPER || false;

            // Validate setup
            if (!inEditingUI && !this.configModelId) {
                let msg =  'Must specify modelId in ConversationLearner constructor when not running bot in Editing UI\n\n'
                CLDebug.Error(msg)
                return null
            }

            if (!ConversationLearner.options || !ConversationLearner.options.LUIS_AUTHORING_KEY) {
                let msg =  'Options must specify luisAuthoringKey.  Set the LUIS_AUTHORING_KEY.\n\n'
                CLDebug.Error(msg)
                return null
            }

            let app = await this.GetRunningApp(activity.from.id, inEditingUI);
            let clMemory = await CLMemory.InitMemory(activity.from, conversationReference)
            let inTeach = await clMemory.BotState.GetInTeach()

            if (!app) {
                let error = "ERROR: AppId not specified.  When running in a channel (i.e. Skype) or the Bot Framework Emulator, CONVERSATION_LEARNER_MODEL_ID must be specified in your Bot's .env file or Application Settings on the server"
                await this.SendMessage(clMemory, error, activity.id)
                return null;
            }

            let sessionId = await clMemory.BotState.GetSessionIdAndSetConversationId(activity.conversation.id)

            // If I'm not in teach mode and have a session
            if (!inTeach && sessionId) {

                const currentTicks = new Date().getTime();
                let lastActive = await clMemory.BotState.GetLastActive()
                let passedTicks = currentTicks - lastActive;
                if (passedTicks > this.maxTimeout!) {

                    // End the current session, clear the memory
                    await this.clClient.EndSession(app.appId, sessionId)

                    // Send original session Id. Used for continuing sessions
                    await this.EndSessionAsync(activity.from.id, CLM.SessionEndState.OPEN, sessionId)

                    // If I'm not in the UI, reload the App to get any changes (live package version may have been updated)
                    if (!inEditingUI) {

                        if (!this.configModelId) {
                            let error = "ERROR: ModelId not specified.  When running in a channel (i.e. Skype) or the Bot Framework Emulator, CONVERSATION_LEARNER_MODEL_ID must be specified in your Bot's .env file or Application Settings on the server"
                            await this.SendMessage(clMemory, error, activity.id)
                            return null
                        }

                        app = await this.clClient.GetApp(this.configModelId)
                        await clMemory.SetAppAsync(app)

                        if (!app) {
                            let error = "ERROR: Failed to find Model specified by CONVERSATION_LEARNER_MODEL_ID"
                            await this.SendMessage(clMemory, error, activity.id)
                            return null
                        }
                    }

                    let conversationId = await clMemory.BotState.GetConversationId()

                    // Start a new session
                    const sessionCreateParams: CLM.SessionCreateParams = {
                        saveToLog: app.metadata.isLoggingOn,
                        initialFilledEntities: []
                    }
                    let session = await this.StartSessionAsync(clMemory, conversationId, app.appId, SessionStartFlags.IS_MANUAL_TIMEOUT, sessionCreateParams) as CLM.Session
                    sessionId = session.sessionId
                }
                // Otherwise update last access time
                else {
                    await clMemory.BotState.SetLastActive(currentTicks);
                }
            }

            // Handle any other non-message input
            if (activity.type !== "message") {
                await InputQueue.MessageHandled(clMemory.BotState, activity.id);
                return null;
            }

            // PackageId: Use live package id if not in editing UI, default to devPackage if no active package set
            let packageId = (inEditingUI ? await clMemory.BotState.GetEditingPackageForApp(app.appId) : app.livePackageId) || app.devPackageId
            if (!packageId) {
                await this.SendMessage(clMemory, "ERROR: No PackageId has been set", activity.id)
                return null;
            }

            // If no session for this conversation, create a new one
            if (!sessionId) {
                const sessionCreateParams: CLM.SessionCreateParams = {
                    saveToLog: app.metadata.isLoggingOn !== false,
                    packageId: packageId,
                    initialFilledEntities: []
                }
                let session = await this.StartSessionAsync(clMemory, activity.conversation.id, app.appId, SessionStartFlags.NONE, sessionCreateParams) as CLM.Session
                sessionId = session.sessionId
            }

            // Process any form data
            let buttonResponse = await this.ProcessFormData(activity, clMemory, app.appId)

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
                    clMemory,
                    extractResponse.text,
                    extractResponse.predictedEntities,
                    entities,
                    inTeach
                )
                return {
                    scoredAction: scoredAction,
                    clEntities: entities,
                    memory: clMemory,
                    inTeach: false,
                    activity: activity
                } as CLRecognizerResult
            }
            return null
        } catch (error) {
            // Try to end the session, so use can potentially recover
            try {
                await this.EndSessionAsync(activity.from.id, CLM.SessionEndState.OPEN)
            } catch {
                CLDebug.Log(`Failed to End Session`)
            }

            CLDebug.Error(error, errComponent)
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
                let entity = entityList.entities.find((e: CLM.EntityBase) => e.entityName == entityName)

                // If it exists, set it
                if (entity) {
                    await clMemory.BotMemory.RememberEntity(entity.entityName, entity.entityId, data[entityName], entity.isMultivalue)
                }
            }

            // If submit type return as a response
            if (data['submit']) {
                return data['submit']
            } else {
                CLDebug.Error(`Adaptive Card has no Submit data`)
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
    public entityDetectionCallback: EntityDetectionCallback | undefined

    // Optional callback than runs before a new chat session starts.  Allows Bot to set initial entities
    public onSessionStartCallback: OnSessionStartCallback | undefined

    // Optional callback than runs when a session ends.  Allows Bot set and/or preserve memories after session end
    public onSessionEndCallback: OnSessionEndCallback | undefined

    public AddCallback<T>(
        callback: ICallbackInput<T>
    ) {
        if (typeof callback.name !== "string" || callback.name.trim().length === 0) {
            throw new Error(`You attempted to add callback but did not provide a valid name. Name must be non-empty string.`)
        }

        if (!callback.logic && !callback.render) {
            throw new Error(`You attempted to add callback by name: ${callback.name} but did not provide a logic or render function. You must provide at least one of them.`)
        }

        if (!callback.logic) {
            callback.logic = defaultLogicCallback
        }

        if (!callback.render) {
            callback.render = defaultRenderCallback
        }

        this.callbacks[callback.name] = {
            ...callback as ICallback<T>,
            logicArguments: this.GetArguments(callback.logic, 1),
            renderArguments: this.GetArguments(callback.render, 2),
        }
    }

    private GetArguments(func: Function, skip: number = 0): string[] {
        const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/gm
        const ARGUMENT_NAMES = /([^\s,]+)/g

        const fnStr = func.toString().replace(STRIP_COMMENTS, '')
        const argumentNames = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES) || []
        return argumentNames.filter((_, i) => i >= skip)
    }

    private async ProcessPredictedEntities(text: string, memory: BotMemory, predictedEntities: CLM.PredictedEntity[], allEntities: CLM.EntityBase[]): Promise<void> {

        // Update entities in my memory
        for (let predictedEntity of predictedEntities) {
            let entity = allEntities.find(e => e.entityId == predictedEntity.entityId)
            if (!entity) {
                CLDebug.Error(`Could not find entity by id: ${predictedEntity.entityId}`)
                return;
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

    public async CallEntityDetectionCallback(text: string, predictedEntities: CLM.PredictedEntity[], clMemory: CLMemory, allEntities: CLM.EntityBase[]): Promise<CLM.ScoreInput> {

        // Entities before processing
        let prevMemories = new CLM.FilledEntityMap(await clMemory.BotMemory.FilledEntityMap());

        // Update memory with predicted entities
        await this.ProcessPredictedEntities(text, clMemory.BotMemory, predictedEntities, allEntities)

        let memoryManager = await this.CreateMemoryManagerAsync(clMemory, allEntities, prevMemories)

        // If bot has callback, call it
        if (this.entityDetectionCallback) {
            try {
                await this.entityDetectionCallback(text, memoryManager)

                // Update Memory
                await clMemory.BotMemory.RestoreFromMemoryManagerAsync(memoryManager)
            }
            catch (err) {
                await this.SendMessage(clMemory, "Exception hit in Bot's EntityDetectionCallback")
                let errMsg = CLDebug.Error(err);
                this.SendMessage(clMemory, errMsg);
            }
        }

        // Get entities from my memory
        const filledEntities = await clMemory.BotMemory.FilledEntitiesAsync()

        let scoreInput: CLM.ScoreInput = {
            filledEntities,
            context: {},
            maskedActions: []
        }
        return scoreInput
    }

    private async CreateMemoryManagerAsync(clMemory: CLMemory, allEntities: CLM.EntityBase[], prevMemories?: CLM.FilledEntityMap): Promise<ClientMemoryManager> {
        let sessionInfo = await clMemory.BotState.SessionInfoAsync()
        let curMemories = new CLM.FilledEntityMap(await clMemory.BotMemory.FilledEntityMap());
        if (!prevMemories) {
            prevMemories = curMemories;
        }
        return new ClientMemoryManager(prevMemories, curMemories, allEntities, sessionInfo);
    }

    // Call session start callback, set memory and return list of filled entities coming from callback
    public async CheckSessionStartCallback(clMemory: CLMemory, entities: CLM.EntityBase[]): Promise<void> {

        // If bot has callback, call it
        if (this.onSessionStartCallback && this.adapter) {
            let memoryManager = await this.CreateMemoryManagerAsync(clMemory, entities)

            // Get conversation ref, so I can generate context and send it back to bot dev
            let conversationReference = await clMemory.BotState.GetConversationReverence()
            if (!conversationReference) {
                CLDebug.Error('Missing ConversationReference')
                return
            }

            await this.adapter.continueConversation(conversationReference, async (context) => {
                if (this.onSessionStartCallback) {
                    try {
                        await this.onSessionStartCallback(context, memoryManager)
                        await clMemory.BotMemory.RestoreFromMemoryManagerAsync(memoryManager)
                    }
                    catch (err) {
                        await this.SendMessage(clMemory, "Exception hit in Bot's OnSessionStartCallback")
                        let errMsg = CLDebug.Error(err);
                        this.SendMessage(clMemory, errMsg);
                    }
                }
            })
        }
    }

    public async CheckSessionEndCallback(clMemory: CLMemory, entities: CLM.EntityBase[], sessionEndState: CLM.SessionEndState, data?: string): Promise<void> {

        // If onEndSession hasn't been called yet, call it
        let needEndSession = await clMemory.BotState.GetNeedSessionEndCall();

        if (needEndSession) {

            // If bot has callback, call it to determine which entities to clear / edit
            if (this.onSessionEndCallback && this.adapter) {

                let memoryManager = await this.CreateMemoryManagerAsync(clMemory, entities)

                // Get conversation ref, so I can generate context and send it back to bot dev
                let conversationReference = await clMemory.BotState.GetConversationReverence()
                if (!conversationReference) {
                    CLDebug.Error('Missing ConversationReference')
                    return
                }

                await this.adapter.continueConversation(conversationReference, async (context) => {
                    try {
                        let saveEntities = this.onSessionEndCallback
                            ? await this.onSessionEndCallback(context, memoryManager, sessionEndState, data)
                            : undefined

                        await clMemory.BotMemory.ClearAsync(saveEntities)
                    }
                    catch (err) {
                        await this.SendMessage(clMemory, "Exception hit in Bot's OnSessionEndCallback")
                        let errMsg = CLDebug.Error(err);
                        this.SendMessage(clMemory, errMsg);
                    }
                })
            }
            // Otherwise just clear the memory
            else {
                await clMemory.BotMemory.ClearAsync()
            }
            await clMemory.BotState.SetNeedSessionEndCall(false);
        }
    }

    public async RenderTemplateAsync(conversationReference: Partial<BB.ConversationReference>, clRecognizeResult: CLRecognizerResult, channelData: {} | null): Promise<IActionResult> {
        // Get filled entities from memory
        let filledEntityMap = await clRecognizeResult.memory.BotMemory.FilledEntityMap()
        filledEntityMap = addEntitiesById(filledEntityMap)

        // If the action was terminal, free up the mutex allowing queued messages to be processed
        // Activity won't be present if running in training as messages aren't queued
        if (clRecognizeResult.scoredAction.isTerminal && clRecognizeResult.activity) {
            await InputQueue.MessageHandled(clRecognizeResult.memory.BotState, clRecognizeResult.activity.id);
        }

        if (!conversationReference.conversation) {
            throw new Error(`ConversationReference contains no conversation`)
        }

        let actionResult: IActionResult
        const inTeach = channelData !== null
        switch (clRecognizeResult.scoredAction.actionType) {
            case CLM.ActionTypes.TEXT: {
                // This is hack to allow ScoredAction to be accepted as ActionBase
                // TODO: Remove extra properties from ScoredAction so it only had actionId and up service to return actions definitions of scored/unscored actions
                // so UI can link the two together instead of having "partial" actions being incorrectly treated as full actions
                const textAction = new CLM.TextAction(clRecognizeResult.scoredAction as any)
                const response = await this.TakeTextAction(textAction, filledEntityMap)
                actionResult = {
                    logicResult: undefined,
                    response
                }
                break
            }
            case CLM.ActionTypes.API_LOCAL: {
                const apiAction = new CLM.ApiAction(clRecognizeResult.scoredAction as any)

                actionResult = await this.TakeAPIAction(
                    apiAction,
                    filledEntityMap,
                    clRecognizeResult.memory,
                    clRecognizeResult.clEntities,
                    inTeach,
                    {
                        type: ActionInputType.LOGIC_AND_RENDER
                    }
                )
                break
            }
            case CLM.ActionTypes.CARD: {
                const cardAction = new CLM.CardAction(clRecognizeResult.scoredAction as any)
                const response = await this.TakeCardAction(cardAction, filledEntityMap)
                actionResult = {
                    logicResult: undefined,
                    response
                }
                break
            }
            case CLM.ActionTypes.END_SESSION: {
                const sessionAction = new CLM.SessionAction(clRecognizeResult.scoredAction as any)
                let sessionInfo = await clRecognizeResult.memory.BotState.SessionInfoAsync()
                let sessionId = await clRecognizeResult.memory.BotState.GetSessionIdAndSetConversationId(conversationReference.conversation.id)
                const response = await this.TakeSessionAction(sessionAction, filledEntityMap, inTeach, sessionInfo.userId, sessionId);
                actionResult = {
                    logicResult: undefined,
                    response
                }
                break
            }
            default:
                throw new Error(`Could not find matching renderer for action type: ${clRecognizeResult.scoredAction.actionType}`)
        }

        // Convert string actions to activities
        if (typeof actionResult.response === 'string' ) {
            actionResult.response = BB.MessageFactory.text(actionResult.response)
        }
        if (actionResult.response && channelData) {
            
            actionResult.response.channelData = channelData
        }

        // If action wasn't terminal loop through Conversation Learner again after a short delay
        if (!clRecognizeResult.scoredAction.isTerminal) {
            setTimeout(async () => {
                let app = await clRecognizeResult.memory.BotState.GetApp()
                if (!app) {
                    throw new Error(`Attempted to get current app before app was set.`)
                }

                if(!conversationReference.conversation) {
                    throw new Error(`Attempted to get session by conversation id, but user was not defined on current conversation`)
                }

                let sessionId = await clRecognizeResult.memory.BotState.GetSessionIdAndSetConversationId(conversationReference.conversation.id)
                if (!sessionId) {
                    throw new Error(`Attempted to get session by conversation id: ${conversationReference.conversation.id} but session was not found`)
                }

                // If not inTeach, send message to user
                if (!clRecognizeResult.inTeach) {

                    let bestAction = await this.Score(
                        app.appId,
                        sessionId,
                        clRecognizeResult.memory,
                        '',
                        [],
                        clRecognizeResult.clEntities,
                        clRecognizeResult.inTeach
                    )

                    clRecognizeResult.scoredAction = bestAction
                    // LARS - need to increment scorere step in channel data
                    actionResult = await this.RenderTemplateAsync(conversationReference, clRecognizeResult, channelData)
                    if (actionResult.response != null) {
                        this.SendMessage(clRecognizeResult.memory, actionResult.response)
                    }
                }
            }, 100)
        }
        return actionResult
    }

    public async SendIntent(intent: CLRecognizerResult, channelData: {} | null = null): Promise<IActionResult | undefined> {

        let conversationReference = await intent.memory.BotState.GetConversationReverence();

        if (!conversationReference) {
            CLDebug.Error('Missing ConversationReference')
            return
        }
        if (!this.adapter) {
            CLDebug.Error('Missing Adapter')
            return
        }

        const actionResult = await this.RenderTemplateAsync(conversationReference, intent, channelData)

        if (actionResult.response != null) {
            await this.adapter.continueConversation(conversationReference, async (context) => {
                // Need to repeat null check as compiler is catching one above for explicit null
                if (actionResult.response != null) {
                    await context.sendActivity(actionResult.response)
                }
            });
        }

        return actionResult
    }

    public async SendMessage(memory: CLMemory, message: string | Partial<BB.Activity>, incomingActivityId?: string | undefined): Promise<void> {

        // If requested, pop incoming activity from message queue
        if (incomingActivityId) {
            await InputQueue.MessageHandled(memory.BotState, incomingActivityId);
        }

        let conversationReference = await memory.BotState.GetConversationReverence()
        if (!conversationReference) {
            CLDebug.Error('Missing ConversationReference')
            return
        }

        if (!this.adapter) {
            CLDebug.Error(`Attempted to send message before adapter was assigned`)
            return
        }

        await this.adapter.continueConversation(conversationReference, async (context) => {
            await context.sendActivity(message)
        });
    }

    // TODO: This issue arises because we only save non-null non-empty argument values on the actions
    // which means callback may accept more arguments than is actually available on the action.arguments
    // To me, it seems it would make more sense to always have these be same length, but perhaps there is
    // dependency on action not being defined somewhere else in the application like ActionCreatorEditor
    private GetRenderedArguments(fnArgs: string[], actionArgs: CLM.ActionArgument[], filledEntityMap: CLM.FilledEntityMap): string[] {
        const missingEntityNames: string[] = []
        const renderedArgumentValues = fnArgs.map(param => {
            const argument = actionArgs.find(arg => arg.parameter === param)
            if (!argument) {
                return ''
            }

            try {
                return argument.renderValue(CLM.getEntityDisplayValueMap(filledEntityMap))
            }
            catch (error) {
                missingEntityNames.push(param)
                return ''
            }
        }, missingEntityNames)

        if (missingEntityNames.length > 0) {
            throw new Error(`Missing Entity value(s) for ${missingEntityNames.join(', ')}`)
        }

        return renderedArgumentValues
    }

    public async TakeAPIAction(apiAction: CLM.ApiAction, filledEntityMap: CLM.FilledEntityMap, clMemory: CLMemory, allEntities: CLM.EntityBase[], inTeach: boolean, actionInput: IActionInput): Promise<IActionResult> {
        // Extract API name and args
        const callback = this.callbacks[apiAction.name]
        if (!callback) {
            return {
                logicResult: undefined,
                response: CLDebug.Error(`API callback with name "${apiAction.name}" is not defined`)
            }
        }

        try {
            try {
                // Invoke Logic part of callback
                const renderedLogicArgumentValues = this.GetRenderedArguments(callback.logicArguments, apiAction.logicArguments, filledEntityMap)
                const memoryManager = await this.CreateMemoryManagerAsync(clMemory, allEntities)

                // If we're only doing the render part, used stored input value
                // This happens when replaying dialog to recreated action outputs
                let logicResult : any
                if (actionInput.type === ActionInputType.RENDER_ONLY) {
                    const value = (actionInput as IActionInputLogic).value
                    logicResult = value ? JSON.parse(value) : undefined
                }   
                else {
                    logicResult = await callback.logic(memoryManager, ...renderedLogicArgumentValues)
                }           

                await clMemory.BotMemory.RestoreFromMemoryManagerAsync(memoryManager)

                // Render the action unless only doing logic part
                if (actionInput.type === ActionInputType.LOGIC_ONLY) {
                    return {
                        logicResult,
                        response: null
                    }
                }
                else {
                    // Invoke Render part of callback
                    const renderedRenderArgumentValues = this.GetRenderedArguments(callback.renderArguments, apiAction.renderArguments, filledEntityMap)

                    let response = await callback.render(logicResult, memoryManager.AsReadOnly(), ...renderedRenderArgumentValues)

                    // If response is empty, but we're in teach session return a placeholder card in WebChat so they can click it to edit
                    // Otherwise return the response as is.
                    if (!response && inTeach) {
                        response = this.APICard(callback)
                    }

                    return {
                        logicResult,
                        response
                    }
                }
            }
            catch (err) {
                await this.SendMessage(clMemory, `Exception hit in Bot's API Callback: '${apiAction.name}'`)
                return {
                    logicResult: undefined,
                    response: CLDebug.Error(err)
                }
            }
        }
        catch (err) {
            return {
                logicResult: undefined,
                response: CLDebug.Error(err)
            }
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

    public async TakeSessionAction(sessionAction: CLM.SessionAction, filledEntityMap: CLM.FilledEntityMap, inTeach: boolean, userId: string, sessionId: string | null): Promise<Partial<BB.Activity> | null> {

        // Get any context from the action
        let content = sessionAction.renderValue(CLM.getEntityDisplayValueMap(filledEntityMap))

        // Send original session Id. Used for continuing sessions
        await this.EndSessionAsync(userId, CLM.SessionEndState.COMPLETED, sessionId, content);

        // If inTeach, show something to user in WebChat so they can edit
        if (inTeach) {
            let payload = sessionAction.renderValue(CLM.getEntityDisplayValueMap(filledEntityMap))
            let card = {
                type: "AdaptiveCard",
                version: "1.0",
                body: [
                    {
                        type: "TextBlock",
                        text: `EndSession: *${payload}*`
                    }
                ]
            }
            const attachment = BB.CardFactory.adaptiveCard(card)
            const message = BB.MessageFactory.attachment(attachment)
            return message
        }
        return null
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
     * Unavailable Actions
     */
    public DialogValidationErrors(trainDialog: CLM.TrainDialog, entities: CLM.EntityBase[], actions: CLM.ActionBase[]) : string[] {

        let validationErrors: string[] = [];

        for (let round of trainDialog.rounds) {
            let userText = round.extractorStep.textVariations[0].text;
            let filledEntities = round.scorerSteps[0] && round.scorerSteps[0].input ? round.scorerSteps[0].input.filledEntities : []

            // Check that entities exist
            for (let filledEntity of filledEntities) {
                if (!entities.find(e => e.entityId == filledEntity.entityId)) {
                    validationErrors.push(`Missing Entity for "${CLM.filledEntityValueAsString(filledEntity)}"`);
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

    /** Populate prebuilt information in predicted entities given filled entity array */
    private PopulatePrebuilts(predictedEntities: CLM.PredictedEntity[], filledEntities: CLM.FilledEntity[]) {
        for (let pe of predictedEntities) {
            let filledEnt = filledEntities.find(fe => fe.entityId === pe.entityId);
            if (filledEnt) {
                let value = filledEnt.values.find(v => v.userText === pe.entityText)
                if (value) {
                    pe.resolution = value.resolution;
                    if (value.builtinType)  {
                        pe.builtinType = value.builtinType;
                    }
                }
            }
        }
    }

    /**
     * Provide dummy data for any missing entities so they can still be rendered
     */
    private PopulateMissingFilledEntities(action: CLM.ActionBase, filledEntityMap: CLM.FilledEntityMap, allEntities: CLM.EntityBase[]): string[] {
        // For backwards compatibiliity need to check requieredEntities too.  In new version all in requiredEntitiesFromPayload
        const allRequiredEntities = [...action.requiredEntities, ...action.requiredEntitiesFromPayload]
        let missingEntities: string[] = []

        allRequiredEntities.forEach((entityId: string) => {
            let entity = allEntities.find(e => e.entityId === entityId)
            if (entity) {
                if (!filledEntityMap.map[entity.entityName]) {
                    let memoryValue = {
                        userText: `${CLM.DUMMY_ENTITY_PREFIX}${entity.entityName}"]`
                    } as CLM.MemoryValue
                    let filledEntity = {
                        entityId : entityId,
                        values : [memoryValue]
                    } as CLM.FilledEntity
                    filledEntityMap.map[entity.entityName] = filledEntity
                    filledEntityMap.map[entity.entityId] = filledEntity
                    missingEntities.push(entity.entityName)
                }
                else {
                    const value = filledEntityMap.ValueAsString(entity.entityName)
                    if (value && value.startsWith(CLM.DUMMY_ENTITY_PREFIX)) {
                        missingEntities.push(entity.entityName)
                    }
                }
            } else {
                throw new Error(`ENTITY ${entityId} DOES NOT EXIST`)
            }
        })
        return missingEntities
    }

    /**
     * Initialize memory for replay
     */
    private async InitReplayMemory(clMemory: CLMemory, trainDialog: CLM.TrainDialog, entities: CLM.EntityBase[]) {

        // Reset the memory
        await  clMemory.BotMemory.ClearAsync()

        let map = CLM.FilledEntityMap.FromFilledEntities(trainDialog.initialFilledEntities || [], entities)
        await clMemory.BotMemory.RestoreFromMapAsync(map)
    }

    /** 
     * Replay a TrainDialog, calling EntityDetection callback and API Logic,
     * recalculating FilledEntities along the way
     */
    public async ReplayTrainDialogLogic(trainDialog: CLM.TrainDialog, clMemory: CLMemory, cleanse: boolean): Promise<CLM.TrainDialog> {

        if (!trainDialog || !trainDialog.rounds) {
            return trainDialog
        }

        // Copy train dialog
        let newTrainDialog: CLM.TrainDialog = JSON.parse(JSON.stringify(trainDialog))

        let entities: CLM.EntityBase[] = trainDialog.definitions ? trainDialog.definitions.entities : []
        let actions: CLM.ActionBase[] = trainDialog.definitions ? trainDialog.definitions.actions : []
        let entityList: CLM.EntityList = { entities }

        await this.InitReplayMemory(clMemory, newTrainDialog, entities)

        for (let round of newTrainDialog.rounds) {

            // Call entity detection callback with first text Variation
            let textVariation = round.extractorStep.textVariations[0]
            let predictedEntities = CLM.ModelUtils.ToPredictedEntities(textVariation.labelEntities)

            // Call EntityDetectionCallback and populate filledEntities with the result
            let scoreInput = await this.CallEntityDetectionCallback(textVariation.text, predictedEntities, clMemory, entities)

            // Use scorer step to populate pre-built data (when)
            if (round.scorerSteps && round.scorerSteps.length > 0) {
                // LARS - check this - value not used?
                this.PopulatePrebuilts(predictedEntities, scoreInput.filledEntities)
            
                round.scorerSteps[0].input.filledEntities = scoreInput.filledEntities

                // Go through each scorer step
                for (let [scoreIndex, scorerStep] of round.scorerSteps.entries()) {

                    let curAction = actions.filter((a: CLM.ActionBase) => a.actionId === scorerStep.labelAction)[0]
                    if (curAction) {

                        let filledEntityMap = await clMemory.BotMemory.FilledEntityMap()

                        // Fill in missing entities with a warning
                        this.PopulateMissingFilledEntities(curAction, filledEntityMap, entities)

                        round.scorerSteps[scoreIndex].input.filledEntities = filledEntityMap.FilledEntities()

                        // Run logic part of APIAction to update the FilledEntities
                        if (curAction.actionType === CLM.ActionTypes.API_LOCAL) {
                            const apiAction = new CLM.ApiAction(curAction)
                            const actionInput: IActionInput = {
                                type: ActionInputType.LOGIC_ONLY
                            }
                            await this.TakeAPIAction(apiAction, filledEntityMap, clMemory, entityList.entities, true, actionInput)
                        } else if (curAction.actionType === CLM.ActionTypes.END_SESSION) {
                            // LARS - todo, what is needed here
                            const sessionAction = new CLM.SessionAction(curAction)
                            let sessionInfo = await clMemory.BotState.SessionInfoAsync();
                            await this.TakeSessionAction(sessionAction, filledEntityMap, true, sessionInfo.userId, null)
                        }
                    }
                }
            } 
            else {
                // Otherwise create a dummy scorer step with the filled entities
                const scorerStep: CLM.TrainScorerStep = {
                    input: { 
                        filledEntities: await clMemory.BotMemory.FilledEntitiesAsync(),
                        context: {},
                        maskedActions: []
                    },
                    labelAction: undefined,
                    logicResult: undefined,
                    scoredAction: undefined
                }
                if (!round.scorerSteps) {
                    round.scorerSteps = []
                }
                round.scorerSteps.push(scorerStep)
            }
        }

        // When editing, may need to run Scorer or Extrator on TrainDialog with invalid rounds
        //This cleans up the TrainDialog removing bad data so the extractor can run  
        if (cleanse) {
            // Remove rounds with two user inputs in a row (they'll have a dummy scorer round)
             newTrainDialog.rounds = newTrainDialog.rounds.filter(r => {
            return !r.scorerSteps[0] || r.scorerSteps[0].labelAction != undefined
            })

        }
        return newTrainDialog
    }

    /** 
     * Get Activities generated by trainDialog.
     * Return any errors in TrainDialog  
     * NOTE: Will set bot memory to state at end of history
     */
    public async GetHistory(trainDialog: CLM.TrainDialog, userName: string, userId: string, clMemory: CLMemory): Promise<CLM.TeachWithHistory | null> {
        
        let entities: CLM.EntityBase[] = trainDialog.definitions ? trainDialog.definitions.entities : []
        let actions: CLM.ActionBase[] = trainDialog.definitions ? trainDialog.definitions.actions : []
        let entityList: CLM.EntityList = { entities }
        let prevMemories: CLM.Memory[] = []

        if (!trainDialog || !trainDialog.rounds) {
            return null
        }

        await this.InitReplayMemory(clMemory, trainDialog, entities)

        let activities = []
        let replayError : CLM.ReplayError | null = null
        let highlight: string | null = null
        let replayErrors: CLM.ReplayError[] = [];
        let curAction = null

        for (let [roundNum, round] of trainDialog.rounds.entries()) {
            let userText = round.extractorStep.textVariations[0].text
            let filledEntities = round.scorerSteps[0] && round.scorerSteps[0].input ? round.scorerSteps[0].input.filledEntities : []

            // VALIDATION
            highlight = null
            replayError = null

            // Check that entities exist
            for (let filledEntity of filledEntities) {
                if (!entities.find(e => e.entityId == filledEntity.entityId)) {
                    highlight = "warning"
                    replayError = new CLM.ReplayErrorEntityUndefined(CLM.filledEntityValueAsString(filledEntity))
                    replayErrors.push()
                }
            }  

            // Check for double user inputs
            if (roundNum != trainDialog.rounds.length - 1 && 
                (round.scorerSteps.length === 0 || !round.scorerSteps[0].labelAction)) {
                highlight = "error";
                replayError = new CLM.ReplayErrorTwoUserInputs()
                replayErrors.push(replayError)
            }
       
            // Check for user input when previous action wasn't wait
            if (curAction && !curAction.isTerminal) {
                highlight = "error";
                replayError = new CLM.ReplayErrorInputAfterNonWait()
                replayErrors.push(replayError)
            }
      
            // Generate activity
            let userActivity = CLM.ModelUtils.InputToActivity(userText, userName, userId, roundNum)
            userActivity.channelData.highlight = highlight
            userActivity.channelData.replayError = replayError
            activities.push(userActivity)

            // Save memory before this step (used to show changes in UI)
            prevMemories = await clMemory.BotMemory.DumpMemory()

            // Call entity detection callback - LARS REVIEW COMMENTS
            let textVariation = round.extractorStep.textVariations[0]
            let predictedEntities = CLM.ModelUtils.ToPredictedEntities(textVariation.labelEntities)

            // Use scorer step to populate pre-built data (when)
            if (round.scorerSteps.length > 0) {
                this.PopulatePrebuilts(predictedEntities, round.scorerSteps[0].input.filledEntities)
            }

            for (let [scoreIndex, scorerStep] of round.scorerSteps.entries()) {

                let labelAction = scorerStep.labelAction

                // Scorer rounds w/o labelActions may exist to store extraction result for rendering
                if (labelAction) {

                    let scoreFilledEntities = scorerStep.input.filledEntities

                    // VALIDATION
                    highlight = null
                    replayError = null

                    // Check that action exists
                    let selectedAction = actions.find(a => a.actionId == labelAction)
                    if (!selectedAction)
                    {
                        highlight = "error";
                        replayError = new CLM.ReplayErrorActionUndefined(userText)
                        replayErrors.push(replayError);
                    }
                    else {
                        // Check action availability
                        if (!this.isActionAvailable(selectedAction, scoreFilledEntities)) {
                            highlight = "error";
                            replayError = new CLM.ReplayErrorActionUnavailable(userText)
                            replayErrors.push(replayError);
                        }
                    }
                    // Check that action (if not first) is after a wait action
                    if (scoreIndex > 0) {
                        const lastScoredAction = round.scorerSteps[scoreIndex - 1].labelAction
                        let lastAction = actions.find(a => a.actionId == lastScoredAction)
                        if (lastAction && lastAction.isTerminal) {
                            highlight = "error";
                            replayError = new CLM.ReplayErrorActionAfterWait()
                            replayErrors.push(replayError);
                        }
                    }

                    // Generate bot response
                    curAction = actions.filter((a: CLM.ActionBase) => a.actionId === labelAction)[0]
                    let botResponse: IActionResult
                    if (!curAction) {
                        botResponse = {
                            logicResult: undefined,
                            response: CLDebug.Error(`Can't find Action Id ${labelAction}`)
                        }
                    }
                    else {

                        // Create map with names and ids
                        let filledEntityMap = this.CreateFilledEntityMap(scoreFilledEntities, entityList)

                        // Fill in missing entities with a warning
                        const missingEntities = this.PopulateMissingFilledEntities(curAction, filledEntityMap, entities)

                        // Entity required for Action isn't filled in
                        if (missingEntities.length > 0) {
                            highlight = "error";
                            replayError = new CLM.ReplayErrorEntityEmpty(missingEntities)
                            replayErrors.push(replayError);
                        }

                        // Set memory from map with names only (since not calling APIs)
                        let memoryMap = CLM.FilledEntityMap.FromFilledEntities(scoreFilledEntities, entities)
                        await clMemory.BotMemory.RestoreFromMapAsync(memoryMap)

                        if (curAction.actionType === CLM.ActionTypes.CARD) {
                            const cardAction = new CLM.CardAction(curAction)
                            botResponse = {
                                logicResult: undefined,
                                response: await this.TakeCardAction(cardAction, filledEntityMap)
                            }
                        } else if (curAction.actionType === CLM.ActionTypes.API_LOCAL) {
                            const apiAction = new CLM.ApiAction(curAction)
                            const actionInput: IActionInput = {
                                type: ActionInputType.RENDER_ONLY,
                                value: scorerStep.logicResult
                            }
                            botResponse = await this.TakeAPIAction(apiAction, filledEntityMap, clMemory, entityList.entities, true, actionInput)
                        } else if (curAction.actionType === CLM.ActionTypes.TEXT) {
                            const textAction = new CLM.TextAction(curAction)
                            botResponse = {
                                logicResult: undefined,
                                response: await this.TakeTextAction(textAction, filledEntityMap)
                            }
                        } else if (curAction.actionType === CLM.ActionTypes.END_SESSION) {
                            const sessionAction = new CLM.SessionAction(curAction)
                            let sessionInfo = await clMemory.BotState.SessionInfoAsync();
                            botResponse = {
                                logicResult: undefined,
                                response: await this.TakeSessionAction(sessionAction, filledEntityMap, true, sessionInfo.userId, null)
                            }
                        }
                        // TODO
                        //  TakeAzureAPIAction
                        else {
                            throw new Error(`Cannot construct bot response for unknown action type: ${curAction.actionType}`)
                        }
                    }

                    let validWaitAction
                    if (curAction && !curAction.isTerminal) {
                        if (round.scorerSteps.length === scoreIndex + 1) {
                            validWaitAction = false
                        }
                        else {
                            validWaitAction = true
                        }
                    }
                
                    let channelData = { 
                        senderType: CLM.SenderType.Bot, 
                        roundIndex: roundNum, 
                        scoreIndex,
                        highlight,
                        validWaitAction: validWaitAction,
                        replayError
                    }

                    let botActivity: Partial<BB.Activity> | null = null
                    let botId = `BOT-${userId}`
                    if (typeof botResponse.response == 'string') {
                        botActivity = {
                            id: CLM.ModelUtils.generateGUID(),
                            from: { id: botId, name: CLM.CL_USER_NAME_ID, role: BB.RoleTypes.Bot },
                            type: 'message',
                            text: botResponse.response,
                            channelData: channelData
                        }
                    } else if (botResponse) {
                        botActivity = botResponse.response as BB.Activity
                        botActivity.id = CLM.ModelUtils.generateGUID()
                        botActivity.from = { id: botId, name: CLM.CL_USER_NAME_ID, role: BB.RoleTypes.Bot }
                        botActivity.channelData = channelData
                    }

                    if (botActivity) {
                        activities.push(botActivity)
                    }
                }
            }
        }

        let memories = await clMemory.BotMemory.DumpMemory()

        let hasRounds = trainDialog.rounds.length > 0;
        let hasScorerRound = (hasRounds && trainDialog.rounds[trainDialog.rounds.length-1].scorerSteps.length > 0)
        let dialogMode =  CLM.DialogMode.Scorer;

        // If I have no rounds, I'm waiting for input
        if (!hasRounds) {
            dialogMode = CLM.DialogMode.Wait;
        }
        else if (curAction) {
            // If last action is session end
            if (curAction.actionType === CLM.ActionTypes.END_SESSION) {
                dialogMode = CLM.DialogMode.EndSession;
            }
            // If I have a scorer round, wait
            else if (curAction.isTerminal && hasScorerRound) {
                dialogMode = CLM.DialogMode.Wait;
            }
        }

        // Calculate last extract response from text variations
        let uiScoreInput : CLM.UIScoreInput | undefined;

        if (hasRounds) {
            // Note: Could potentially just send back extractorStep and calculate extractResponse on other end
            let textVariations = trainDialog.rounds[trainDialog.rounds.length-1].extractorStep.textVariations;
            let extractResponses = CLM.ModelUtils.ToExtractResponses(textVariations);
            let trainExtractorStep = trainDialog.rounds[trainDialog.rounds.length-1].extractorStep;

            uiScoreInput = {
                trainExtractorStep: trainExtractorStep,
                extractResponse: extractResponses[0]
            } as CLM.UIScoreInput
        }

        // Make errors unique using Set operator
        replayErrors = [...new Set(replayErrors)]

        let teachWithHistory: CLM.TeachWithHistory = {
            teach: undefined,
            scoreInput: undefined,
            scoreResponse: undefined,
            uiScoreInput: uiScoreInput,
            extractResponse: undefined,
            lastAction: curAction,
            history: activities,
            memories: memories,
            prevMemories: prevMemories,
            dialogMode: dialogMode,
            replayErrors: replayErrors
        }
        return teachWithHistory
    }

    // Generate a card to show for an API action w/o output
    private APICard(callback: CLM.Callback): Partial<BB.Activity> {
        let card = {
            type: "AdaptiveCard",
            version: "1.0",
            body: [
                {
                    type: "TextBlock",
                    text: `{
    name: ${callback.name},
    logic: (memoryManager${callback.logicArguments.length > 0 ? `, ${callback.logicArguments.join(', ')}` : ''}),
    render: (result, memoryManager${callback.renderArguments.length > 0 ? `, ${callback.renderArguments.join(', ')}` : ''})
`
                }
            ]
        }
        const attachment = BB.CardFactory.adaptiveCard(card)
        const message = BB.MessageFactory.attachment(attachment)
        return message;
    }
}
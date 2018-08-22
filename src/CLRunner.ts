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
import { addEntitiesById, CL_DEVELOPER, UI_RUNNER_APPID, generateGUID } from './Utils'
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

interface IActionInputLogic {
    skipLogic: true
    value: string | undefined
}
interface IActionInputSkipLogic {
    skipLogic: false
}

type IActinInput = IActionInputSkipLogic | IActionInputLogic

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
            // If no app selected in UI or no app set in config, or they match return true
            if (!app || !this.configModelId || app.appId === this.configModelId) {
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
                    await this.StartSessionAsync(clMemory, activity.conversation.id, app.appId, app.metadata.isLoggingOn !== false, packageId)
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

    private async StartSessionAsync(memory: CLMemory, conversationId: string, appId: string, saveToLog: boolean, packageId: string): Promise<string> {

        let sessionCreateParams = {saveToLog, packageId} as CLM.SessionCreateParams
        let sessionResponse = await this.clClient.StartSession(appId, sessionCreateParams)

        await this.InitSessionAsync(memory, sessionResponse.sessionId, sessionResponse.logDialogId, conversationId, SessionStartFlags.NONE)
        CLDebug.Verbose(`Started Session: ${sessionResponse.sessionId} - ${conversationId}`)
        return sessionResponse.sessionId
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


    // Initialize a log or teach session
    public async InitSessionAsync(clMemory: CLMemory, sessionId: string, logDialogId: string | null, conversationId: string | null, sessionStartFlags: SessionStartFlags): Promise<void> {

        let app = await clMemory.BotState.GetApp()

        // If not continuing an edited session, call endSession
        if (!(sessionStartFlags && SessionStartFlags.IS_EDIT_CONTINUE)) {
            // Default callback will clear the bot memory.
            // END_SESSION action was never triggered, so SessionEndState.OPEN
            await this.CheckSessionEndCallback(clMemory, app ? app.appId : null, CLM.SessionEndState.OPEN);
        }
        await clMemory.BotState.StartSessionAsync(sessionId, logDialogId, conversationId, sessionStartFlags)
    }

    // End a teach or log session
    // originalSessionId is sent when session terminated from EndSession action or expiration
    public async EndSessionAsync(key: string, sessionEndState: CLM.SessionEndState, originalSessionId: string | null = null, data?: string): Promise<void> {

        let memory = CLMemory.GetMemory(key)
        let app = await memory.BotState.GetApp()

        // Default callback will clear the bot memory
        await this.CheckSessionEndCallback(memory, app ? app.appId : null, sessionEndState, data);

        await memory.BotState.EndSessionAsync(originalSessionId);
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

                    // Start a new session
                    let sessionResponse = await this.clClient.StartSession(app.appId, {saveToLog: app.metadata.isLoggingOn})

                    // Update Memory, passing in original sessionId for reference
                    let conversationId = await clMemory.BotState.GetConversationId()

                    await this.InitSessionAsync(clMemory, sessionResponse.sessionId, sessionResponse.logDialogId, conversationId, SessionStartFlags.IS_MANUAL_TIMEOUT | (inTeach ? SessionStartFlags.IN_TEACH : 0))

                    // Set new sessionId
                    sessionId = sessionResponse.sessionId;
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
                sessionId = await this.StartSessionAsync(clMemory, activity.conversation.id, app.appId, app.metadata.isLoggingOn !== false, packageId)
            }

            // Check if StartSession call is required
            await this.CheckSessionStartCallback(clMemory, app ? app.appId : null);

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

    public async CallEntityDetectionCallback(text: string, predictedEntities: CLM.PredictedEntity[], memory: CLMemory, allEntities: CLM.EntityBase[]): Promise<CLM.ScoreInput> {

        // Entities before processing
        let prevMemories = new CLM.FilledEntityMap(await memory.BotMemory.FilledEntityMap());

        // Update memory with predicted entities
        await this.ProcessPredictedEntities(text, memory.BotMemory, predictedEntities, allEntities)

        let memoryManager = await this.CreateMemoryManagerAsync(memory, allEntities, prevMemories)

        // If bot has callback, call it
        if (this.entityDetectionCallback) {
            try {
                await this.entityDetectionCallback(text, memoryManager)

                // Update Memory
                await memory.BotMemory.RestoreFromMemoryManagerAsync(memoryManager)
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

    private async CreateMemoryManagerAsync(clMemory: CLMemory, allEntities: CLM.EntityBase[], prevMemories?: CLM.FilledEntityMap): Promise<ClientMemoryManager> {
        let sessionInfo = await clMemory.BotState.SessionInfoAsync()
        let curMemories = new CLM.FilledEntityMap(await clMemory.BotMemory.FilledEntityMap());
        if (!prevMemories) {
            prevMemories = curMemories;
        }
        return new ClientMemoryManager(prevMemories, curMemories, allEntities, sessionInfo);
    }

    public async CheckSessionStartCallback(clMemory: CLMemory, appId: string | null): Promise<void> {

        // If onStartSession hasn't been called yet, call it
        let needStartSession = await clMemory.BotState.GetNeedSessionStartCall();

        if (needStartSession) {
            // If bot has callback, call it
            if (appId && this.onSessionStartCallback && this.adapter) {
                let entityList = await this.clClient.GetEntities(appId)
                let memoryManager = await this.CreateMemoryManagerAsync(clMemory, entityList.entities)

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
            await clMemory.BotState.SetNeedSessionStartCall(false);
        }
    }

    public async CheckSessionEndCallback(clMemory: CLMemory, appId: string | null, sessionEndState: CLM.SessionEndState, data?: string): Promise<void> {

        // If onEndSession hasn't been called yet, call it
        let needEndSession = await clMemory.BotState.GetNeedSessionEndCall();

        if (needEndSession) {

            // If bot has callback, call it to determine which entities to clear / edit
            if (appId && this.onSessionEndCallback && this.adapter) {
                let entityList = await this.clClient.GetEntities(appId)

                let memoryManager = await this.CreateMemoryManagerAsync(clMemory, entityList.entities)

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

    public async RenderTemplateAsync(conversationReference: Partial<BB.ConversationReference>, clRecognizeResult: CLRecognizerResult, inTeach = false): Promise<IActionResult> {
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
                actionResult = await this.TakeLocalAPIAction(
                    apiAction,
                    filledEntityMap,
                    clRecognizeResult.memory,
                    clRecognizeResult.clEntities,
                    inTeach,
                    {
                        skipLogic: false
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
                    actionResult = await this.RenderTemplateAsync(conversationReference, clRecognizeResult)
                    if (actionResult.response != null) {
                        this.SendMessage(clRecognizeResult.memory, actionResult.response)
                    }
                }
            }, 100)
        }
        return actionResult
    }

    public async SendIntent(intent: CLRecognizerResult, inTeach = false): Promise<IActionResult | undefined> {

        let conversationReference = await intent.memory.BotState.GetConversationReverence();

        if (!conversationReference) {
            CLDebug.Error('Missing ConversationReference')
            return
        }
        if (!this.adapter) {
            CLDebug.Error('Missing Adapter')
            return
        }

        const actionResult = await this.RenderTemplateAsync(conversationReference, intent, inTeach)

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

    public async TakeLocalAPIAction(apiAction: CLM.ApiAction, filledEntityMap: CLM.FilledEntityMap, memory: CLMemory, allEntities: CLM.EntityBase[], inTeach: boolean, actionInput: IActinInput): Promise<IActionResult> {
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
                const memoryManager = await this.CreateMemoryManagerAsync(memory, allEntities)

                // If we're skip logic is true use given logic
                // This happens when replaying dialog to recreated action outputs
                const logicResult = actionInput.skipLogic
                    ? actionInput.value
                        ? JSON.parse(actionInput.value)
                        : undefined
                    : await callback.logic(memoryManager, ...renderedLogicArgumentValues)

                await memory.BotMemory.RestoreFromMemoryManagerAsync(memoryManager)

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
            catch (err) {
                await this.SendMessage(memory, `Exception hit in Bot's API Callback: '${apiAction.name}'`)
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

    // Validate that training round memory is the same as what in the bot's memory
    // This checks that API calls didn't change when restoring the bot's state
    private EntityDiscrepancy(userInput: string, round: CLM.TrainRound, memory: CLMemory, entities: CLM.EntityBase[]): CLM.ReplayErrorEntityDiscrepancy | null {
        let isSame = true
        let oldEntities = round.scorerSteps[0] && round.scorerSteps[0].input ? round.scorerSteps[0].input.filledEntities : []
        let newEntities = Object.keys(memory.BotMemory.filledEntityMap.map).map(k => memory.BotMemory.filledEntityMap.map[k] as CLM.FilledEntity)

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
     * Get Activities generated by trainDialog.
     * NOTE: Will set bot memory to state at end of history
     */
    public async GetHistory(
        appId: string,
        trainDialog: CLM.TrainDialog,
        userName: string,
        userId: string,
        clMemory: CLMemory,
        ignoreLastExtract: boolean = false
    ): Promise<CLM.TeachWithHistory | null> {
        let entities: CLM.EntityBase[] = trainDialog.definitions ? trainDialog.definitions.entities : []
        let actions: CLM.ActionBase[] = trainDialog.definitions ? trainDialog.definitions.actions : []
        let entityList: CLM.EntityList = { entities }
        let prevMemories: CLM.Memory[] = []

        // Reset the memory
        await clMemory.BotMemory.ClearAsync()

        if (!trainDialog || !trainDialog.rounds) {
            return null
        }

        // Set initial entities
        // TODO: Currently mixes initial values (from SessionStartCallback) with those extracted in first round
        // need to update schema to include storing of init values
        if (trainDialog.rounds && trainDialog.rounds.length > 0) {
            let firstRound = trainDialog.rounds[0]
            let filledEntities = firstRound.scorerSteps[0] && firstRound.scorerSteps[0].input ? firstRound.scorerSteps[0].input.filledEntities : []
            let map = CLM.FilledEntityMap.FromFilledEntities(filledEntities, entities)
            await clMemory.BotMemory.RestoreFromMapAsync(map)
        }

        let activities = []
        let replayErrors: CLM.ReplayError[] = [];
        let lastAction = null

        for (let [roundNum, round] of trainDialog.rounds.entries()) {
            let userText = round.extractorStep.textVariations[0].text
            let filledEntities = round.scorerSteps[0] && round.scorerSteps[0].input ? round.scorerSteps[0].input.filledEntities : []

            // VALIDATION
            // Check that entities exist
            let chatHighlight = null;
            for (let filledEntity of filledEntities) {
                if (!entities.find(e => e.entityId == filledEntity.entityId)) {
                    replayErrors.push(new CLM.ReplayErrorMissingEntity(CLM.filledEntityValueAsString(filledEntity)));
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
            prevMemories = await clMemory.BotMemory.DumpMemory()

            // Call entity detection callback
            let textVariation = round.extractorStep.textVariations[0]

            let predictedEntities = CLM.ModelUtils.ToPredictedEntities(textVariation.labelEntities)

            // Use scorer step to populate pre-built data (when)
            if (round.scorerSteps.length > 0) {
                this.PopulatePrebuilts(predictedEntities, round.scorerSteps[0].input.filledEntities)
            }

            await this.CallEntityDetectionCallback(textVariation.text, predictedEntities, clMemory, entities)

            // Look for discrepancies when replaying API calls
            // Unless asked to ignore the last as user trigged an edit by editing last extract step
            if (!ignoreLastExtract || roundNum != trainDialog.rounds.length - 1) {
                let discrepancyError = this.EntityDiscrepancy(userText, round, clMemory, entities)
                if (discrepancyError) {
                    replayErrors.push(discrepancyError);
                }
            }

            for (let [scoreNum, scorerStep] of round.scorerSteps.entries()) {
                let labelAction = scorerStep.labelAction

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
                lastAction = actions.filter((a: CLM.ActionBase) => a.actionId === labelAction)[0]
                let botResponse: IActionResult
                if (!lastAction) {
                    botResponse = {
                        logicResult: undefined,
                        response: CLDebug.Error(`Can't find Action Id ${labelAction}`)
                    }
                }
                else {

                    let filledEntityMap = this.CreateFilledEntityMap(scorerStep.input.filledEntities, entityList)

                    if (lastAction.actionType === CLM.ActionTypes.CARD) {
                        const cardAction = new CLM.CardAction(lastAction)
                        botResponse = {
                            logicResult: undefined,
                            response: await this.TakeCardAction(cardAction, filledEntityMap)
                        }
                    } else if (lastAction.actionType === CLM.ActionTypes.API_LOCAL) {
                        const apiAction = new CLM.ApiAction(lastAction)
                        const actionInput: IActinInput = {
                            skipLogic: true,
                            value: scorerStep.logicResult
                        }
                        botResponse = await this.TakeLocalAPIAction(apiAction, filledEntityMap, clMemory, entityList.entities, true, actionInput)
                    } else if (lastAction.actionType === CLM.ActionTypes.TEXT) {
                        const textAction = new CLM.TextAction(lastAction)
                        botResponse = {
                            logicResult: undefined,
                            response: await this.TakeTextAction(textAction, filledEntityMap)
                        }
                    } else if (lastAction.actionType === CLM.ActionTypes.END_SESSION) {
                        const sessionAction = new CLM.SessionAction(lastAction)
                        let sessionInfo = await clMemory.BotState.SessionInfoAsync();
                        botResponse = {
                            logicResult: undefined,
                            response: await this.TakeSessionAction(sessionAction, filledEntityMap, true, sessionInfo.userId, null)
                        }
                    }
                    // TODO
                    //  TakeAzureAPIAction
                    else {
                        throw new Error(`Cannot construct bot response for unknown action type: ${lastAction.actionType}`)
                    }
                }

                let botActivity: Partial<BB.Activity> | null = null
                let botId = `BOT-${userId}`
                if (typeof botResponse.response == 'string') {
                    botActivity = {
                        id: generateGUID(),
                        from: { id: botId, name: CLM.CL_USER_NAME_ID, role: BB.RoleTypes.Bot },
                        type: 'message',
                        text: botResponse.response,
                        channelData: channelData
                    }
                } else if (botResponse) {
                    botActivity = botResponse.response as BB.Activity
                    botActivity.id = generateGUID()
                    botActivity.from = { id: botId, name: CLM.CL_USER_NAME_ID, role: BB.RoleTypes.Bot }
                    botActivity.channelData = channelData
                }

                if (botActivity) {
                    activities.push(botActivity)
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
        else if (lastAction) {
            // If last action is session end
            if (lastAction.actionType === CLM.ActionTypes.END_SESSION) {
                dialogMode = CLM.DialogMode.EndSession;
            }
            // If I have a scorer round, wait
            else if (lastAction.isTerminal && hasScorerRound) {
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
            lastAction: lastAction,
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
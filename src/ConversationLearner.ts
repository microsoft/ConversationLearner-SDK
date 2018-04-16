import * as BB from 'botbuilder'
import { CLRecognizer } from './CLRecognizer'
import { ICLOptions } from './CLOptions'
import { CLMemory } from './CLMemory'
import { BotMemory } from './Memory/BotMemory'
import { CLDebug } from './CLDebug'
import { CLClient } from './CLClient'
import createSdkServer from './Http/Server'
import { startDirectOffLineServer } from './DOLRunner'
import { TemplateProvider } from './TemplateProvider'
import * as CLM from 'conversationlearner-models'
import { ClientMemoryManager } from './Memory/ClientMemoryManager'
import { addEntitiesById } from './Utils'
import { ActionTypes, CardAction, TextAction, ApiAction } from 'conversationlearner-models'
import { CLRecognizerResult } from './CLIntent'

const DEFAULT_MAX_SESSION_LENGTH = 20 * 60 * 1000;  // 20 minutes

export class ConversationLearner {
    public static options: ICLOptions

    // Mapping between user defined API names and functions
    public static apiCallbacks: { [name: string]: (memoryManager: ClientMemoryManager, ...args: string[]) => Promise<BB.Activity | string | undefined> } = {}
    public static apiParams: CLM.CallbackAPI[] = []

    // Optional callback than runs after LUIS but before Conversation Learner.  Allows Bot to substitute entities
    public static entityDetectionCallback: (
        text: string,
        memoryManager: ClientMemoryManager
    ) => Promise<void>

    // Optional callback than runs before a new chat session starts.  Allows Bot to set initial entities
    public static onSessionStartCallback: (
        memoryManager: ClientMemoryManager
    ) => Promise<void>

    // Optional callback than runs when a session ends.  Allows Bot set and/or preserve memories after session end
    public static onSessionEndCallback: (
        memoryManager: ClientMemoryManager
    ) => Promise<void>

    public static adapter: BB.BotAdapter
    public static recognizer: CLRecognizer

    private static clClient: CLClient

    public static Init(options: ICLOptions, storage: BB.Storage | null = null) {
        if (typeof options.sessionMaxTimeout !== 'number') {
            options.sessionMaxTimeout = DEFAULT_MAX_SESSION_LENGTH
        }

        ConversationLearner.options = options

        try {
            CLDebug.Log('Creating Conversation Learner Client....')
            ConversationLearner.clClient = new CLClient(options)
            CLMemory.Init(storage)

            // If app not set, assume running on localhost init DOL Runner
            if (options.localhost) {
                startDirectOffLineServer(options.dolServiceUrl, options.dolBotUrl)
            }

            const sdkServer = createSdkServer(ConversationLearner.clClient)
            sdkServer.listen(options.sdkPort, (err: any) => {
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

        ConversationLearner.recognizer = new CLRecognizer(options, ConversationLearner.clClient)
    }

    public static async recognize(turnContext: BB.TurnContext, force?: boolean): Promise<CLRecognizerResult | null> {
        return await ConversationLearner.recognizer.recognize(turnContext, force);
    }

    public static SetAdapter(adapter: BB.BotAdapter, conversationReference: Partial<BB.ConversationReference>) {
        if (!ConversationLearner.adapter) {
            ConversationLearner.adapter = adapter
            CLDebug.InitLogger(adapter, conversationReference)
        }
    }

    public static AddAPICallback(
        name: string,
        target: (memoryManager: ClientMemoryManager, ...args: string[]) => Promise<BB.Activity | string | undefined>
    ) {
        ConversationLearner.apiCallbacks[name] = target
        ConversationLearner.apiParams.push({ name, arguments: ConversationLearner.GetArguments(target) })
    }

    public static EntityDetectionCallback(
        target: (text: string, memoryManager: ClientMemoryManager) => Promise<void>
    ) {
        ConversationLearner.entityDetectionCallback = target
    }

    public static OnSessionEndCallback(
        target: (memoryManager: ClientMemoryManager) => Promise<void>
    ) {
        ConversationLearner.onSessionEndCallback = target
    }

    public static OnSessionStartCallback(
        target: (memoryManager: ClientMemoryManager) => Promise<void>
    ) {
        ConversationLearner.onSessionStartCallback = target
    }

    public static async SendIntent(intent: CLRecognizerResult): Promise<void> {

        let conversationReference = await intent.memory.BotState.ConversationReverenceAsync();

        if (!conversationReference) {
            CLDebug.Error('Missing ConversationReference')
            return
        }

        let message = await ConversationLearner.renderTemplateAsync(conversationReference, intent)
    
        await ConversationLearner.adapter.continueConversation(conversationReference, async (context) => {
            context.sendActivity(message)
        });
    }

    public static async SendMessage(memory: CLMemory, message: string | Partial<BB.Activity>): Promise<void> {

        let conversationReference = await memory.BotState.ConversationReverenceAsync()
        if (!conversationReference) {
            CLDebug.Error('Missing ConversationReference')
            return
        }

        await ConversationLearner.adapter.continueConversation(conversationReference, async (context) => {
            context.sendActivity(message)
        });
    }

    public static async CallEntityDetectionCallback(
        text: string,
        predictedEntities: CLM.PredictedEntity[],
        memory: CLMemory,
        allEntities: CLM.EntityBase[]
    ): Promise<CLM.ScoreInput> {

        let memoryManager = await ClientMemoryManager.CreateAsync(memory, allEntities)

        // Update memory with predicted entities
        await ConversationLearner.ProcessPredictedEntities(text, memory.BotMemory, predictedEntities, allEntities)

        // If bot has callback, call it
        if (ConversationLearner.entityDetectionCallback) {
            try {
                await ConversationLearner.entityDetectionCallback(text, memoryManager)
            }
            catch (err) {
                await ConversationLearner.SendMessage(memory, "Exception hit in Bot's EntityDetectionCallback")
                let errMsg = CLDebug.Error(err);
                ConversationLearner.SendMessage(memory, errMsg);
            }
        }

        // Get entities from my memory
        var filledEntities = await memory.BotMemory.FilledEntitiesAsync()

        let scoreInput: CLM.ScoreInput = {
            filledEntities,
            context: {},
            maskedActions: []
        }
        return scoreInput
    }

    public static async CallSessionStartCallback(memory: CLMemory, appId: string | null): Promise<void> {

        // If bot has callback, call it
        if (appId && ConversationLearner.onSessionStartCallback) {
            let entityList = await ConversationLearner.clClient.GetEntities(appId)
            let memoryManager = await ClientMemoryManager.CreateAsync(memory, entityList.entities)
            await ConversationLearner.onSessionStartCallback(memoryManager)
        }
    }

    public static async CallSessionEndCallback(memory: CLMemory, appId: string | null): Promise<void> {

        // If bot has callback, call it to determine which entites to clear / edit
        if (appId && ConversationLearner.onSessionEndCallback) {
            let entityList = await ConversationLearner.clClient.GetEntities(appId)
            let memoryManager = await ClientMemoryManager.CreateAsync(memory, entityList.entities)
            await ConversationLearner.onSessionEndCallback(memoryManager)
        } 
        // Otherwise just clear the memory
        else {
            await memory.BotMemory.ClearAsync()
        }
    }

    public static async renderTemplateAsync(conversationReference: Partial<BB.ConversationReference>, clIntent: CLRecognizerResult): Promise<Partial<BB.Activity> | string> {
        // Get filled entities from memory
        let filledEntityMap = await clIntent.memory.BotMemory.FilledEntityMap()
        filledEntityMap = addEntitiesById(filledEntityMap)

        let message = null
        switch (clIntent.scoredAction.actionType) {
            case ActionTypes.TEXT:
                // This is hack to allow ScoredAction to be accepted as ActionBase
                // TODO: Remove extra properties from ScoredAction so it only had actionId and up service to return actions definitions of scored/unscored actions
                // so UI can link the two together instead of having "partial" actions being incorrectly treated as full actions
                const textAction = new TextAction(clIntent.scoredAction as any)
                message = await ConversationLearner.TakeTextAction(textAction, filledEntityMap)
                break
            /* TODO
            case ActionTypes.API_AZURE:
                message = await ConversationLearner.TakeAzureAPIAction(clIntent.scoredAction, clIntent.memory, clIntent.clEntities);
                break;
            */
            case ActionTypes.API_LOCAL:
                const apiAction = new ApiAction(clIntent.scoredAction as any)
                message = await ConversationLearner.TakeLocalAPIAction(
                    apiAction,
                    filledEntityMap,
                    clIntent.memory,
                    clIntent.clEntities
                )
                break
            case ActionTypes.CARD:
                const cardAction = new CardAction(clIntent.scoredAction as any)
                message = await ConversationLearner.TakeCardAction(cardAction, filledEntityMap)
                break
        }

        // If action wasn't terminal loop, through Conversation Learner again after a short delay
        if (!clIntent.scoredAction.isTerminal) {
            setTimeout(async () => {
                let app = await clIntent.memory.BotState.AppAsync()
                if (!app) {
                    throw new Error(`Attempted to get current app before app was set.`)
                }

                const user = conversationReference.user
                if(!user || !user.id) {
                    throw new Error(`Attempted to get session by user id, but user was not defined on current conversation`)
                }

                let sessionId = await clIntent.memory.BotState.SessionIdAsync(user.id)
                if (!sessionId) {
                    throw new Error(`Attempted to get session by user id: ${user.id} but session was not found`)
                }

                let bestAction = await ConversationLearner.recognizer.Score(
                    app.appId,
                    sessionId,
                    clIntent.memory,
                    '',
                    [],
                    clIntent.clEntities,
                    clIntent.inTeach
                )

                // If not inTeach, send message to user
                if (!clIntent.inTeach) {
                    clIntent.scoredAction = bestAction
                    let message = await this.renderTemplateAsync(conversationReference, clIntent)
                    if (message === undefined) {
                        throw new Error(`Attempted to send message, but resulting message was undefined`)
                    }

                    ConversationLearner.SendMessage(clIntent.memory, message)
                }
            }, 100)
        }
        return message ? message : ' '
    }

    private static async ProcessPredictedEntities(
        text: string,
        memory: BotMemory,
        predictedEntities: CLM.PredictedEntity[],
        allEntities: CLM.EntityBase[]
    ): Promise<void> {

        // Get previous filled entities
        // Update entities in my memory
        for (var predictedEntity of predictedEntities) {
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

            // If entity is associated with a task, make sure task is active
            /*
            if (predictedEntity.metadata && predictedEntity.metadata.task)
            {
                // If task is no longer active, clear the memory
                let remembered = await memory.BotMemory.WasRemembered(predictedEntity.metadata.task);
                if (!remembered)
                {
                    await memory.BotMemory.ForgetByLabel(predictedEntity);
                }
            }
            */
        }
    }

    public static async TakeLocalAPIAction(
        apiAction: CLM.ApiAction,
        filledEntityMap: CLM.FilledEntityMap,
        memory: CLMemory,
        allEntities: CLM.EntityBase[]
    ): Promise<Partial<BB.Activity> | string | undefined> {
        if (!ConversationLearner.apiCallbacks) {
            CLDebug.Error('No Local APIs defined.')
            return undefined
        }

        // Extract API name and args
        const apiName = apiAction.name
        const api = ConversationLearner.apiCallbacks[apiName]
        const callbackParams = ConversationLearner.apiParams.find(apip => apip.name == apiName)
        if (!api || !callbackParams) {
            return CLDebug.Error(`API "${apiName}" is undefined`)
        }

        // TODO: This issue arises because we only save non-null non-empty argument values on the actions
        // which means callback may accept more arguments than is actually available on the action.arguments
        // To me, it seeems it would make more sense to always have these be same length, but perhaps there is
        // dependency on action not being defined somewhere else in the application like AcionCreatorEditor
        ;
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
                return response;
            }
            catch (err) {
                await ConversationLearner.SendMessage(memory, `Exception hit in Bot's API Callback: '${apiName}'`)
                let errMsg = CLDebug.Error(err);
                return errMsg;
            }
        }
        catch (err) {
            return CLDebug.Error(err)
        }
    }

    public static async TakeTextAction(textAction: CLM.TextAction, filledEntityMap: CLM.FilledEntityMap): Promise<Partial<BB.Activity> | string> {
        return Promise.resolve(textAction.renderValue(CLM.getEntityDisplayValueMap(filledEntityMap)))
    }

    public static async TakeCardAction(cardAction: CLM.CardAction, filledEntityMap: CLM.FilledEntityMap): Promise<Partial<BB.Activity> | string> {
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

    // public static async TakeAzureAPIAction(
    //     actionPayload: ActionPayload,
    //     filledEntityMap: FilledEntityMap
    // ): Promise<Partial<BB.Activity> | string | undefined> {
    //     // Extract API name and entities
    //     let apiString = actionPayload.payload
    //     let [funcName] = apiString.split(' ')
    //     let args = ModelUtils.RemoveWords(apiString, 1)

    //     // Make any entity substitutions
    //     let entities = filledEntityMap.SubstituteEntities(args)

    //     // Call Azure function and send output (if any)
    //     return await AzureFunctions.Call(this.clClient.azureFunctionsUrl, this.clClient.azureFunctionsKey, funcName, entities)
    // }

    /** Convert list of filled entities into a filled entity map lookup table */
    private static CreateFilledEntityMap(filledEntities: CLM.FilledEntity[], entityList: CLM.EntityList): CLM.FilledEntityMap {
        let filledEntityMap = new CLM.FilledEntityMap()
        for (var filledEntity of filledEntities) {
            let entity = entityList.entities.find(e => e.entityId == filledEntity.entityId)
            if (entity) {
                filledEntityMap.map[entity.entityName] = filledEntity
                filledEntityMap.map[entity.entityId] = filledEntity
            }
        }
        return filledEntityMap
    }

    // Validate that training round memory is the same as what in the bot's memory
    // This checks that API calls didn't change when restoring the bot's state
    private static EntityDiscrepancy(userInput: string, round: CLM.TrainRound, memory: CLMemory, entities: CLM.EntityBase[]): CLM.ReplayErrorEntityDiscrepancy | null {
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

    // LARS - temp. move to shared utils after branch merge
    private static generateGUID(): string {
        let d = new Date().getTime()
        let guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
            let r = ((d + Math.random() * 16) % 16) | 0
            d = Math.floor(d / 16)
            return (char == 'x' ? r : (r & 0x3) | 0x8).toString(16)
        })
        return guid
    }

    // Returns true if Action is available given Entities in Memory
    public static isActionAvailable(action: CLM.ActionBase, filledEntities: CLM.FilledEntity[]): boolean {

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

    /** Return a list of trainDialogs that are invalid for the given set of entities and actions */
    public static validateTrainDialogs(appDefinition: CLM.AppDefinition): string[] {
        let invalidTrainDialogIds = [];
        for (let trainDialog of appDefinition.trainDialogs) {
            // Ignore train dialogs that are already invalid
            if (!trainDialog.invalid) {
                let validationErrors = ConversationLearner.DialogValidationErrors(trainDialog, appDefinition.entities, appDefinition.actions);
                if (validationErrors.length > 0) {
                    invalidTrainDialogIds.push(trainDialog.trainDialogId);
                }
            }
        }
        return invalidTrainDialogIds;
    }

    /** Identify any validation issues 
     * Missing Entities
     * Missing Actions
     * Unavailble Actions
    */
   public static DialogValidationErrors(trainDialog: CLM.TrainDialog, entities: CLM.EntityBase[], actions: CLM.ActionBase[]) : string[] {

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
                    if (!ConversationLearner.isActionAvailable(selectedAction, scorerStep.input.filledEntities)) {
                        validationErrors.push(`Selected Action in unavailable in response to "${userText}"`);
                    }
                }
            }
        }
        // Make errors unique using Set operator
        validationErrors = [...new Set(validationErrors)]
        return validationErrors;
    }

    /** Get Activites generated by trainDialog.  If "updateBotState" is set, will also update bot state to
     * what it was at the end of playing back the trainDialog
     */
    public static async GetHistory(
        appId: string,
        trainDialog: CLM.TrainDialog,
        userName: string,
        userId: string,
        memory: CLMemory,
        updateBotState: boolean = false,
        ignoreLastExtract: boolean = false
    ): Promise<CLM.TeachWithHistory | null> {
        let entities: CLM.EntityBase[] = trainDialog.definitions ? trainDialog.definitions.entities : []
        let actions: CLM.ActionBase[] = trainDialog.definitions ? trainDialog.definitions.actions : []
        let entityList: CLM.EntityList = { entities }
        let prevMemories: CLM.Memory[] = []

        // Reset the memory
        if (updateBotState) {
            await memory.BotMemory.ClearAsync()
        }

        if (!trainDialog || !trainDialog.rounds) {
            return null
        }

        let activities = []
        let replayErrors: CLM.ReplayError[] = [];
        let roundNum = 0
        let isLastActionTerminal = false

        for (let round of trainDialog.rounds) {
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
                id: ConversationLearner.generateGUID(),
                from: { id: userId, name: userName },
                channelData: { 
                    senderType: CLM.SenderType.User, 
                    roundIndex: roundNum, 
                    scoreIndex: 0, 
                    clientActivityId: ConversationLearner.generateGUID(),
                    highlight: chatHighlight},  
                type: 'message',
                text: userText
            } as BB.Activity
            activities.push(userActivity)

            // If I'm updating the bot's state (rather than just returning activities)
            if (updateBotState) {
                // If I'm updating the bot's state, save memory before this step (used to show changes in UI)
                prevMemories = await memory.BotMemory.DumpMemory()

                // Call entity detection callback
                let textVariation = round.extractorStep.textVariations[0]
                let predictedEntities = CLM.ModelUtils.ToPredictedEntities(textVariation.labelEntities)

                await ConversationLearner.CallEntityDetectionCallback(textVariation.text, predictedEntities, memory, entities)

                // Look for discrenancies when replaying API calls
                // Unless asked to ignore the last as user trigged an edit by editing last extract step
                if (!ignoreLastExtract || roundNum != trainDialog.rounds.length - 1) {
                    let discrepancyError = ConversationLearner.EntityDiscrepancy(userText, round, memory, entities)
                    if (discrepancyError) {
                        replayErrors.push(discrepancyError);
                    }
                }
            }

            let scoreNum = 0
            for (let scorerStep of round.scorerSteps) {
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
                    if (!ConversationLearner.isActionAvailable(selectedAction, scorerStep.input.filledEntities)) {
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

                    let filledEntityMap = ConversationLearner.CreateFilledEntityMap(scorerStep.input.filledEntities, entityList)

                    if (action.actionType === CLM.ActionTypes.CARD) {
                        const cardAction = new CLM.CardAction(action)
                        botResponse = await ConversationLearner.TakeCardAction(cardAction, filledEntityMap)
                    } else if (action.actionType === CLM.ActionTypes.API_LOCAL) {
                        const apiAction = new CLM.ApiAction(action)
                        botResponse = await ConversationLearner.TakeLocalAPIAction(apiAction, filledEntityMap, memory, entityList.entities)
                    } else if (action.actionType === CLM.ActionTypes.TEXT) {
                        const textAction = new CLM.TextAction(action)
                        botResponse = await ConversationLearner.TakeTextAction(textAction, filledEntityMap)
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
                        id: ConversationLearner.generateGUID(),
                        from: { id: CLM.CL_USER_NAME_ID, name: CLM.CL_USER_NAME_ID },
                        type: 'message',
                        text: botResponse,
                        channelData: channelData
                    }
                } else if (botResponse) {
                    botActivity = botResponse as BB.Activity
                    botActivity.id = ConversationLearner.generateGUID()
                    botActivity.from = { id: CLM.CL_USER_NAME_ID, name: CLM.CL_USER_NAME_ID }
                    botActivity.channelData = channelData
                }

                if (botActivity) {
                    activities.push(botActivity)
                }
                scoreNum++
            }
            roundNum++
        }

        let memories: CLM.Memory[] = []
        if (updateBotState) {
            memories = await memory.BotMemory.DumpMemory()
        }

        let hasRounds = trainDialog.rounds.length > 0;
        let hasScorerRound = (hasRounds && trainDialog.rounds[trainDialog.rounds.length-1].scorerSteps.length > 0)
        let dialogMode = (isLastActionTerminal && hasScorerRound) || !hasRounds ? CLM.DialogMode.Wait : CLM.DialogMode.Scorer

        // Make errors unique using Set operator  LARS CHECK
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

    public static OptionsValidationErrors(): string {
        let errMsg = ''
        if (!ConversationLearner.options.serviceUri) {
            errMsg += 'Options missing serviceUrl. Set CONVERSATION_LEARNER_SERVICE_URI Env value.\n\n'
        }
        if (!ConversationLearner.options.localhost && !ConversationLearner.options.appId) {
            errMsg += 'Options must specify appId when not running on localhost. Set CONVERSATION_LEARNER_APP_ID Env value.\n\n'
        }
        return errMsg
    }

    private static GetArguments(func: any): string[] {
        const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/gm
        const ARGUMENT_NAMES = /([^\s,]+)/g

        var fnStr = func.toString().replace(STRIP_COMMENTS, '')
        var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES)
        if (result === null) result = []
        return result.filter((f: string) => f !== 'memoryManager')
    }
}

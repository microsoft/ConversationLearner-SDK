import * as builder from 'botbuilder';
import { TakeTurnRequest } from './Model/TakeTurnRequest'
import { BlisApp } from './Model/BlisApp'
import { BlisAppContent } from './Model/BlisAppContent'
import { BlisClient } from './BlisClient';
import { BlisMemory } from './BlisMemory';
import { BlisDebug} from './BlisDebug';
import { BlisContext} from './BlisContext';
import { BlisUserState} from './BlisUserState';
import { LabelEntity } from './Model/LabelEntity';
import { Action } from './Model/Action';
import { TrainDialog } from './Model/TrainDialog';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, TeachAction, Commands, IntCommands, ActionTypes, SaveStep, APICalls, ActionCommand } from './Model/Consts';
import { BlisHelp, Help } from './Model/Help'; 
import { TakeTurnResponse } from './Model/TakeTurnResponse'
import { Utils } from './Utils';
import { Menu } from './Menu';
import { CommandHandler } from './CommandHandler'

export interface FunctionMap { [name: string] : (memory : BlisMemory, args : string) => TakeTurnRequest; }

export interface IBlisResult extends builder.IIntentRecognizerResult {
    responses: (string | builder.IIsAttachment)[];
}

export interface IBlisOptions extends builder.IIntentRecognizerSetOptions {
    // URL for BLIS service
    serviceUri: string;

    // BLIS User Name
    user: string;

    // BLIS Secret
    secret: string;

    // BLIS application to employ
    appId?: string; 

    // Optional callback than runs after LUIS but before BLIS.  Allows Bot to substitute entities
    luisCallback? : (text: string, luisEntities : LabelEntity[], memory : BlisMemory) => TakeTurnRequest;

    // Optional callback that runs after BLIS is called but before the Action is rendered
    blisCallback? : (text : string, memory : BlisMemory) => string;

    // Mappting between API names and functions
    apiCallbacks? : { string : () => TakeTurnRequest };

    // Optional connector, required for downloading train dialogs
    connector? : builder.ChatConnector;
}

export class BlisRecognizer implements builder.IIntentRecognizer {
    protected blisClient : BlisClient;
    protected blisCallback : (test : string, memory : BlisMemory) => string;
    protected connector : builder.ChatConnector;
    protected defaultApp : string;
    protected entity_name2id : { string : string };
    protected entityValues = {};

    // Optional callback than runs after LUIS but before BLIS.  Allows Bot to substitute entities
    private LuisCallback? : (text: string, luisEntities : LabelEntity[], memory : BlisMemory) => TakeTurnRequest;

    // Mappting between user defined API names and functions
    private apiCallbacks : { string : () => TakeTurnRequest };

    // Mappting between prebuild API names and functions
    private intApiCallbacks : FunctionMap = {};
    
    constructor(private bot : builder.UniversalBot, options: IBlisOptions){
        this.init(options);
        BlisDebug.InitLogger(bot);
    }

    private async init(options: IBlisOptions) {
        try {
            BlisDebug.Log("Creating client...");
            this.blisClient = new BlisClient(options.serviceUri, options.user, options.secret);
            this.LuisCallback = options.luisCallback;
            this.apiCallbacks = options.apiCallbacks;
            this.intApiCallbacks[APICalls.SAVEENTITY] = this.SaveEntityCB;
            this.connector = options.connector;
            this.defaultApp = options.appId;
            this.blisCallback = options.blisCallback ? options.blisCallback : this.DefaultBlisCallback;
        }
        catch (error) {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
        }
    }

    private IsInternalApi(apicall : string) : boolean
    {
        let [apiName] = apicall.split(' ');
        return (this.intApiCallbacks[apiName] != null);
    }
    public LoadUser(address : builder.IAddress, 
                        cb : (err: Error, context: BlisContext) => void )
    {
        // TODO handle errors
        BlisUserState.Get(this.bot, address, this.defaultApp, (error, userState, isNew) => {
            let context = new BlisContext(this.bot, this.blisClient, userState, address);

            if (isNew)
            {                        
                // Attempt to load the application
                BlisAppContent.Load(context, this.defaultApp, (responses) => 
                {
                    cb(null, context);
                });
            }
            else
            {          
                cb(null, context);
            }
        });
    }

    private SendResult(context : BlisContext, cb: (error: Error, result: IBlisResult) => void, responses : (string|builder.IIsAttachment)[]) 
    {
        if (!responses)
        {
            BlisDebug.Error("Send result with empty response");
            responses = [];
        }

        // Save user state
        BlisUserState.Save(context);

        // Assume BLIS always wins for now 
        var result: IBlisResult = { score: 1.0, responses: responses, intent: null };

        // Send callback
        cb(null, result);
    }

    public recognize(reginput: builder.IRecognizeContext, cb: (error: Error, result: IBlisResult) => void): void 
    {    
        try
        {  
            if (!reginput || !reginput.message)
            {
                return;
            }

            let address = reginput.message.address;
            this.LoadUser(address, (error, context) => {

                let that = this;
                let inTeach = context.state[UserStates.TEACH];
                let memory = new BlisMemory(context);
                let userInput = reginput.message ? reginput.message.text.trim() : null;

                /** Process result before sending to user */
                let ProcessResult = function(context : BlisContext, cb: (error: Error, result: IBlisResult) => void, responses : (string|builder.IIsAttachment)[], teachAction?: string, actionData? : string) 
                {
                    // Some commands require taking a post command TeachAction (if user is in teach mode)
                    if (inTeach && teachAction) 
                    {
                        if (teachAction == TeachAction.RETRAIN)
                        {
                            // Send command response out of band
                            responses.push("Retraining...");
                            Utils.SendResponses(context, responses);

                            // Retrain the model
                            that.blisClient.Retrain(context.state[UserStates.APP], context.state[UserStates.SESSION])
                                .then(async (takeTurnResponse) => 
                                {
                                    // Continue teach session
                                    TakeTurnCallback(takeTurnResponse);
                                })
                                .catch((error) => {
                                    that.SendResult(context, cb, [error])
                                });
                        }
                        else if (teachAction == TeachAction.PICKACTION && actionData != null)
                        {
                            // Send command response out of band
                            responses.push("Retraining...");
                            Utils.SendResponses(context, responses);

                            // Retrain the model
                            that.blisClient.Retrain(context.state[UserStates.APP], context.state[UserStates.SESSION])
                                .then(async (takeTurnResponse) => 
                                {
                                    /// Take the next turn
                                    that.TakeTurn(context, userInput, actionData, TakeTurnCallback);
                                })
                                .catch((error) => {
                                    that.SendResult(context, cb, [error])
                                });

                             
                        }
                    }
                    else 
                    {
                        that.SendResult(context, cb, responses);
                    }
                }

                /** Process Label Entity Step */
                let ProcessLabelEntity = function(ttResponse : TakeTurnResponse, responses: (string | builder.IIsAttachment)[]) : void
                {
                    BlisDebug.Verbose("ProcessLabelEntity");

                    if (ttResponse.teachError) {
                        let title = `**ERROR**\n\n`;
                        let body = `Input did not match original text. Let's try again.\n\n`;
                        responses.push(Utils.MakeHero(title, body, null, null));
                    }
                    else
                    {
                        memory.RememberTrainStep(SaveStep.INPUT, userInput);
                        memory.RememberLastStep(SaveStep.INPUT,userInput);
                    }
                    let cardtitle = "Teach Step: Detected Entities";
                    if (ttResponse.teachLabelEntities.length == 0)
                    {
                        // Look for suggested entity in previous response
                        let lastResponse = memory.LastStep(SaveStep.RESPONSE);
                        let suggestedEntity = Action.GetEntitySuggestion(lastResponse); 
                        if (suggestedEntity)
                        {
                            // If one exist let user pick it 
                            responses.push(`[${suggestedEntity} ${userInput}]`);
                            let body = "Click Correct if suggested entity is valid or indicate entities in input string"
                            responses.push(Utils.MakeHero(cardtitle, null, body, { "Correct" : "1", "Help" : Help.PICKENTITY}));
                        }
                        else 
                        {
                            let cardsub = `No new entities found.\n\n`;
                            let cardtext = "Click None if correct or indicate entities in input string"
                            responses.push(Utils.MakeHero(cardtitle, cardsub, cardtext, { "None" : "1", "Help" : Help.PICKENTITY}));
                        }
                    }
                    else 
                    {
                        let entities = "";
                        for (let i in ttResponse.teachLabelEntities)
                        {
                            let labelEntity = ttResponse.teachLabelEntities[i];
                            let entityName = memory.EntityId2Name(labelEntity.id);

                            // Prebuild entities don't have a score
                            let score = labelEntity.score ? `_Score: ${labelEntity.score.toFixed(3)}_` : "";
                            entities += `[$${entityName}: ${labelEntity.value}]    ${score}\n\n`;
                        }
                        responses.push(entities);
                        let body = "Click Correct if entities are valid or indicate entities in input string"
                        responses.push(Utils.MakeHero(cardtitle, null, body, { "Correct" : "1", "Help" : Help.PICKENTITY}));
                    }
                }

                /** Process Label Entity Step */
                let ProcessLabelAction = function(ttResponse : TakeTurnResponse, responses: (string | builder.IIsAttachment)[]) : void
                {
                    BlisDebug.Verbose("ProcessLabelEntity");

                    // If app contains no entities, LabelEntity skip is stepped, so input must still be saved
                    if (!memory.TrainStepInput())
                    {
                        // Only run if no suggested entity is found
                        memory.RememberTrainStep(SaveStep.INPUT, userInput);
                        memory.RememberLastStep(SaveStep.INPUT, userInput);
                    }

                    // If a SuggestedEntity (i.e. *entity) was in previous bot response, the entity wasn't already assigned
                    // and no different entities were selected by the user, call saveEntity API
                    let lastResponse = memory.LastStep(SaveStep.RESPONSE);
                    let entities = memory.LastStep(SaveStep.ENTITY);
                    let suggestedEntity = Action.GetEntitySuggestion(lastResponse); 
                    if (!entities && suggestedEntity && !memory.EntityValue(suggestedEntity))
                    { 
                        let apiId = memory.APILookup(suggestedEntity);
                        if (apiId)
                        {
                            // Find the saveEntity action and take it
                            for (let i in ttResponse.teachLabelActions)
                            {                                  
                                let labelAction = ttResponse.teachLabelActions[i];
                                if (labelAction.id == apiId)
                                {
                                    let userInput = (+i+1).toString(); // Incriment string number
                                    memory.RememberLastStep(SaveStep.RESPONSE, userInput);
                                    memory.RememberTrainStep(SaveStep.ENTITY,memory.DumpEntities());
                                    that.TakeTurn(context, userInput, null, TakeTurnCallback);
                                    return;
                                }
                            }
                        }
                    }

                    memory.RememberTrainStep(SaveStep.ENTITY,memory.DumpEntities());

                    let title = `Teach Step: Select Action`;
                    let body = ttResponse.teachLabelActions.length == 0 ? 'No actions matched' : 'Select Action by number or enter a new one';
                    responses.push(Utils.MakeHero(title, null, body, 
                        { 
                            "Add Response" : IntCommands.ADDRESPONSE,
                            "Add API" : IntCommands.ADDAPICALL
                        } ));

                    let choices = {};
                    if (ttResponse.teachLabelActions.length > 0) 
                    {
                        let body = `${memory.DumpEntities()}\n\n`;
                        responses.push(Utils.MakeHero("Memory", null, body, null));

                        let msg = "";
                        let displayIndex = 1;
                        for (let i in ttResponse.teachLabelActions)
                        {
                            let labelAction = ttResponse.teachLabelActions[i];

                            // Don't show internal API calls to developer
                            if (!that.IsInternalApi(labelAction.content))
                            {      
                                if (labelAction.available)
                                {
                                    let score = labelAction.score ? labelAction.score.toFixed(3) : "*UNKNOWN*";
                                    msg += `(${displayIndex}) ${labelAction.content} _(${labelAction.actionType.toUpperCase()})_ Score: ${score}\n\n`;
                                    choices[displayIndex] = (1+Number(i)).toString();
                                }
                                else
                                {
                                    msg += `(  ) ${labelAction.content} _(${labelAction.actionType.toUpperCase()})_ DISQUALIFIED\n\n`;
                                }
                                displayIndex++;
                            }
                        }

                        responses.push(msg);

                        // Remember valid choices
                        memory.RememberLastStep(SaveStep.CHOICES, choices);
                    }
                            
                }

                let TakeTurnCallback = function(ttResponse : TakeTurnResponse, error? : string) : void 
                { 
                    BlisDebug.Verbose("TakeTurnCallback");

                    if (error)
                    {
                        ProcessResult(context, cb, [error]);
                        return;
                    }

                    let responses: (string | builder.IIsAttachment)[] = [];
                    
                    if (ttResponse.mode == TakeTurnModes.TEACH)
                    {
                        if (ttResponse.teachStep == TeachStep.LABELENTITY) {
                            ProcessLabelEntity(ttResponse, responses);
                        }
                        else if (ttResponse.teachStep == TeachStep.LABELACTION)
                        {
                            ProcessLabelAction(ttResponse, responses);
                        }
                        else
                        {
                            responses.push(`Unrecognized TeachStep ${ttResponse.teachStep}`);
                        }
                    }
                    else if (ttResponse.mode == TakeTurnModes.ACTION)
                    {
                        let output = ttResponse.actions[0].content;
                        memory.RememberLastStep(SaveStep.RESPONSE, output);

                        // Clear any suggested entity hints from response
                        output = output ? output.replace(" !"," ") : output;

                        // Allow for dev to update
                        let outText = null;
                        if (that.blisCallback)
                        {
                            outText = that.blisCallback(output, memory);
                        }
                        else
                        {
                            outText = that.DefaultBlisCallback(output, memory);
                        }

                        if (inTeach)
                        {
                            memory.RememberTrainStep(SaveStep.RESPONSE, outText);
                            responses.push(Utils.MakeHero('Trained Response:', outText + "\n\n", "Type next user input for this Dialog or" , 
                            { "Dialog Complete" : IntCommands.DONETEACH}));
                        }
                        else
                        {
                            responses.push(outText);
                        }
                        
                    } 
                    else if (ttResponse.mode == TakeTurnModes.ERROR)
                    {
                        responses.push(ttResponse.error);
                    }
                    else 
                    {
                        responses.push(`Don't know mode: ${ttResponse.mode}`);
                    }
                    if (responses && responses.length > 0)
                    {
                        ProcessResult(context, cb, responses);
                    }
                }

                if (reginput.message.text) 
                {
                    Utils.SendTyping(this.bot, address);
                    BlisDebug.SetAddress(address);   

                    // Check for Edit Commands
                    if (memory.CueCommand())
                    {
                        CommandHandler.HandleCueCommand(context, userInput, (responses : (string|builder.IIsAttachment)[], teachAction: string, actionData : string) => 
                            {
                                ProcessResult(context, cb, responses, teachAction, actionData);
                            });
                    }

                    // Handle admin commands
                    else if (userInput.startsWith('!')) {

                        CommandHandler.HandleCommandLine(context, userInput, 
                            (responses : (string|builder.IIsAttachment)[], teachAction: string, actionData : string) => 
                            {
                                ProcessResult(context, cb, responses, teachAction, actionData);
                            });
                    }
                    else if (userInput.startsWith('~')) {
                        CommandHandler.HandleIntCommand(context, userInput, (responses : (string|builder.IIsAttachment)[], teachAction: string, actionData: string) => 
                            {
                                ProcessResult(context, cb, responses, teachAction, actionData);
                            });
                    }
                    else if (userInput.startsWith('#'))
                    {
                        let help = BlisHelp.Get(userInput);
                        ProcessResult(context, cb, [help]);
                    }
                    else 
                    {
                        if (inTeach)
                        {
                            // Check if user has limited set of choices
                            let choices = memory.LastStep(SaveStep.CHOICES);
                            if (choices && Object.keys(choices).length > 0)
                            {
                                if (!choices[userInput])
                                {
                                    let msg = "Please select one of the action from above or click 'Add Action' for a new Action";
                                    ProcessResult(context, cb, [msg]);
                                    return;
                                }
                                userInput = choices[userInput];
                                memory.RememberLastStep(SaveStep.CHOICES, null);
                            }
                        }
                        // If not in teach mode remember last user input
                        else
                        {
                            memory.RememberLastStep(SaveStep.INPUT, userInput);
                        }
                        
                        this.TakeTurn(context, userInput, null, TakeTurnCallback);
                    } 
                }
                else if (reginput.message.attachments && reginput.message.attachments.length > 0)
                {
                    Utils.SendMessage(context, "Importing application...");
                    BlisAppContent.ImportAttachment(context, reginput.message.attachments[0] ,(text) => {
                        ProcessResult(context, cb, [text]);
                    });
                    return;
                }
            });                
        }
        catch (error)
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(error, null);
        }
    }

    public async TakeTurn(context : BlisContext, payload : string | TakeTurnRequest, actionId : string,
            cb: (response : TakeTurnResponse, error? : string) => void) : Promise<void>
        {
        BlisDebug.Verbose("TakeTurn");

        // Error checking
        if (context.state[UserStates.APP]  == null)
        {
            let card = Menu.Apps("No Application has been loaded..");
            let response = this.ErrorResponse(card[0]);
            cb(response);
            return;
        }
        else if (!context.state[UserStates.MODEL]  && !context.state[UserStates.TEACH] )
        {
            let card = Menu.Home("This application needs to be trained first.");
            let response = this.ErrorResponse(card[0]);
            cb(response);
            return;
        }
        else if (!context.state[UserStates.SESSION] )
        {
            let card = Menu.Home("The app has not been started");
            let response = this.ErrorResponse(card[0]);
            cb(response);
            return;
        }

        let expectedNextModes;
        let requestBody : {};

        // If passed an existing actionId take a turn with that
        if (actionId)
        {
            expectedNextModes = [TakeTurnModes.CALLBACK, TakeTurnModes.ACTION, TakeTurnModes.TEACH];
            requestBody = { 'selected-action-id' : actionId};
        }
        // If a string payload, send that (i.e. a "1", "2" choice)
        else if (typeof payload == 'string') {
            expectedNextModes = [TakeTurnModes.CALLBACK, TakeTurnModes.ACTION, TakeTurnModes.TEACH];
            requestBody = { text : payload};
        }
        // Otherwise send payload as JSON
        else {
            expectedNextModes = [TakeTurnModes.ACTION, TakeTurnModes.TEACH]
            requestBody = payload.ToJSON();  // TODO use serializer
        }

        try
        {
            var takeTurnResponse = await this.blisClient.SendTurnRequest(context.state, requestBody)

            // Check that expected mode matches
            if (!takeTurnResponse.mode || expectedNextModes.indexOf(takeTurnResponse.mode) < 0)
            {
                var response = new TakeTurnResponse({ mode : TakeTurnModes.ERROR, error: `Unexpected mode ${takeTurnResponse.mode}`} );
                cb(response);
                return; 
            }

            // LUIS CALLBACK
            if (takeTurnResponse.mode == TakeTurnModes.CALLBACK)
            {
                let takeTurnRequest;
               let memory = new BlisMemory(context);
                if (this.LuisCallback)
                {
                    takeTurnRequest = this.LuisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                }
                else
                {
                    takeTurnRequest = this.DefaultLuisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                } 
                await this.TakeTurn(context, takeTurnRequest, null, cb);
            }
            // TEACH
            else if (takeTurnResponse.mode == TakeTurnModes.TEACH)
            {
                cb(takeTurnResponse);
                return;
            }

            // ACTION
            else if (takeTurnResponse.mode == TakeTurnModes.ACTION)
            {
                let action = takeTurnResponse.actions[0];
                
                if (action.actionType == ActionTypes.TEXT)
                {
                    cb(takeTurnResponse);
                    return;
                }
                else if (action.actionType == ActionTypes.API)
                {
                    let apiString = action.content;
                    let [apiName, arg] = apiString.split(' ');

                    // First check for built in APIS
                    let api = this.intApiCallbacks[apiName];

                    // Then check user defined APIs
                    if (!api && this.apiCallbacks)
                    {
                        api = this.apiCallbacks[apiName]
                    }

                    // Call API if it was found
                    if (api)
                    {
                        let memory = new BlisMemory(context);
                        let takeTurnRequest = api(memory, arg);

                        // If in teach mode, remember the step
                        if (context.state[UserStates.TEACH])
                        {
                            memory.RememberTrainStep(SaveStep.API, `${apiName} ${arg}`);
                        }
                        BlisDebug.Verbose(`API: {${apiName} ${arg}}`);
                        expectedNextModes = [TakeTurnModes.ACTION, TakeTurnModes.TEACH];
                        await this.TakeTurn(context, takeTurnRequest, null, cb);
                    }
                    else 
                    {
                        let response = this.ErrorResponse(`API ${apiName} not defined`);
                        cb(response);
                    }
                }
            }
        }
        catch (error) {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(null, errMsg);
        }
    }

    //====================================================
    // Built in API GetActions
    //====================================================
    private SaveEntityCB(memory : BlisMemory, entityName : string) : TakeTurnRequest
    {
        let lastInput = memory.LastStep(SaveStep.INPUT);
        memory.RememberEntityByName(entityName, lastInput);
        let entityIds = memory.EntityIds();
        return new TakeTurnRequest({entities: entityIds});
    }
    //====================================================

    private ErrorResponse(error : (string | builder.IIsAttachment)) : TakeTurnResponse
    {
        return new TakeTurnResponse({ mode : TakeTurnModes.ERROR, error: error});
    }

    public DefaultLuisCallback(text: string, entities : LabelEntity[], memory : BlisMemory) : TakeTurnRequest
    {
        // Update entities in my memory
        for (var entity of entities)
        {
            // If negative entity will have a positive counter entity
            if (entity.metadata && entity.metadata.positive)
            {
                memory.ForgetEntity(entity);
            }
            else
            {
                memory.RememberEntity(entity);
            }
        }

        // Get entities from my memory
        var entityIds = memory.EntityIds();

        return new TakeTurnRequest({input : text, entities: entityIds});
    }

    private DefaultBlisCallback(text: string, memory : BlisMemory) : string
    {
        return memory.Substitute(text);
    }
}
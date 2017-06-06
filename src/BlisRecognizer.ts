import * as builder from 'botbuilder';
import { TakeTurnRequest } from './Model/TakeTurnRequest'
import { BlisApp } from './Model/BlisApp'
import { BlisAppContent } from './Model/BlisAppContent'
import { BlisClient } from './BlisClient';
import { BlisMemory } from './BlisMemory';
import { BlisDebug} from './BlisDebug';
import { BlisContext} from './BlisContext';
import { LabelEntity } from './Model/LabelEntity';
import { LabelAction } from './Model/LabelAction';
import { Action } from './Model/Action';
import { TrainDialog } from './Model/TrainDialog';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, TeachAction, ActionTypes, SaveStep, APICalls, ActionCommand, BLIS_INTENT_WRAPPER } from './Model/Consts';
import { Command, IntCommands, LineCommands, CueCommands, HelpCommands } from './Model/Command';
import { BlisHelp } from './Model/Help'; 
import { TakeTurnResponse } from './Model/TakeTurnResponse'
import { Utils } from './Utils';
import { Menu } from './Menu';
import { CommandHandler } from './CommandHandler'
import { AzureFunctions } from './AzureFunctions'
import { EditableResponse } from './Model/EditableResponse';

export interface FunctionMap { [name: string] : (context : BlisContext, memory : BlisMemory, args : string) => Promise<TakeTurnRequest>; }

export interface IBlisResult extends builder.IIntentRecognizerResult {
   recognizer: BlisRecognizer;
}

export interface IBlisResponse {
    responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[];
    intent?: string;
    entities?: builder.IEntity[]; 
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

    // End point for Azure function calls
    azureFunctionsUrl? : string;

    // Key for Azure function calls (optional)
    azureFunctionsKey? : string;

    // Optional connector, required for downloading train dialogs
    connector? : builder.ChatConnector;
}

class RecSession
{
    constructor(public context : BlisContext, public userInput : string , public recCb: (error: Error, result: IBlisResponse) => void)
    {}
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
            this.blisClient = new BlisClient(options.serviceUri, options.user, options.secret, options.azureFunctionsUrl, options.azureFunctionsKey);
            this.LuisCallback = options.luisCallback;
            this.apiCallbacks = options.apiCallbacks;
            this.intApiCallbacks[APICalls.SETTASK] = this.SetTaskCB;
            this.intApiCallbacks[APICalls.AZUREFUNCTION] = this.CallAzureFuncCB;
            this.connector = options.connector;
            this.defaultApp = options.appId;
            this.blisCallback = options.blisCallback ? options.blisCallback : this.DefaultBlisCallback;

            // Create a wrapper for handling intent calls during training 
            // This allows prompt for next input after intent call is done
            this.bot.dialog(BLIS_INTENT_WRAPPER,
            [
                function(session, wrappedIntent)
                {
                    session.beginDialog(wrappedIntent.intent, wrappedIntent.entities);
                },
                function(session)
                {
                    var card = Utils.MakeHero(null, null, "Type next user input for this Dialog or" , 
                    { "Dialog Complete" : IntCommands.DONETEACH});
                    let message = new builder.Message(session)
			            .addAttachment(card);
                    session.send(message);
                    session.endDialog();
                }
            ]);
        }
        catch (error) {
            BlisDebug.Error(error);
        }
    }
    
    public LoadUser(session: builder.Session, 
                        cb : (responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], context: BlisContext) => void )
    {
            let context = new BlisContext(this.bot, this.blisClient, session);
            // Is new?
            if (!session.userData.Blis)
            {
                context.InitState(this.defaultApp);

                // Attempt to load the application
                if (this.defaultApp)
                {
                    BlisAppContent.Load(context, this.defaultApp, (responses) => 
                    {
                        cb(responses, context);
                    });
                }
            }
            else
            {          
                cb(null, context);
            }
    }

    /** Send result to user */
    private SendResult(recsess : RecSession, responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], intent? : string, entities?: builder.IEntity[]  ) 
    {
        if (!responses && !intent)
        {
            BlisDebug.Error("Send result with empty response");
            responses = [];
        }

        var result: IBlisResponse = { responses: responses, intent: intent, entities : entities };

        // Send callback
        recsess.recCb(null, result);
    }

    /** Process result before sending to user */
    private ProcessResult(recsess : RecSession, responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], intent : string, entities: builder.IEntity[], teachAction?: string, actionData? : string) 
    {
        // Some commands require taking a post command TeachAction (if user is in teach mode)
        let inTeach = recsess.context.State(UserStates.TEACH);
        if (inTeach && teachAction) 
        {
            if (teachAction == TeachAction.RETRAIN)
            {
                // Send command response out of band
                responses.push("Retraining...");
                Utils.SendResponses(recsess.context, responses);

                // Retrain the model
                recsess.context.client.Retrain(recsess.context.State(UserStates.APP), recsess.context.State(UserStates.SESSION))
                    .then(async (takeTurnResponse) => 
                    {
                        // Continue teach session
                        this.TakeTurnCallback(recsess, takeTurnResponse);
                    })
                    .catch((error) => {
                        this.SendResult(recsess, [error])
                    });
            }
            else if (teachAction == TeachAction.PICKACTION && actionData != null)
            {
                // Send command response out of band
                responses.push("Retraining...");
                Utils.SendResponses(recsess.context, responses);

                // Retrain the model
                recsess.context.client.Retrain(recsess.context.State(UserStates.APP), recsess.context.State(UserStates.SESSION))
                    .then(async (takeTurnResponse) => 
                    {
                        // Take the next turn
                        this.TakeTurn(recsess, recsess.userInput, actionData);
                    })
                    .catch((error) => {
                        this.SendResult(recsess, [error])
                    });             
            }
        }
        else 
        {
            this.SendResult(recsess, responses, intent, entities);
        }
    }

    private TakeTurnCallback(recsess : RecSession, ttResponse : TakeTurnResponse, error? : string) : void 
    { 
        BlisDebug.Verbose("TakeTurnCallback");
        let memory = new BlisMemory(recsess.context.session);

        if (error)
        {
            let responses = Menu.AddEditCards(recsess.context, [error]);
            this.ProcessResult(recsess, responses, null, null);
            return;
        }

        let responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[] = [];
        
        if (ttResponse.mode == TakeTurnModes.TEACH)
        {
            if (ttResponse.teachStep == TeachStep.LABELENTITY) {
                this.ProcessLabelEntity(recsess, ttResponse, responses);
            }
            else if (ttResponse.teachStep == TeachStep.LABELACTION)
            {
                this.ProcessLabelAction(recsess, ttResponse, responses);
            }
            else
            {
                responses.push(`Unrecognized TeachStep ${ttResponse.teachStep}`);
            }
        }
        else if (ttResponse.mode == TakeTurnModes.ACTION)
        {
            let output = ttResponse.actions[0].content;
            memory.RememberLastStep(SaveStep.RESPONSES, output);

            // Clear any suggested entity hints from response  TODO - this seems outdate
            output = output ? output.replace(" !"," ") : output;

            // Allow for dev to update
            let outText = null;
            if (this.blisCallback)
            {
                outText = this.blisCallback(output, memory);
            }
            else
            {
                outText = this.DefaultBlisCallback(output, memory);
            }

            let inTeach = recsess.context.State(UserStates.TEACH);
            if (inTeach)
            {
                memory.RememberTrainStep(SaveStep.RESPONSES, outText);
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
            this.ProcessResult(recsess, responses, null, null);
        }
    }

    /** Remove internal API calls from actions available to developer */
    /*  TODO  no longer used
    private RemoveInternalAPIs(labelActions : LabelAction[])  : LabelAction[]
    {
        let outActions = [];
        let sumScore = 0;
        for (let i in labelActions)
        {
            let labelAction = labelActions[i];
            // Don't show internal API calls to developer
            if (!this.IsInternalApi(labelAction.content))
            {      
                outActions.push(labelAction);
                if (labelAction.available)
                {
                    sumScore += labelAction.score;
                }
            }
        }

        // Now renormalize scores after removing internal API calls
        if (sumScore <= 0) return outActions;

        for (let labelAction of outActions)
        {
            labelAction.score = labelAction.score / sumScore;
        }

        return outActions;
    }*/

    /** Process Label Entity Training Step */
    private ProcessLabelEntity(recsess : RecSession, ttResponse : TakeTurnResponse, responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) : void
    {
        BlisDebug.Verbose("ProcessLabelEntity");

        let memory = new BlisMemory(recsess.context.session);
        if (ttResponse.teachError) {
            let body = `Input did not match original text. Let's try again.\n\n`;
            responses.push(Utils.ErrorCard(body));
        }
        else
        {
            memory.RememberTrainStep(SaveStep.INPUT, recsess.userInput);
            memory.RememberLastStep(SaveStep.INPUT,recsess.userInput);
        }
        let cardtitle = "Teach Step: Detected Entities";
        if (ttResponse.teachLabelEntities.length == 0)
        {
            // Look for suggested entity in previous response
            let lastResponses = memory.LastStep(SaveStep.RESPONSES);
            let suggestedEntity = Action.GetEntitySuggestion(lastResponses); 
            if (suggestedEntity)
            {
                // Add suggested entity as a choice
                let suggestedText = `[${suggestedEntity} ${recsess.userInput}]`;
                responses.push(suggestedText);
                let body = "Click Correct if suggested entity is valid or indicate entities in input string"
                responses.push(Utils.MakeHero(cardtitle, null, body, 
                {   "Correct" : suggestedText, 
                    "Help" : HelpCommands.PICKENTITY
                }));
            }
            else 
            {
                let cardsub = `No new entities found.\n\n`;
                let cardtext = "Click None if correct or indicate entities in input string"
                responses.push(Utils.MakeHero(cardtitle, cardsub, cardtext, 
                {   
                    "None" : "1", 
                    "Help" : HelpCommands.PICKENTITY}
                ));
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
            responses.push(Utils.MakeHero(cardtitle, null, body, { "Correct" : "1", "Help" : HelpCommands.PICKENTITY}));
        }
    }

    /** Process Label Action Training Step */
    private ProcessLabelAction(recsess : RecSession, ttResponse : TakeTurnResponse, responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) : void
    {
        BlisDebug.Verbose("ProcessLabelEntity");

        let memory = new BlisMemory(recsess.context.session);
        // If app contains no entities, LabelEntity skip is stepped, so input must still be saved
        if (!memory.TrainStepInput())
        {
            // Only run if no suggested entity is found
            memory.RememberTrainStep(SaveStep.INPUT, recsess.userInput);
            memory.RememberLastStep(SaveStep.INPUT, recsess.userInput);
        }

        memory.RememberTrainStep(SaveStep.ENTITY,memory.DumpEntities());

        let title = `Teach Step: Select Action`;
        let body = ttResponse.teachLabelActions.length == 0 ? 'No actions matched' : 'Select Action by number or enter a new one';
        // TODO support API and RESPONSE types, not just base
        responses.push(Utils.MakeHero(title, null, body, 
            { 
                "Add Response" : CueCommands.ADDRESPONSE,
                "Add API" : CueCommands.ADDAPICALL
            }));

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
                let type = labelAction.actionType.toUpperCase();
                type += labelAction.waitAction ? " WAIT" : "";
                if (labelAction.available)
                {
                    let score = labelAction.score ? labelAction.score.toFixed(3) : "*UNKNOWN*";
                    msg += `(${displayIndex}) ${labelAction.content} _(${type})_ Score: ${score}\n\n`;
                    choices[displayIndex] = labelAction.id;
                }
                else
                {
                    msg += `(  ) ${labelAction.content} _(${type})_ DISQUALIFIED\n\n`;
                }
                displayIndex++;
            }

            responses.push(msg);

            // Remember valid choices
            memory.RememberLastStep(SaveStep.CHOICES, choices);
        }              
    }

    public recognize(reginput: builder.IRecognizeContext, recCb: (error: Error, result: IBlisResult) => void): void 
    {  
        // Always recognize, but score is less than 1.0 so prompts can still win
        var result: IBlisResult = { recognizer: this, score: 0.4, intent: null, entities : null };

        // Send callback
        recCb(null, result);
    }

    public invoke(session: builder.Session, recCb: (error: Error, result: IBlisResponse) => void): void 
    {    
        try
        {  
            if (!session || !session.message)
            {
                return;
            }

            let address = session.message.address;
            this.LoadUser(session, (responses, context) => {

                let memory = context.Memory();
                let userInput = session.message ? session.message.text.trim() : null;
                let recsess = new RecSession(context, userInput, recCb);

                if (session.message.text) 
                {
                    Utils.SendTyping(this.bot, address);
                    BlisDebug.SetAddress(address);   

                    // HELP
                    if (Command.IsHelpCommand(userInput))
                    {
                        let help = BlisHelp.Get(userInput);
                        this.ProcessResult(recsess, help, null, null);
                        return;
                    }

                    // Handle cue commands (do this first so can stack cues)
                    if (Command.IsCueCommand(userInput)) {

                        CommandHandler.HandleCueCommand(context, userInput, 
                            (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction: string, actionData : string) => 
                            {
                                this.ProcessResult(recsess, responses, null, null, teachAction, actionData);
                            });
                    }
                    // Handle response to a cue command
                    else if (memory.CueCommand())
                    {
                        CommandHandler.ProcessCueCommand(context, userInput, (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction: string, actionData : string) => 
                            {
                                this.ProcessResult(recsess, responses, null, null, teachAction, actionData);
                            });
                    }

                    // Handle admin commands
                    else if (Command.IsLineCommand(userInput)) {

                        CommandHandler.HandleLineCommand(context, userInput, 
                            (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction: string, actionData : string) => 
                            {
                                this.ProcessResult(recsess, responses, null, null, teachAction, actionData);
                            });
                    }
                    else if (Command.IsIntCommand(userInput)) {
                        CommandHandler.HandleIntCommand(context, userInput, (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction: string, actionData: string) => 
                            {
                                this.ProcessResult(recsess, responses, null, null, teachAction, actionData);
                            });
                    }
                    // No app in memory
                    else if (!context.State(UserStates.APP))
                    {
                        // If error was thrown will be in responses
                        if (!responses) responses = [];
                        responses = responses.concat(Menu.AppPanel('No App Loaded','Load or Create one'));
                        this.ProcessResult(recsess, responses, null, null);
                        return;
                    }
                    // No session
                    else if (!context.State(UserStates.SESSION))
                    {
                        // If prev error was thrown will be in responses
                        if (!responses) responses = [];
                        responses = responses.concat(Menu.Home("The app has not been started"));
                        this.ProcessResult(recsess, responses, null, null);
                        return;
                    }
                    else 
                    {
                        if (context.State(UserStates.TEACH))
                        {
                            // Check if user has limited set of choices
                            let choices = memory.LastStep(SaveStep.CHOICES);
                            if (choices && Object.keys(choices).length > 0)
                            {
                                if (!choices[userInput])
                                {
                                    let msg = "Please select one of the action from above or click 'Add Action' for a new Action";
                                    this.ProcessResult(recsess, [msg], null, null, );
                                    return;
                                }
                                // Convert numeric choice to actionId
                                let actionId = choices[userInput];
                                memory.RememberLastStep(SaveStep.CHOICES, null);
                                this.TakeTurn(recsess, null, actionId);
                            }
                            else
                            {
                                this.TakeTurn(recsess, userInput, null);
                            }
                        }
                        // If not in teach mode remember last user input
                        else
                        {
                            memory.RememberLastStep(SaveStep.INPUT, userInput);                                     
                            this.TakeTurn(recsess, userInput, null);
                        }
                    } 
                }
                else if (session.message.attachments && session.message.attachments.length > 0)
                {
                    Utils.SendMessage(context, "Importing application...");
                    BlisAppContent.ImportAttachment(context, session.message.attachments[0] ,(text) => {
                        this.ProcessResult(recsess, [text], null, null);
                    }); 
                    return;
                }
            });                
        }
        catch (error)
        {
            BlisDebug.Error(error);
            recCb(error, null);
        }
    }

    public async TakeTurn(recsess : RecSession, input : string | TakeTurnRequest, actionId : string) : Promise<void>
    {
        BlisDebug.Verbose("TakeTurn");

        recsess.userInput = (typeof input == 'string') ? input : null;

        // Error checking
        if (recsess.context.State(UserStates.APP)  == null)
        {
            let card = Menu.AppPanel("No Application has been loaded..");
            let response = this.ErrorResponse(card[0]);
            this.TakeTurnCallback(recsess, response);
            return;
        }
        else if (!recsess.context.State(UserStates.MODEL)  && !recsess.context.State(UserStates.TEACH))
        {
            let response = this.ErrorResponse(Menu.Home("This application needs to be trained first."));
            this.TakeTurnCallback(recsess, response);
            return;
        }
        else if (!recsess.context.State(UserStates.SESSION))
        {
            let response = this.ErrorResponse(Menu.Home("The app has not been started"));
            this.TakeTurnCallback(recsess, response);
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
        else if (typeof input == 'string') {
            expectedNextModes = [TakeTurnModes.CALLBACK, TakeTurnModes.ACTION, TakeTurnModes.TEACH];
            requestBody = { text : input};
        }
        // Otherwise send payload as JSON
        else {
            expectedNextModes = [TakeTurnModes.ACTION, TakeTurnModes.TEACH]
            requestBody = input.ToJSON();  // TODO use serializer
        }

        try
        {
            var takeTurnResponse = await this.blisClient.SendTurnRequest(recsess.context.State(UserStates.APP), recsess.context.State(UserStates.SESSION), requestBody)

            BlisDebug.Verbose(`TakeTurnResponse: ${takeTurnResponse.mode}`);
            
            // Check that expected mode matches
            if (!takeTurnResponse.mode || expectedNextModes.indexOf(takeTurnResponse.mode) < 0)
            {
                var response = new TakeTurnResponse({ mode : TakeTurnModes.ERROR, error: `Unexpected mode ${takeTurnResponse.mode}`} );
                this.TakeTurnCallback(recsess, response);
                return; 
            }

            // LUIS CALLBACK
            if (takeTurnResponse.mode == TakeTurnModes.CALLBACK)
            {
                let takeTurnRequest;
               let memory = new BlisMemory(recsess.context.session);
                if (this.LuisCallback)
                {
                    takeTurnRequest = this.LuisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                }
                else
                {
                    takeTurnRequest = this.DefaultLuisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                } 
                await this.TakeTurn(recsess, takeTurnRequest, null);
            }
            // TEACH
            else if (takeTurnResponse.mode == TakeTurnModes.TEACH)
            {
                this.TakeTurnCallback(recsess, takeTurnResponse);
                return;
            }

            // ACTION
            else if (takeTurnResponse.mode == TakeTurnModes.ACTION)
            {
                let action = takeTurnResponse.actions[0];
                let memory = new BlisMemory(recsess.context.session);

                if (action.actionType == ActionTypes.TEXT)
                {
                    this.TakeTurnCallback(recsess, takeTurnResponse);

                    // Is this the last itteration?
                    if (action.waitAction)
                    {
                        memory.FinishTrainStep();
                    }
                    else
                    {
                        let entityIds = recsess.context.Memory().EntityIds();
                        let takeTurnRequest = new TakeTurnRequest({entities: entityIds});
                        expectedNextModes = [TakeTurnModes.ACTION, TakeTurnModes.TEACH];
                        await this.TakeTurn(recsess, takeTurnRequest, null);
                    }

                    return;
                }

                // API CALLS
                else if (action.actionType == ActionTypes.API)
                {
                    let apiString = action.content;
                    let [apiName] = apiString.split(' ');
                    let args = Utils.RemoveWords(apiString, 1);

                    // If an intent call turn is done
                    if (apiName == APICalls.FIREINTENT) 
                    {
                        // Send back the intent to the bot
                        let [intentName] = args.split(' ');
                        let iArgs = Utils.RemoveWords(args, 1);
                        let entities = recsess.context.Memory().GetEntities(iArgs);
                        await this.ProcessResult(recsess, null, intentName, entities);
                        memory.RememberTrainStep(SaveStep.APICALLS, `${intentName} ${entities}`);
                        return;
                    }

                    // Make any entity substitutions
                    args = recsess.context.Memory().SubstituteEntities(args);

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
                        let takeTurnRequest = await api(recsess.context, memory, args);

                        // If in teach mode, remember the step
                        if (recsess.context.State(UserStates.TEACH))
                        {
                            memory.RememberTrainStep(SaveStep.APICALLS, `${apiName} ${args}`);
                        }
                        BlisDebug.Verbose(`API: {${apiName} ${args}}`);

                        // If action isn't terminal take another step
                        if (!action.waitAction)
                        {
                            expectedNextModes = [TakeTurnModes.ACTION, TakeTurnModes.TEACH];
                            await this.TakeTurn(recsess, takeTurnRequest, null);
                        }      
                        else if (recsess.context.State(UserStates.TEACH))
                        {
                            memory.FinishTrainStep();
                            var card = Utils.MakeHero(null, null, "Type next user input for this Dialog or" , 
                            { "Dialog Complete" : IntCommands.DONETEACH});
                            Utils.SendResponses(recsess.context, [card]);
                        }         
                    }
                    else 
                    {
                        let response = this.ErrorResponse(`API ${apiName} not defined`);
                        this.TakeTurnCallback(recsess, response);
                    }
                }
            }
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error); 
            this.TakeTurnCallback(recsess, null, errMsg);
        }
    }

    //====================================================
    // Built in API calls
    //====================================================
    private async CallAzureFuncCB(context : BlisContext, memory : BlisMemory, args : string) : Promise<TakeTurnRequest>
    {
        // Disallow repetative API calls in case BLIS gets stuck TODO
   /*     var lastResponse = memory.LastStep(SaveStep.RESPONSE);
        if (lastResponse == args)
        {
            return;
        }*/
        if (!context.client.azureFunctionsUrl)
        {
            var errCard = Utils.ErrorCard("Attempt to call Azure Function with no URL.","Must set 'azureFunctionsUrl' in Bot implimentation.");
            Utils.SendMessage(context, errCard);
        }
        else
        {
       //     memory.ForgetEntityByName("company", null); // TEMP
            let [funct, query] = args.split(' ');
            let output = await AzureFunctions.Call(context.client.azureFunctionsUrl, context.client.azureFunctionsKey, funct, query);
            if (output)
            {
                Utils.SendMessage(context, output);
            }
        }
        let entityIds = memory.EntityIds();
        memory.RememberLastStep(SaveStep.RESPONSES, args);  // TEMP try remember last apicall
        return new TakeTurnRequest({entities: entityIds});
    }

    // EXPIRIMENTAL = TODO
    // Set a task to the "ON" state
    private async SetTaskCB(context: BlisContext, memory : BlisMemory, entityName : string) : Promise<TakeTurnRequest>
    {
        memory.RememberEntityByName(entityName, "ON");
        let entityIds = memory.EntityIds();
        return new TakeTurnRequest({entities: entityIds});
    }

    // Set a task to the "OFF" state
    private async ClearTaskCB(context : BlisContext, memory : BlisMemory, entityName : string) : Promise<TakeTurnRequest>
    {
        memory.ForgetEntityByName(entityName, null);
        let entityIds = memory.EntityIds();
        return new TakeTurnRequest({entities: entityIds});
    }

    //====================================================

    private ErrorResponse(error : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)) : TakeTurnResponse
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

            // If entity is associated with a task, make sure task is active
            if (entity.metadata && entity.metadata.task)
            {
                // If task is no longer active, clear the memory
                if (!memory.WasRemembered(entity.metadata.task))
                {
                    memory.ForgetEntity(entity);
                }
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
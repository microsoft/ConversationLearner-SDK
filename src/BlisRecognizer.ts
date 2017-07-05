import * as builder from 'botbuilder';
import { TakeTurnRequest } from './Model/TakeTurnRequest'
import { BlisApp_v1 } from './Model/BlisApp'
import { BlisAppContent } from './Model/BlisAppContent'
import { BlisClient_v1 } from './BlisClient';
import { BlisMemory } from './BlisMemory';
import { BlisDebug} from './BlisDebug';
import { BlisContext} from './BlisContext';
import { LabelEntity_v1 } from './Model/LabelEntity';
import { LabelAction } from './Model/LabelAction';
import { Action_v1 } from './Model/Action';
import { TrainDialog_v1 } from './Model/TrainDialog';
import { TakeTurnModes, EntityTypes,  TeachStep, TeachAction, ActionTypes_v1, SaveStep, APICalls, ActionCommand, BLIS_INTENT_WRAPPER } from './Model/Consts';
import { Command, IntCommands, LineCommands, CueCommands, HelpCommands } from './Model/Command';
import { BlisHelp } from './Model/Help'; 
import { TakeTurnResponse } from './Model/TakeTurnResponse'
import { Utils } from './Utils';
import { Menu } from './Menu';
import { Server } from './Http/Server';
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

    redisServer: string;

    redisKey: string;

    // Optional callback than runs after LUIS but before BLIS.  Allows Bot to substitute entities
    luisCallback? : (text: string, luisEntities : LabelEntity_v1[], memory : BlisMemory, done : (ttr : TakeTurnRequest) => void) => void;

    // Optional callback that runs after BLIS is called but before the Action is rendered
    blisCallback? : (text : string, memory : BlisMemory, done : (text : string) => void) => void;

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
    protected blisClient : BlisClient_v1;
    protected blisCallback : (test : string, memory : BlisMemory, done : (text : string)=> void) => void;
    protected connector : builder.ChatConnector;
    protected defaultApp : string;
    protected entity_name2id : { string : string };
    protected entityValues = {};

    // Optional callback than runs after LUIS but before BLIS.  Allows Bot to substitute entities
    private luisCallback? : (text: string, luisEntities : LabelEntity_v1[], memory : BlisMemory, done : (takeTurnRequest : TakeTurnRequest)=> void) => void;

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
            BlisDebug.Log("Creating client....");
            BlisClient_v1.Init(options.serviceUri, options.user, options.secret, options.azureFunctionsUrl, options.azureFunctionsKey);
            BlisMemory.Init(options.redisServer, options.redisKey);
            this.luisCallback = options.luisCallback;
            this.apiCallbacks = options.apiCallbacks;
            this.intApiCallbacks[APICalls.SETTASK] = this.SetTaskCB;
            this.intApiCallbacks[APICalls.AZUREFUNCTION] = this.CallAzureFuncCB;
            this.connector = options.connector;
            this.defaultApp = options.appId;
            this.blisCallback = options.blisCallback;

            Server.Init();

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
    
    /** Receive input from user and returns a socre */
    public recognize(reginput: builder.IRecognizeContext, recCb: (error: Error, result: IBlisResult) => void): void 
    {  
        // Always recognize, but score is less than 1.0 so prompts can still win
        var result: IBlisResult = { recognizer: this, score: 0.4, intent: null, entities : null };

        // Send callback
        recCb(null, result);
    }

    public LoadUser(session: builder.Session, 
                        cb : (responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], context: BlisContext) => void )
    {
        // TODO - move invoke contents here
            let context = new BlisContext(this.bot, session);
            cb(null, context);
    }

    /** Send result to user */
    private SendResult_v1(recsess : RecSession, responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], intent? : string, entities?: builder.IEntity[]  ) 
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
    private async ProcessResult_v1(recsess : RecSession, responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], intent : string, entities: builder.IEntity[], teachAction?: string, actionData? : string) 
    {
        // Some commands require taking a post command TeachAction (if user is in teach mode)
        let memory = recsess.context.Memory();
        let inTeach = await memory.BotState().InTeach();
        if (inTeach && teachAction) 
        {
            let appId = await  memory.BotState().AppId();
            let sessionId = await memory.BotState().SessionId();

            if (teachAction == TeachAction.RETRAIN)
            {
                // Send command response out of band
                responses.push("Retraining...");
                Utils.SendResponses(recsess.context, responses);

                // Retrain the model
                BlisClient_v1.client.Retrain_v1(appId, sessionId)
                    .then(async (takeTurnResponse) => 
                    {
                        // Continue teach session
                        await this.TakeTurnCallback_v1(recsess, takeTurnResponse);
                    })
                    .catch((error) => {
                        this.SendResult_v1(recsess, [error])
                    });
            }
            else if (teachAction == TeachAction.PICKACTION && actionData != null)
            {
                // Send command response out of band
                responses.push("Retraining...");
                Utils.SendResponses(recsess.context, responses);

                // Retrain the model
                BlisClient_v1.client.Retrain_v1(appId, sessionId)
                    .then(async (takeTurnResponse) => 
                    {
                        // Take the next turn
                        BlisDebug.Log("TT: Retrain", "flow");
                        await this.TakeTurn_v1(recsess, recsess.userInput, actionData);
                    })
                    .catch((error) => {
                        this.SendResult_v1(recsess, [error])
                    });             
            }
        }
        else 
        {
            this.SendResult_v1(recsess, responses, intent, entities);
        }
    }

    private async TakeTurnCallback_v1(recsess : RecSession, ttResponse : TakeTurnResponse, error? : string) : Promise<void> 
    { 
        BlisDebug.Verbose("TakeTurnCallback");
        let memory = recsess.context.Memory();
       //let memory = new BlisMemory(recsess.context.session);

        if (error)
        {
            let responses = Menu.AddEditCards(recsess.context, [error]);
            await this.ProcessResult_v1(recsess, responses, null, null);
            return;
        }

        let responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[] = [];
        
        if (ttResponse.mode == TakeTurnModes.TEACH)
        {
            if (ttResponse.teachStep == TeachStep.LABELENTITY) {
                await this.ProcessLabelEntity_v1(recsess, ttResponse, responses);
            }
            else if (ttResponse.teachStep == TeachStep.LABELACTION)
            {
                await this.ProcessLabelAction_v1(recsess, ttResponse, responses);
            }
            else
            {
                responses.push(`Unrecognized TeachStep ${ttResponse.teachStep}`);
            }
        }
        else if (ttResponse.mode == TakeTurnModes.ACTION)
        {
            let output = ttResponse.actions[0].content;
            await memory.TrainHistory().SetLastStep(SaveStep.RESPONSES, output);

            // Clear any suggested entity hints from response  TODO - this seems outdate
            output = output ? output.replace(" !"," ") : output;

            // Allow for dev to update
            let inTeach = await memory.BotState().InTeach();
            let outText = null;
            if (this.blisCallback)
            {
                outText = await this.PromisifyBC(this.blisCallback, output, memory);
            }
            else
            {
                outText = await this.PromisifyBC(this.DefaultBlisCallback, output, memory);
            }

            if (inTeach)
            {
                await memory.TrainHistory().SetStep(SaveStep.RESPONSES, outText);
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
            await this.ProcessResult_v1(recsess, responses, null, null);
        }
    }

    /** Process Label Entity Training Step */
    private async ProcessLabelEntity_v1(recsess : RecSession, ttResponse : TakeTurnResponse, responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) : Promise<void>
    {
        BlisDebug.Verbose("ProcessLabelEntity");

        let memory = recsess.context.Memory();
        if (ttResponse.teachError) {
            let body = `Input did not match original text. Let's try again.\n\n`;
            responses.push(Utils.ErrorCard(body));
        }
        else
        {
            await memory.TrainHistory().SetStep(SaveStep.INPUT, recsess.userInput);
            await memory.TrainHistory().SetLastStep(SaveStep.INPUT,recsess.userInput);
        }
        let cardtitle = "Teach Step: Detected Entities";
        if (ttResponse.teachLabelEntities.length == 0)
        {
            // Look for suggested entity in previous response
            let lastResponses = await memory.TrainHistory().LastStep(SaveStep.RESPONSES);
            let suggestedEntity = Action_v1.GetEntitySuggestion(lastResponses); 
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
                let entityName = await memory.EntityLookup().ToName(labelEntity.id);

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
    private async ProcessLabelAction_v1(recsess : RecSession, ttResponse : TakeTurnResponse, responses: (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[]) : Promise<void>
    {
        BlisDebug.Verbose("ProcessLabelEntity");

        let memory = recsess.context.Memory();
        // If app contains no entities, LabelEntity skip is stepped, so input must still be saved
        let input = await memory.TrainHistory().CurrentInput();
        if (!input)
        {
            // Only run if no suggested entity is found
            await memory.TrainHistory().SetStep(SaveStep.INPUT, recsess.userInput);
            await memory.TrainHistory().SetLastStep(SaveStep.INPUT, recsess.userInput);
        }

        let ents = await memory.BotMemory().ToString();
        await memory.TrainHistory().SetStep(SaveStep.ENTITY, ents);

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
            let body = `${ents}\n\n`;
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
            await memory.TrainHistory().SetLastStep(SaveStep.CHOICES, choices);
        }              
    }

    public invoke_v1(session: builder.Session, recCb: (error: Error, result: IBlisResponse) => void): void 
    {    
        try
        {  
            if (!session || !session.message)
            {
                return;
            }

            let address = session.message.address;
            this.LoadUser(session, async (responses, context) => {

                let memory = context.Memory();

                // Is new created app
                if (this.defaultApp)
                {
                    // Attempt to load the application
                    await memory.Init(this.defaultApp);
                    responses = await BlisAppContent.Load(context, this.defaultApp);
                    this.defaultApp = null;
                }
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
                        await this.ProcessResult_v1(recsess, help, null, null);
                        return;
                    }

                    // Handle cue commands (do this first so can stack cues)
                    if (Command.IsCueCommand(userInput)) {

                        CommandHandler.HandleCueCommand(context, userInput, 
                            async (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction: string, actionData : string) => 
                            {
                                await this.ProcessResult_v1(recsess, responses, null, null, teachAction, actionData);
                            });
                        return;
                    }
                    let cueCommand = await memory.CueCommand().Get();
                    if (cueCommand)
                    {
                        CommandHandler.ProcessCueCommand(context, userInput, async (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction: string, actionData : string) => 
                            {
                                await this.ProcessResult_v1(recsess, responses, null, null, teachAction, actionData);
                            });
                        return;
                    }
                    // Handle admin commands
                    if (Command.IsLineCommand(userInput)) {

                        CommandHandler.HandleLineCommand(context, userInput, 
                            async (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction: string, actionData : string) => 
                            {
                                await this.ProcessResult_v1(recsess, responses, null, null, teachAction, actionData);
                            });
                        return;
                    }
                    if (Command.IsIntCommand(userInput)) {
                        CommandHandler.HandleIntCommand(context, userInput, 
                            async (responses : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)[], teachAction: string, actionData: string) => 
                            {
                                await this.ProcessResult_v1(recsess, responses, null, null, teachAction, actionData);
                            });
                            return;
                    }
                    // No app in memory
                    let appId = await  memory.BotState().AppId();
                    if (!appId)
                    {
                        // If error was thrown will be in responses
                        if (!responses) responses = [];
                        responses = responses.concat(Menu.AppPanel('No App Loaded','Load or Create one'));
                        await this.ProcessResult_v1(recsess, responses, null, null);
                        return;
                    }
                    // No session
                    let sessionId = await memory.BotState().SessionId();
                    if (!sessionId)
                    {
                        // If prev error was thrown will be in responses
                        if (!responses) responses = [];
                        responses = responses.concat(Menu.Home("The app has not been started"));
                        await this.ProcessResult_v1(recsess, responses, null, null);
                        return;
                    }
                    else 
                    {
                        
                        let inTeach = await memory.BotState().InTeach();
                        if (inTeach)
                        {
                            // Check if user has limited set of choices
                            let choices = await memory.TrainHistory().LastStep(SaveStep.CHOICES);
                            if (choices && Object.keys(choices).length > 0)
                            {
                                if (!choices[userInput])
                                {
                                    let msg = "Please select one of the action from above or click 'Add Action' for a new Action";
                                    await this.ProcessResult_v1(recsess, [msg], null, null, );
                                    return;
                                }
                                // Convert numeric choice to actionId
                                let actionId = choices[userInput];
                                await memory.TrainHistory().SetLastStep(SaveStep.CHOICES, null);
                                BlisDebug.Log("TT: Choose Action", "flow");
                                await this.TakeTurn_v1(recsess, null, actionId);
                            }
                            else
                            {
                                BlisDebug.Log("TT: Choose Action", "flow");
                                await this.TakeTurn_v1(recsess, userInput, null);
                            }
                        }
                        // If not in teach mode remember last user input
                        else
                        {
                            await memory.TrainHistory().SetLastStep(SaveStep.INPUT, userInput);  
                            BlisDebug.Log("TT: Main", "flow");
                            await this.TakeTurn_v1(recsess, userInput, null);
                        }
                    } 
                }
                else if (session.message.attachments && session.message.attachments.length > 0)
                {
                    Utils.SendMessage(context, "Importing application...");
                    BlisAppContent.ImportAttachment(context, session.message.attachments[0] , async (text) => {
                        await this.ProcessResult_v1(recsess, [text], null, null);
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

    private async PromisifyLC(luisCallback, text: string, luisEntities : LabelEntity_v1[], memory : BlisMemory) {
        return new Promise(function(resolve,reject){
            luisCallback(text, luisEntities, memory, (takeTurnRequest) =>
            {
                resolve(takeTurnRequest);
            });
        });
    }

    private async PromisifyBC(blisCallback, text : string, memory : BlisMemory) {
        return new Promise(function(resolve,reject){
            blisCallback(text, memory, (outText) =>
            {
                resolve(outText);
            });
        });
    }

    public async TakeTurn_v1(recsess : RecSession, input : string | TakeTurnRequest, actionId : string) : Promise<void>
    {
        BlisDebug.Verbose("TakeTurn");

        recsess.userInput = (typeof input == 'string') ? input : null;

        // Error checking
        let memory = recsess.context.Memory();
        let appId = await memory.BotState().AppId();
        if (appId  == null)
        {
            let card = Menu.AppPanel("No Application has been loaded..");
            let response = this.ErrorResponse(card[0]);
            await this.TakeTurnCallback_v1(recsess, response);
            return;
        }
        let modelId = await  memory.BotState().ModelId();
        let inTeach = await memory.BotState().InTeach();
        if (!modelId  && !inTeach)
        {
            let response = this.ErrorResponse(Menu.Home("This application needs to be trained first."));
            await this.TakeTurnCallback_v1(recsess, response);
            return;
        }

        let sessionId = await memory.BotState().SessionId();
        if (!sessionId)
        {
            let response = this.ErrorResponse(Menu.Home("The app has not been started"));
            await this.TakeTurnCallback_v1(recsess, response);
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
            var takeTurnResponse = await BlisClient_v1.client.SendTurnRequest(appId, sessionId, requestBody)

            BlisDebug.Verbose(`TakeTurnResponse: ${takeTurnResponse.mode}`);
            
            // Check that expected mode matches
            if (!takeTurnResponse.mode || expectedNextModes.indexOf(takeTurnResponse.mode) < 0)
            {
                var response = new TakeTurnResponse({ mode : TakeTurnModes.ERROR, error: `Unexpected mode ${takeTurnResponse.mode}`} );
                await this.TakeTurnCallback_v1(recsess, response);
                return; 
            }

            // LUIS CALLBACK
            if (takeTurnResponse.mode == TakeTurnModes.CALLBACK)
            {
                let takeTurnRequest;
                let memory = recsess.context.Memory();
                if (this.luisCallback)
                {
                    takeTurnRequest = await this.PromisifyLC(this.luisCallback, takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                }
                else
                {
                    takeTurnRequest = await this.PromisifyLC(this.DefaultLuisCallback, takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                }
                BlisDebug.Log("TT: Post LC", "flow");
                await this.TakeTurn_v1(recsess, takeTurnRequest, null);
            }
            // TEACH
            else if (takeTurnResponse.mode == TakeTurnModes.TEACH)
            {
                await this.TakeTurnCallback_v1(recsess, takeTurnResponse);
                return;
            }

            // ACTION
            else if (takeTurnResponse.mode == TakeTurnModes.ACTION)
            {
                let action = takeTurnResponse.actions[0];
                let memory = recsess.context.Memory();

                if (action.actionType == ActionTypes_v1.TEXT)
                {
                    await this.TakeTurnCallback_v1(recsess, takeTurnResponse);

                    // Is this the last itteration?
                    if (!action.waitAction)
                    {
                        let memory = recsess.context.Memory()
                        let entityIds = await memory.BotMemory().RememberedIds();
                        let takeTurnRequest = new TakeTurnRequest({entities: entityIds});
                        expectedNextModes = [TakeTurnModes.ACTION, TakeTurnModes.TEACH];
                        BlisDebug.Log("TT: Action Text", "flow");
                        await this.TakeTurn_v1(recsess, takeTurnRequest, null);
                    }
                    else if (inTeach)
                    {
                        await memory.TrainHistory().FinishStep();
                    }
                    return;
                }

                // API CALLS
                else if (action.actionType == ActionTypes_v1.API)
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
                        let entities = await memory.BotMemory().GetEntities(iArgs);
                        await this.ProcessResult_v1(recsess, null, intentName, entities);
                        await memory.TrainHistory().SetStep(SaveStep.APICALLS, `${intentName} ${entities}`);
                        return;
                    }

                    // Make any entity substitutions
                    args = await memory.BotMemory().SubstituteEntities(args);

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
                        if (inTeach)
                        {
                            await memory.TrainHistory().SetStep(SaveStep.APICALLS, `${apiName} ${args}`);
                        }
                        BlisDebug.Verbose(`API: {${apiName} ${args}}`);

                        // If action isn't terminal take another step
                        if (!action.waitAction)
                        {
                            expectedNextModes = [TakeTurnModes.ACTION, TakeTurnModes.TEACH];
                            BlisDebug.Log("TT: API", "flow");
                            await this.TakeTurn_v1(recsess, takeTurnRequest, null);
                        }      
                        else if (inTeach)
                        {
                            await memory.TrainHistory().FinishStep();
                            var card = Utils.MakeHero(null, null, "Type next user input for this Dialog or" , 
                            { "Dialog Complete" : IntCommands.DONETEACH});
                            Utils.SendResponses(recsess.context, [card]);
                        }         
                    }
                    else 
                    {
                        let response = this.ErrorResponse(`API ${apiName} not defined`);
                        await this.TakeTurnCallback_v1(recsess, response);
                    }
                }
            }
        }
        catch (error) {
            let errMsg = BlisDebug.Error(error); 
            await this.TakeTurnCallback_v1(recsess, null, errMsg);
        }
    }

    //====================================================
    // Built in API calls
    //====================================================
    private async CallAzureFuncCB(context : BlisContext, memory : BlisMemory, args : string) : Promise<TakeTurnRequest>
    {
        // Disallow repetative API calls in case BLIS gets stuck TODO
        /*     var lastResponse = memory.TrainHistory().LastStep(SaveStep.RESPONSE);
     if (lastResponse == args)
        {
            return;
        }*/
        if (!BlisClient_v1.client.azureFunctionsUrl)
        {
            var errCard = Utils.ErrorCard("Attempt to call Azure Function with no URL.","Must set 'azureFunctionsUrl' in Bot implimentation.");
            Utils.SendMessage(context, errCard);
        }
        else
        {
       //   await memory.BotMemory().ForgetByName("company", null); // TEMP
            let [funct, query] = args.split(' ');
            let output = await AzureFunctions.Call(BlisClient_v1.client.azureFunctionsUrl, BlisClient_v1.client.azureFunctionsKey, funct, query);
            if (output)
            {
                Utils.SendMessage(context, output);
            }
        }
        let entityIds = await memory.BotMemory().RememberedIds();
        await memory.TrainHistory().SetLastStep(SaveStep.RESPONSES, args);  // TEMP try remember last apicall
        return new TakeTurnRequest({entities: entityIds});
    }

    // EXPIRIMENTAL = TODO
    // Set a task to the "ON" state
    private async SetTaskCB(context: BlisContext, memory : BlisMemory, entityName : string) : Promise<TakeTurnRequest>
    {
        memory.BotMemory().RememberByName(entityName, "ON");
        let entityIds = await memory.BotMemory().RememberedIds();
        return new TakeTurnRequest({entities: entityIds});
    }

    // Set a task to the "OFF" state
    private async ClearTaskCB(context : BlisContext, memory : BlisMemory, entityName : string) : Promise<TakeTurnRequest>
    {
        await memory.BotMemory().ForgetByName(entityName, null);
        let entityIds = await memory.BotMemory().RememberedIds();
        return new TakeTurnRequest({entities: entityIds});
    }

    //====================================================

    private ErrorResponse(error : (string | builder.IIsAttachment | builder.SuggestedActions | EditableResponse)) : TakeTurnResponse
    {
        return new TakeTurnResponse({ mode : TakeTurnModes.ERROR, error: error});
    }

    public async DefaultLuisCallback(text: string, entities : LabelEntity_v1[], memory : BlisMemory, done : (takeTurnRequest : TakeTurnRequest)=> void) : Promise<void>
    {
        // Update entities in my memory
        for (var entity of entities)
        {
            // If negative entity will have a positive counter entity
            if (entity.metadata && entity.metadata.positive)
            {
                await memory.BotMemory().ForgetByLabel(entity);
            }
            else
            {
                await memory.BotMemory().RememberByLabel(entity);
            }

            // If entity is associated with a task, make sure task is active
            if (entity.metadata && entity.metadata.task)
            {
                // If task is no longer active, clear the memory
                let remembered = await memory.BotMemory().WasRemembered(entity.metadata.task);
                if (!remembered)
                {
                    await memory.BotMemory().ForgetByLabel(entity);
                }
            }
        }

        // Get entities from my memory
        var entityIds = await memory.BotMemory().RememberedIds();

        let ttr = new TakeTurnRequest({input : text, entities: entityIds});
        done(ttr);
    }

    private async DefaultBlisCallback(text: string, memory : BlisMemory, done : (text: string)=> void) : Promise<void>
    {
        let outText = await memory.BotMemory().Substitute(text);
        done(outText);
    }
}
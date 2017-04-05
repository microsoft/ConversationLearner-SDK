import * as builder from 'botbuilder';
import { TakeTurnRequest } from './Model/TakeTurnRequest'
import { BlisApp } from './Model/BlisApp'
import { BlisAppContent } from './Model/BlisAppContent'
import { BlisClient } from './BlisClient';
import { BlisMemory } from './BlisMemory';
import { BlisDebug} from './BlisDebug';
import { BlisUserState} from './BlisUserState';
import { LuisEntity } from './Model/LuisEntity';
import { Action } from './Model/Action';
import { Entity } from './Model/Entity';
import { TrainDialog } from './Model/TrainDialog';
import { LabelEntity } from './Model/LabelEntity';
import { LabelAction } from './Model/LabelAction';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, Commands, IntCommands, ActionTypes, SaveStep, APICalls, ActionCommand } from './Model/Consts';
import { BlisHelp, Help } from './Model/Help'; 
import { TakeTurnResponse } from './Model/TakeTurnResponse'
import { EditCommand } from './Model/EditCommand';
import { Utils } from './Utils';

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
    luisCallback? : (text: string, luisEntities : LuisEntity[], memory : BlisMemory) => TakeTurnRequest;

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
    private LuisCallback? : (text: string, luisEntities : LuisEntity[], memory : BlisMemory) => TakeTurnRequest;

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

    private async CueEditAction(userState : BlisUserState, actionId : string, cb : (text) => void) : Promise<void>
    {
        try
        {         
            // Store edit command so I can capture the next user input as the edit
            let editCommand = new EditCommand(Commands.EDITACTION, actionId);
            let memory = new BlisMemory(userState);
            memory.SetEditCommand(editCommand);

            // Cue the user to enter the edit command
            let action = await this.blisClient.GetAction(userState[UserStates.APP], actionId);
            let card = Utils.MakeHero(`Edit Action`, action.content, "Enter new Action context", null);
            cb([card]);
        }
        catch (error)
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    }

    private async CueEditEntity(userState : BlisUserState, entityId : string, cb : (text) => void) : Promise<void>
    {
        try
        {         
            // Store edit command so I can capture the next user input as the edit
            let editCommand = new EditCommand(Commands.EDITENTITY, entityId);
            let memory = new BlisMemory(userState);
            memory.SetEditCommand(editCommand);

            // Cue the user to enter the edit command
            let entity = await this.blisClient.GetEntity(userState[UserStates.APP], entityId);
            let type = entity.luisPreName ? entity.luisPreName : entity.entityType;
            let card = Utils.MakeHero(`Edit: (${entity.name})`, type, "Enter new Entity name", null);
            cb([card]);
        }
        catch (error)
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    }

    private DebugHelp() : string
    {
        let text = "";
        text += `${Commands.DEBUG}\n\n       Toggle debug mode\n\n`
        text += `${Commands.DELETEAPP} {appId}\n\n       Delete specified application\n\n`
        text += `${Commands.DUMP}\n\n       Show client state\n\n`
        text += `${Commands.ENTITIES}\n\n       Return list of entities\n\n`
        text += `${Commands.ACTIONS} {y/n}\n\n       Return list of actions. If 'Y' show IDs\n\n`
        text += `${Commands.TRAINDIALOGS}\n\n       Return list of training dialogs\n\n`
        text += `${Commands.HELP}\n\n       General help`
        return text;
    }

    private async EndSession(userState : BlisUserState, cb : (text) => void) : Promise<void>
    {
        try
        {        
            // Ending teaching session (which trains the model if necessary), update modelId
            let sessionId = await this.blisClient.EndSession(userState[UserStates.APP], userState[UserStates.SESSION]);
            new BlisMemory(userState).EndSession();
            let modelId = await this.blisClient.GetModel(userState[UserStates.APP]);
            userState[UserStates.MODEL]  = modelId;
            cb(sessionId);
        }
        catch (error)
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }

    /** Return text of current training steps */
    private TrainStepText(userState : BlisUserState) : string
    {
        let memory = new BlisMemory(userState);
        let trainSteps = memory.TrainSteps();
        let msg = "** New Dialog Summary **\n\n";
        msg += `-----------------------------\n\n`;

        for (let trainstep of trainSteps)
        {
            msg += trainstep.input;

            if (trainstep.entity)
            {
                msg += `    _${trainstep.entity}_\n\n`;
            }
            else
            {
                msg += "\n\n";
            }
            for (let api of trainstep.api)
            {              
                msg += `     {${api}}\n\n`
            }
            msg += `     ${trainstep.response}\n\n`
        }
        return msg;
    }

    private Help(command : string) : string
    {
        if (command) 
        {
            // Don't require user to put ! in front of command
            if (!command.startsWith('!'))
            {
                command = "!"+command;
            }
            let helpmsg = BlisHelp.CommandHelpString(command);
            return helpmsg;
        }
        let text = "";
        for (let item in Commands)
        {
            let key = Commands[item];
            let comObj = BlisHelp.CommandHelp(key);
            text += `${key} ${comObj.args}\n\n     ${comObj.description}\n\n\n\n`;
        }
        return text;
    }

    private async NewSession(userState : BlisUserState, teach : boolean, cb : (results : (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to create new session, Teach = ${teach}`);

       try {
            // Close any existing session
            let endId = await this.blisClient.EndSession(userState[UserStates.APP], userState[UserStates.SESSION]);
            BlisDebug.Log(`Ended session ${endId}`);

            // Start a new session
            let sessionId = await this.blisClient.StartSession(userState[UserStates.APP], teach);
            new BlisMemory(userState).StartSession(sessionId, teach);
            BlisDebug.Log(`Started session ${sessionId}`)   
            if (teach)
            {
                let body = "Provide your first input for this teach dialog.\n\n\n\n";
                let subtext = `At any point type "${Commands.ABANDON}" to abort`;
                let card = Utils.MakeHero("Teach mode started", subtext, body, null);
                cb([card]);
            }
            else {
                cb([`_Bot started..._`]);
            }
       }
       catch (error) {
           let errMsg = Utils.ErrorString(error);
           BlisDebug.Error(errMsg);
           userState[UserStates.SESSION] = null;  // Clear the bad session
           cb([errMsg]);
       }
    }

    public LoadUser(address : builder.IAddress, 
                        cb : (err: Error, state: BlisUserState) => void )
    {
        // TODO handle errors
        BlisUserState.Get(this.bot, address, this.defaultApp, (error, userState, isNew) => {
            if (isNew)
            {                        
                // Attempt to load the application
                BlisAppContent.Load(this.blisClient, userState, address, this.defaultApp, (text) => 
                {
                    BlisDebug.Log(text);
                    cb(null, userState);
                });
            }
            else
            {   
                cb(null, userState);
            }
        });
    }

    private SendResult(address : builder.IAddress, userState : BlisUserState, cb: (error: Error, result: IBlisResult) => void, responses : (string|builder.IIsAttachment)[]) 
    {
        if (!responses)
        {
            BlisDebug.Error("Send result with empty response");
            responses = [];
        }

        // Save user state
        BlisUserState.Save(this.bot, address, userState);

        // Assume BLIS always wins for now 
        var result: IBlisResult = { score: 1.0, responses: responses, intent: null };

        // Send callback
        cb(null, result);
    }

    // For handling buttons that require subsequent text input
    private HandleEditCommand(input : string, address : builder.IAddress, userState : BlisUserState, 
         cb: (responses : (string|builder.IIsAttachment)[], retrain? : boolean) => void) : void {
        
        let memory =  new BlisMemory(userState);
        try
        {        
            let editCommand = memory.EditCommand();

            if (editCommand.commandName == Commands.EDITACTION)  
            {            
                Action.Add(this.blisClient, userState, input, ActionTypes.TEXT, editCommand.id /*actionId*/, (responses) => {
                    cb(responses);
                });
            }
            else if (editCommand.commandName == Commands.EDITENTITY)  
            {         
                let [name, type] = input.split(' ');   
                Entity.Add(this.blisClient, userState, editCommand.id /*entityId*/, name, type, (responses) => {
                    cb(responses);
                });
            }
         }
        catch (error) 
        {
            let errMsg = Utils.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
        finally 
        {
            // Clear edit command
            memory.SetEditCommand(null);
        }
    }

    private HandleHelp(input : string, address : builder.IAddress, userState : BlisUserState, cb: (error: Error, result: IBlisResult) => void) : void 
    {
        let help = BlisHelp.Get(input);
        this.SendResult(address, userState, cb, [help]);
    }

    private HandleCommand(input : string, address : builder.IAddress, userState : BlisUserState, 
        cb: (responses : (string|builder.IIsAttachment)[], retrain? : boolean) => void) : void {

        let [command, arg, arg2, arg3, arg4] = input.split(' ');
        command = command.toLowerCase();

        //---------------------------------------------------
        // Commands allowed at any time
        if (command == Commands.ACTIONS)
        {
            Action.Get(this.blisClient, userState, arg, (responses) => {
                cb(responses);
            });
        }
        else if (command == Commands.ADDENTITY)
        {
            Entity.Add(this.blisClient, userState, null, arg, arg2, (responses) => {
                cb(responses, true);
            });
        }
        else if (command == Commands.DEBUG)
        {
            userState[UserStates.DEBUG] = !userState[UserStates.DEBUG];
            BlisDebug.enabled = userState[UserStates.DEBUG];
            cb(["Debug " + (BlisDebug.enabled ? "Enabled" : "Disabled")]);
        }
        else if (command == Commands.DEBUGHELP)
        {
            cb([this.DebugHelp()]);
        }
        else if (command == Commands.DUMP)
        {
            let memory = new BlisMemory(userState);
            cb([memory.Dump()]);
        }
        else if (command == Commands.ENTITIES)
        {
            let arg = this.RemoveCommandWord(input);  
            Entity.Get(this.blisClient, userState, arg, (responses) => {
                cb(responses);
            });
        }
        else if (command == Commands.HELP)
        {
            cb([this.Help(arg)]);
        }
        //---------------------------------------------------
        // Command only allowed in TEACH
        else if (userState[UserStates.TEACH])
        {
            if (command == Commands.ABANDON)
            {
                  this.HandleIntCommand(IntCommands.FORGETTEACH, address, userState, cb);
            }
            else
            {
                cb([`_Command not valid while in Teach mode_`]);
            }
        }
        //---------------------------------------------------
        // Commands only allowed when not in TEACH mode
        else {
            if (command == Commands.ADDAPIACTION)
            {
                let arg = this.RemoveCommandWord(input);
                Action.Add(this.blisClient, userState, arg, ActionTypes.API, null, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.ADDTEXTACTION)
            {
                let arg = this.RemoveCommandWord(input);                
                Action.Add(this.blisClient, userState, arg, ActionTypes.TEXT, null, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.APPS)
            {
                BlisApp.GetAll(this.blisClient, address, arg, (text) => {
                    cb(text);
                });
            }
            else if (command == Commands.CREATEAPP)
            {
                BlisApp.Create(this.blisClient, userState, arg, arg2, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.DELETEALLAPPS)
            {
                BlisApp.DeleteAll(this.blisClient, userState, address, (text) => {
                    cb([text]);
                });
            }
            else if (command == Commands.DELETEACTION)
            {
                Action.Delete(this.blisClient, userState, arg, (text) => {
                    cb([text]);
                });
            }
            else if (command == Commands.DELETEAPP)
            {
                Utils.SendMessage(this.bot, address, "Deleting apps...");
                BlisApp.Delete(this.blisClient, userState, arg, (text) => {
                    cb([text]);
                });
            }
            else if (command == Commands.DELETEENTITY)
            {
                Entity.Delete(this.blisClient, userState, arg, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.EDITACTION)  // TODO text or API
            {
                let content = this.RemoveWords(input, 2);   // Remove command and actionId             
                Action.Add(this.blisClient, userState, content, ActionTypes.TEXT, arg /*actionId*/, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.EDITENTITY)  
            {          
                Entity.Add(this.blisClient, userState, arg /*entityId*/, arg2, arg3, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.EXPORTAPP)
            {
                BlisAppContent.Export(this.blisClient, userState, address, this.bot, (text) => {
                    cb([text]);
                });
            }
            else if (command == Commands.IMPORTAPP)
            {
                Utils.SendMessage(this.bot, address, "Importing app...");
                BlisAppContent.Import(this.blisClient, userState, address, arg, (text) => {
                    cb([text]); 
                });
            }
            else if (command == Commands.LOADAPP)
            {
                Utils.SendMessage(this.bot, address, "Loading app...");
                BlisAppContent.Load(this.blisClient, userState, address, arg, (text) => {
                    cb([text]);
                });
            }
            else if (command == Commands.START)
            {
                this.NewSession(userState, false, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.TEACH)
            {
                let memory = new BlisMemory(userState);
                memory.ClearTrainSteps();
                this.NewSession(userState, true, (results) => {
                    cb(results);
                });
            }
            else if (command == Commands.TRAINDIALOGS)
            {
                TrainDialog.Get(this.blisClient, userState, address, arg, (text) => {
                    cb(text);
                });
            }
            else 
            {
                let text = "_Command unrecognized or not valid in Teach mode_\n\n\n\n" + this.Help(null);
                cb([text]);
            }
        }
    }

    private HandleIntCommand(input : string, address : builder.IAddress, userState : BlisUserState, 
         cb: (responses : (string|builder.IIsAttachment)[], retrain? : boolean) => void) : void {
    
        let [command, arg, arg2, arg3] = input.split(' ');
        command = command.toLowerCase();

        //-------- Only valid in Teach ------------------//
        if (userState[UserStates.TEACH]) {
            if (command == IntCommands.SAVETEACH) {
                let card = Utils.MakeHero("Dialog Trained", null, null, {"Start" : Commands.START, "Teach" : Commands.TEACH, "Edit" : Help.NEWAPP});
                this.EndSession(userState, (text) => {
                    cb([card]);
                });
            }
            else if (command == IntCommands.FORGETTEACH) {
                // TODO: flag to not save training
                let card = Utils.MakeHero("Dialog Abandoned", null, null, {"Start" : Commands.START, "Teach" : Commands.TEACH, "Edit" : Help.NEWAPP});
                this.EndSession(userState, (text) => {
                    cb([card]);
                });
            }
            else if (command == IntCommands.DONETEACH) {
                let steps = this.TrainStepText(userState);
                let card = Utils.MakeHero("", "", "Does this look good?", 
                    { "Save" : IntCommands.SAVETEACH , "Abandon" : IntCommands.FORGETTEACH});

                cb([steps, card]);
            }
            else 
            {
                cb([`_In teaching mode. The only valid command is_ ${IntCommands.DONETEACH}`]);
            }
        }
        //-------- Valid not in Teach ------------------//
        else if (command == IntCommands.DELETEAPP) {
            BlisApp.Delete(this.blisClient, userState, arg, (text) => {
                cb([text]);
            });
        }
        else if (command == IntCommands.DELETEDIALOG) {
            TrainDialog.Delete(this.blisClient, userState, arg, (text) => {
                cb([text]);
            });
        }
        else if (command == IntCommands.EDITACTION) {
            this.CueEditAction(userState, arg, (responses) => {
                cb(responses);
            });
        }
        else if (command == IntCommands.EDITENTITY) {
            this.CueEditEntity(userState, arg, (responses) => {
                cb(responses);
            });
        }
        else 
        {   
            let text = "_Not a valid command._\n\n\n\n" + this.Help(null);
            cb([text]);
        }
    }

    public recognize(context: builder.IRecognizeContext, cb: (error: Error, result: IBlisResult) => void): void 
    {    
        try
        {  
            if (!context || !context.message)
            {
                return;
            }

            let address = context.message.address;
            this.LoadUser(address, (error, userState) => {

                if (context.message.attachments && context.message.attachments.length > 0)
                {
                    Utils.SendMessage(this.bot, address, "Importing application...");
                    BlisAppContent.ImportAttachment(this.blisClient, userState, address, context.message.attachments[0] ,(text) => {
                        this.SendResult(address, userState, cb, [text]);
                    });
                    return;
                }

                if (context.message.text) 
                {
                    let inTeach = userState[UserStates.TEACH];
                    let that = this;
                    let memory = new BlisMemory(userState);

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
                                let entityName = memory.EntityId2Name(labelEntity.entityId);

                                // Prebuild entities don't have a score
                                let score = labelEntity.score ? `_Score: ${labelEntity.score.toFixed(3)}_` : "";
                                entities += `[$${entityName}: ${labelEntity.entityValue}]    ${score}\n\n`;
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
                                        that.TakeTurn(userState, userInput, TakeTurnCallback);
                                        return;
                                    }
                                }
                            }
                        }

                        memory.RememberTrainStep(SaveStep.ENTITY,memory.DumpEntities());

                        let title = `Teach Step: Select Action`;
                        let body = `${memory.DumpEntities()}\n\n`;
                        responses.push(Utils.MakeHero(title, null, body, null));

                        if (ttResponse.teachLabelActions.length == 0)
                        {
                            responses.push('No actions matched.\n\n');
                            body = 'Enter a new Action\n\n';
                        }
                        else 
                        {
                            let msg = "";
                            for (let i in ttResponse.teachLabelActions)
                            {
                                let labelAction = ttResponse.teachLabelActions[i];
                                if (labelAction.available)
                                {
                                    let score = labelAction.score ? labelAction.score.toFixed(3) : "*UNKNOWN*";
                                    msg += `(${1+Number(i)}) ${labelAction.content} _(${labelAction.actionType.toUpperCase()})_ Score: ${score}\n\n`;
                                }
                                else
                                {
                                    msg += `_(${1+Number(i)}) ${labelAction.content}_ _(${labelAction.actionType.toUpperCase()})_ DISQUALIFIED\n\n`;

                                }
                            }
                            responses.push(msg);
                            responses.push(Utils.MakeHero(" ", null, 'Select Action by number or enter a new one', { "Help" : Help.ADDACTION}));
                        }
                                
                    }

                    let TakeTurnCallback = function(ttResponse : TakeTurnResponse, error? : string) : void 
                    { 
                        BlisDebug.Verbose("TakeTurnCallback");

                        if (error)
                        {
                            that.SendResult(address, userState, cb, [error]);
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
                            that.SendResult(address, userState, cb, responses);
                        }
                    }

                    Utils.SendTyping(this.bot, address);
                    BlisDebug.SetAddress(address);   
                    let userInput = context.message.text.trim();

                    // Check for Edit Commands
                    if (memory.EditCommand())
                    {
                        this.HandleEditCommand(userInput, address, userState, (responses : (string|builder.IIsAttachment)[], retrain: boolean) => 
                            {
                                this.SendResult(address, userState, cb, responses);
                            });
                    }

                    // Handle admin commands
                    else if (userInput.startsWith('!')) {

                        this.HandleCommand(userInput, address, userState, 
                            (responses : (string|builder.IIsAttachment)[], retrain: boolean) => 
                            {
                                // Some commands require retraining if user is in teach mode
                                if (inTeach && retrain) 
                                {
                                    // Send command response out of band
                                    responses.push("Retraining...");
                                    Utils.SendResponses(this.bot, address, responses);

                                    // Retrain the model
                                    this.blisClient.Retrain(userState[UserStates.APP], userState[UserStates.APP])
                                        .then(async (takeTurnResponse) => 
                                        {
                                            // Continue teach session
                                            TakeTurnCallback(takeTurnResponse);
                                        })
                                        .catch((error) => {
                                            this.SendResult(address, userState, cb, [error])
                                        });
                                }
                                else 
                                {
                                    this.SendResult(address, userState, cb, responses);
                                }
                            });
                    }
                    else if (userInput.startsWith('~')) {
                        this.HandleIntCommand(userInput, address, userState, (responses : (string|builder.IIsAttachment)[], retrain: boolean) => 
                            {
                                this.SendResult(address, userState, cb, responses);
                            });
                    }
                    else if (userInput.startsWith('#'))
                    {
                        this.HandleHelp(userInput, address, userState, cb);
                    }
                    else 
                    {
                        // If not in teach mode remember last user input
                        if (!inTeach)
                        {
                            memory.RememberLastStep(SaveStep.INPUT, userInput);
                        }
                        this.TakeTurn(userState, userInput, TakeTurnCallback);
                    } 
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

    public async TakeTurn(userState : BlisUserState, payload : string | TakeTurnRequest,
            cb: (response : TakeTurnResponse, error? : string) => void) : Promise<void>
        {
        BlisDebug.Verbose("TakeTurn");

        // Error checking
        if (userState[UserStates.APP]  == null)
        {
            let card = Utils.MakeHero("No Application has been loaded..", null , null,
            { 
                    "My Apps" : `${Commands.APPS}`,
                    "Help" : `${Commands.HELP}`,
            })
            let response = this.ErrorResponse(card);
            cb(response);
            return;
        }
        else if (!userState[UserStates.MODEL]  && !userState[UserStates.TEACH] )
        {
            let card = Utils.MakeHero("This application needs to be trained first.", null , null,
            { 
                    "Teach" : `${Commands.TEACH}`,
                    "Help" : `${Commands.HELP}`,
            })
            let response = this.ErrorResponse(card);
            cb(response);
            return;
        }
        else if (!userState[UserStates.SESSION] )
        {
            let card = Utils.MakeHero("Start the app or add more training dialogs first.", null , null,
            { 
                    "Start" : `${Commands.START}`,
                    "Teach" : `${Commands.TEACH}`
            })
            let response = this.ErrorResponse(card);
            cb(response);
            return;
        }

        let expectedNextModes;
        let requestBody : {};
        if (typeof payload == 'string') {
            expectedNextModes = [TakeTurnModes.CALLBACK, TakeTurnModes.ACTION, TakeTurnModes.TEACH];
            requestBody = { text : payload};
        }
        else {
            expectedNextModes = [TakeTurnModes.ACTION, TakeTurnModes.TEACH]
            requestBody = payload.ToJSON();  // TODO use serializer
        }

        try
        {
            var takeTurnResponse = await this.blisClient.SendTurnRequest(userState, requestBody)

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
                let memory = new BlisMemory(userState);
                if (this.LuisCallback)
                {
                    takeTurnRequest = this.LuisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                }
                else
                {
                    takeTurnRequest = this.DefaultLuisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                } 
                await this.TakeTurn(userState, takeTurnRequest, cb);
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
                        let memory = new BlisMemory(userState);
                        let takeTurnRequest = api(memory, arg);

                        // If in teach mode, remember the step
                        if (userState[UserStates.TEACH])
                        {
                            memory.RememberTrainStep(SaveStep.API, `${apiName} ${arg}`);
                        }
                        BlisDebug.Verbose(`API: {${apiName} ${arg}}`);
                        expectedNextModes = [TakeTurnModes.ACTION, TakeTurnModes.TEACH];
                        await this.TakeTurn(userState, takeTurnRequest, cb);
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

    /** Remove first work (i.e. command) from command string */
    private RemoveCommandWord(text : string) : string 
    {
       let firstSpace = text.indexOf(' ');
       return (firstSpace > 0) ? text.slice(firstSpace+1) : ""; 
    }

    /** Remove words from start from command string */
    private RemoveWords(text : string, numWords : number) : string 
    {
       let firstSpace = text.indexOf(' ');
       let remaining = (firstSpace > 0) ? text.slice(firstSpace+1) : "";
       numWords--; 
       if (numWords == 0)
       {
           return remaining;
       }
       return this.RemoveWords(remaining, numWords); 
    }

    public DefaultLuisCallback(text: string, entities : LuisEntity[], memory : BlisMemory) : TakeTurnRequest
    {
        // Update entities in my memory
        for (var entity of entities)
        {
            // TEMP
            if (!entity.id) {
                BlisDebug.Error("Entity Id not set.")
                entity.id = entity.type;
            }

            var entityName = memory.EntityId2Name(entity.id);
            
            // Tilda indicates a 'not' action on memory
            if (entityName.startsWith(ActionCommand.NEGATIVE))
            {
                let notEntityName = entityName.slice(1);
                memory.ForgetEntityByName(notEntityName, entity.value);
            }
            else
            {
                memory.RememberEntityById(entity.id, entity.value);
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
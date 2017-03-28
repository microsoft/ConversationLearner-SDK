import * as builder from 'botbuilder';
import * as request from 'request';
import * as util from 'util';
import { deserialize } from 'json-typescript-mapper';
import { TakeTurnRequest } from './Model/TakeTurnRequest'
import { BlisApp } from './Model/BlisApp'
import { BlisClient } from './BlisClient';
import { BlisMemory } from './BlisMemory';
import { BlisDebug} from './BlisDebug';
import { BlisUserState} from './BlisUserState';
import { LuisEntity } from './Model/LuisEntity';
import { Action } from './Model/Action';
import { LabelEntity } from './Model/LabelEntity';
import { LabelAction } from './Model/LabelAction';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, Commands, IntCommands, ActionTypes, SaveStep, APICalls, ActionCommand } from './Model/Consts';
import { BlisHelp, Help } from './Model/Help'; 
import { TakeTurnResponse } from './Model/TakeTurnResponse'

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
    private luisCallback? : (text: string, luisEntities : LuisEntity[], memory : BlisMemory) => TakeTurnRequest;

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
            this.luisCallback = options.luisCallback;
            this.apiCallbacks = options.apiCallbacks;
            this.intApiCallbacks[APICalls.SAVEENTITY] = this.SaveEntityCB;
            this.connector = options.connector;
            this.defaultApp = options.appId;
            this.blisCallback = options.blisCallback ? options.blisCallback : this.DefaultBlisCallback;
        }
        catch (error) {
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
        }
    }

    private ReadFromFile(url : string) : Promise<string>
    {
        return new Promise(
            (resolve, reject) => {
                const requestData = {
                    url: url, 
                    json: true,
                    encoding : 'utf8'
                }
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body.message);
                    }
                    else {
                        let model = String.fromCharCode.apply(null, body.data);
                        resolve(model);
                    }

                });
            }
        )
    }

    private async AddAction(userState : BlisUserState, content : string, actionType : string, cb : (responses : (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
        BlisDebug.Log(`AddAction`);

       let error = null;
        if (!content)
        {  
            error = `You must provide content for the action.`;
        }
        if (!actionType)
        {
            error = `You must provide the actionType.`;
        }

        var commandHelp = actionType == ActionTypes.API ? Commands.ADDAPIACTION : Commands.ADDTEXTACTION;
        if (error) 
        {
            let msg = BlisHelp.CommandHelpString(commandHelp, error);
            cb([msg]);
            return;
        }

        // Strip action of any positive and negative entities
        let firstNeg = content.indexOf(ActionCommand.BLOCK);
        let firstPos = content.indexOf(ActionCommand.REQUIRE);
        let cut = 0;
        if (firstNeg > 0 && firstPos > 0)
        {
            cut = Math.min(firstNeg,firstPos);
        }
        else 
        {
            cut = Math.max(firstNeg,firstPos);
        }
        let actionText = (cut > 0) ? content.slice(0,cut-1) : content;

        let memory = new BlisMemory(userState);

        try
        {        
            // Extract negative and positive entities
            let negIds = [];
            let posIds = [];
            let negNames = [];
            let posNames = [];
            let saveName = null;
            let saveId = null;
            let words = Action.Split(content);
            for (let word of words)
            {
                // Add requirement for entity when used for substitution
                if (word.startsWith(ActionCommand.SUBSTITUTE))
                {
                    let posName = word.slice(ActionCommand.SUBSTITUTE.length);
                    if (posNames.indexOf(posName) < 0)
                    {
                        let posID = memory.EntityName2Id(posName);
                        if (posID)
                        {
                            posIds.push(posID);
                            posNames.push(posName);
                        }
                        else
                        {
                            cb([`Entity $${posName} not found.`]);
                            return;
                        }
                    }
                }
                // Extract suggested entities
                else if (word.startsWith(ActionCommand.SUGGEST))
                {
                    // Only allow one suggested entity
                    if (saveName) 
                    {
                        error = BlisHelp.CommandHelpString(commandHelp, `Only one entity suggestion (denoted by "!_ENTITY_") allowed per Action`);
                        cb([error]);
                        return;
                    } 
                    if (actionType == ActionTypes.API)
                    {
                        error = BlisHelp.CommandHelpString(commandHelp, `Suggested entities can't be added to API Actions`);
                        cb([error]);
                        return;
                    }
                    saveName = word.slice(ActionCommand.SUGGEST.length);
                    saveId = memory.EntityName2Id(saveName);
                    if (!saveId)
                    {
                        error = BlisHelp.CommandHelpString(commandHelp, `Entity $${saveName} not found.`);
                        cb([error]);
                        return;
                    }
                    // Add to negative entities
                    if (negNames.indexOf(saveName) < 0)
                    {
                        negIds.push(saveId);
                        negNames.push(saveName);
                    }
                }
                else if (word.startsWith(ActionCommand.BLOCK))
                {
                    let negName = word.slice(ActionCommand.BLOCK.length);
                    let negID = memory.EntityName2Id(negName);
                    if (negID) {
                        negIds.push(negID);
                        negNames.push(negName);
                    }  
                    else
                    {
                        error = BlisHelp.CommandHelpString(commandHelp, `Entity $${negName} not found.`);
                        cb([error]);
                        return;
                    }
                }
                else if (word.startsWith(ActionCommand.REQUIRE)) {
                    let posName = word.slice(ActionCommand.REQUIRE.length);
                    if (posNames.indexOf(posName) < 0)
                    {
                        let posID = memory.EntityName2Id(posName);
                        if (posID) {
                            posIds.push(posID);
                            posNames.push(posName);
                        }  
                        else
                        {
                            error = BlisHelp.CommandHelpString(commandHelp, `Entity $${posName} not found.`);
                            cb([error]);
                            return;
                        }
                    }
                }
            }

            // If suggested entity exists create API call for saving item
            if (saveId) 
            {
                // Make sure it hasn't aleady been added
                let saveAPI = memory.APILookup(saveName);
                if (!saveAPI) {
                    let apiCall = `${APICalls.SAVEENTITY} ${saveName}`;
                    let apiActionId = await this.blisClient.AddAction(userState[UserStates.APP], apiCall, ActionTypes.API, [], [saveId])
                    memory.AddAPILookup(saveName, apiActionId);
                }
            }

            let actionId = await this.blisClient.AddAction(userState[UserStates.APP], actionText, actionType, posIds, negIds)
            let substr = "";
            if (posIds.length > 0) 
            {
                substr += `${ActionCommand.REQUIRE}[${posNames.toLocaleString()}]\n\n`;
            }
            if (negIds.length > 0) 
            {
                substr += `${ActionCommand.BLOCK}[${negNames.toLocaleString()}]`;
            }
            let card = this.MakeHero("Created Action", /* actionId + "\n\n" +*/ substr + "\n\n", actionText, null);
            cb([card])
        }
        catch (error)
        {
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    }

    private async AddEntity(userState : BlisUserState, entityName : string, entityType : string, prebuiltName : string, cb : (responses : (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Add Entity ${entityName}`);

        try 
        {
            let error = null;
            if (!entityName)
            {  
                error = `You must provide an entity name for the entity to create.`;
            }
            if (!entityType)
            {
                error = `You must provide an entity type for the entity to create.`;
            }
            if (error) 
            {
                let msg = BlisHelp.CommandHelpString(Commands.ADDENTITY, error);
                cb([msg]);
                return;
            }

            entityType = entityType.toUpperCase();
            if (entityType != EntityTypes.LOCAL && entityType != EntityTypes.LUIS)
            {
                let msg = BlisHelp.CommandHelpString(Commands.ADDENTITY, `Entity type must be 'LOCAL' or 'LUIS'`);
                cb([msg]);
                return;
            }
            if (entityType == EntityTypes.LOCAL && prebuiltName != null)
            {
                let msg = BlisHelp.CommandHelpString(Commands.ADDENTITY, `LOCAL entities shouldn't include a prebuilt name`);
                cb([msg]);
                return;
            }

            let entityId = await this.blisClient.AddEntity(userState[UserStates.APP], entityName, entityType, prebuiltName)
            let memory = new BlisMemory(userState);
            memory.AddEntityLookup(entityName, entityId);
            let card = this.MakeHero("Created Entity", entityId, entityName, null);
            cb([card]); 
        }
        catch (error) {
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    } 

    private async CreateApp(userState : BlisUserState,  appName : string, luisKey, cb : (responses: (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Create Application`);

        // TODO - temp debug
        if (luisKey == '*')
        {
            luisKey = '5bb9d31334f14bc5a6bd0d7c3d06094d'; // SRAL
        }
        if (luisKey == '**')
        {
            luisKey = '8d7dadb7520044c59518b5203b75e802';
        }
        

        if (!appName)
        {
            let msg = BlisHelp.CommandHelpString(Commands.CREATEAPP, `You must provide a name for your application.`);
            cb([msg]);
            return;
        }
        if (!luisKey)
        {
            let msg = BlisHelp.CommandHelpString(Commands.CREATEAPP, `You must provide a luisKey for your application.`);
            cb([msg]);
            return;
        }

        try
        {       
            let appId = await this.blisClient.CreateApp(appName, luisKey)

            // Initialize
            Object.assign(userState, new BlisUserState(appId));

            let card = this.MakeHero("Created App", appId, null, {"Help" : Help.NEWAPP});
            cb([card]);
        }
        catch (error) {
            let errMsg = this.ErrorString(error);
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

    /** Delete Action with the given actionId */
    private async DeleteAction(userState : BlisUserState, actionId : string, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Action`);

        if (!actionId)
        {
            let msg = `You must provide the ID of the action to delete.\n\n     ${Commands.DELETEACTION} {app ID}`;
            cb(msg);
            return;
        }

        try
        {        
            // TODO clear savelookup
            await this.blisClient.DeleteAction(userState[UserStates.APP], actionId)
            cb(`Deleted Action ${actionId}`);
        }
        catch (error)
        {
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }

    /** Delete all apps associated with this account */
    private async DeleteAllApps(userState : BlisUserState, address : builder.IAddress, cb : (text) => void) : Promise<void>
    {
        BlisDebug.Log(`Trying to Delete All Applications`);
        this.SendMessage(address, "Deleting apps...");
        try
        {
            // Get app ids
            let appIds = [];
            let json = await this.blisClient.GetApps()
            appIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${appIds.length} apps`);

            for (let appId of appIds){
                let text = await this.blisClient.DeleteApp(userState, appId)
                BlisDebug.Log(`Deleted ${appId} apps`);
            }
            cb("Done");
        }
        catch (error)
        {
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb([errMsg]);
        }
    }

    private async DeleteApp(userState : BlisUserState, appId : string, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Application`);
        if (!appId)
        {
            let msg = BlisHelp.Get(Help.DELETEAPP);
            cb(msg);
            return;
        }

        try
        {       
            await this.blisClient.DeleteApp(userState, appId)
            cb(`Deleted App ${appId}`)
        }
        catch (error) {
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }

    /** Delete Entity with the given entityId */
    private async DeleteEntity(userState : BlisUserState, entityId : string, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Entity`);

        if (!entityId)
        {
            let msg = `You must provide the ID of the entity to delete.\n\n     ${Commands.DELETEENTITY} {app ID}`;
            cb(msg);
            return;
        }

        try
        {        
            // TODO clear savelookup
            await this.blisClient.DeleteEntity(userState[UserStates.APP], entityId)
            cb(`Deleted Entity ${entityId}`);
        }
        catch (error)
        {
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }

    private async DeleteTrainDialog(userState : BlisUserState, dialogId : string, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Training Dialog`);

        if (!dialogId)
        {
            let msg = `You must provide the ID of the dialog to delete.\n\n     ${IntCommands.DELETEDIALOG} {dialogId}`;
            cb(msg);
            return;
        }

        try
        {        
            // TODO clear savelookup
            await this.blisClient.DeleteTrainDialog(userState[UserStates.APP], dialogId)
            cb(`Deleted TrainDialog ${dialogId}`);
        }
        catch (error) {
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
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
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }

    private async ExportApp(userState : BlisUserState, address : builder.IAddress, cb : (text) => void) : Promise<void>
    {
        BlisDebug.Log(`Exporting App`);

        try
        {        
            // Get actions
            let dialogIds = [];
            let blisapp = await this.blisClient.ExportApp(userState[UserStates.APP])
            let msg = JSON.stringify(blisapp);
            if (address.channelId == "emulator")
            {
                cb(msg);
            }
            else
            {
                this.SendAsAttachment(address, msg);
                cb("");
            }
        }
        catch (error) {
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }

    /** Get actions.  Return count of actions */
    private async GetActions(userState : BlisUserState, detail : string, cb : (text) => void) : Promise<number>
    {
        BlisDebug.Log(`Getting actions`);

        try
        {   
            // Get actions
            let actionIds = [];
            let json = await this.blisClient.GetActions(userState[UserStates.APP])
            actionIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${actionIds.length} actions`);

            let textactions = "";
            let apiactions = "";
            for (let actionId of actionIds)
            {
                let action = await this.blisClient.GetAction(userState[UserStates.APP], actionId)

                var memory = new BlisMemory(userState);
                let posstring = memory.EntityNames(action.requiredEntities);
                let negstring = memory.EntityNames(action.negativeEntities);
                let atext = `${action.content}`;
                
                if (posstring.length > 0) {
                    atext += `  ${ActionCommand.REQUIRE}[${posstring}]`;
                }
                if (negstring.length > 0) {
                    atext += `  ${ActionCommand.BLOCK}[${negstring}]`;
                }
                // Show detail if requested
                atext += detail ?  `: _${actionId}_\n\n` : `\n\n`

                if (action.actionType == ActionTypes.API)
                {
                    apiactions += atext;

                    // Create lookup for saveEntity actions
                    if (action.content.startsWith(APICalls.SAVEENTITY))
                    {
                        let name = Action.Split(action.content)[1];
                        memory.AddAPILookup(name, actionId);
                    }
                }
                else if (action.actionType == ActionTypes.TEXT) 
                {
                    textactions += atext;
                }
                BlisDebug.Log(`Action lookup: ${action.content} : ${action.actionType}`);
            }

            let msg = "";
            if (apiactions)
            {   
                msg += "**API Actions**\n\n" + apiactions;
            }
            if (textactions)
            {   
                msg += "**TEXT Actions**\n\n" + textactions;
            }
            if (!msg) {
                msg = "This application contains no actions.";
            }
            cb(msg);
            return actionIds.length;
        }
        catch (error)
        {
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }

    private async GetApps(cb : (text) => void) : Promise<void>
    {
        BlisDebug.Log(`Getting apps`);

        try
        { 
            // Get app ids
            let appIds = [];
            let json = await this.blisClient.GetApps()
            appIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${appIds.length} apps`);

            let msg = "";
            for (let appId of appIds)
            {
                let ajson = await this.blisClient.GetApp(appId)
                let name = ajson['app-name'];
                let id = ajson['model-id'];
                msg += `${name} : ${id}\n\n`;
                BlisDebug.Log(`App lookup: ${name} : ${id}`);
            }

            if (!msg) {
                msg = "This account contains no apps.";
            }
            cb(msg);
        }
        catch (error) {
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }

    private async GetEntities(userState : BlisUserState, detail : string, cb : (text) => void) : Promise<void>
    {
        BlisDebug.Log(`Getting entities`);

        try
        {        
            let entityIds = [];
            let json = await this.blisClient.GetEntities(userState[UserStates.APP])
            entityIds = JSON.parse(json)['ids'];
            BlisDebug.Log(`Found ${entityIds.length} entities`);

            let memory = new BlisMemory(userState);

            if (entityIds.length == 0)
            {
                cb("This app contains no Entities.");
                return;
            }
            let msg = "**Entities**\n\n";
            for (let entityId of entityIds)
            {
                let entity = await this.blisClient.GetEntity(userState[UserStates.APP], entityId)
                msg += `${entity.name}`;

                // Add to entity lookup table
                memory.AddEntityLookup(entity.name, entityId);

                // Show detail if requested
                msg += detail ?  `: _${entityId}_\n\n` : `\n\n`
            }
            if (!msg) {
                msg = "This application contains no entities.";
            }
            cb(msg);
        }
        catch (error) {
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }

    private async GetTrainDialogs(userState : BlisUserState, address : builder.IAddress, searchTerm : string, cb : (text) => void) : Promise<void>
    {
        try 
        {
            let blisApp = await this.blisClient.ExportApp(userState[UserStates.APP]);
            let dialogs = await blisApp.findTrainDialogs(this.blisClient, userState[UserStates.APP], searchTerm);

            if (dialogs.length == 0)
            {
                cb(["No maching dialogs found."]);
                return;
            }
            // Add delete buttons
            let responses = [];
            for (let dialog of dialogs) {
                responses.push(dialog.text);
                responses.push(this.MakeHero(null, dialog.dialogId, null, { "Delete" : `${IntCommands.DELETEDIALOG} ${dialog.dialogId}`}));
            }

            cb(responses);
        }
        catch (error)
        {
            let errMsg = this.ErrorString(error);
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
            let comObj = BlisHelp.CommandHelp(command);
            let msg = `${command} ${comObj.args}\n\n     ${comObj.description}\n\n`;
            if (comObj.examples && comObj.examples.length > 0)
            {
                msg += "For example:\n\n"
                for (let example of comObj.examples)
                {
                    msg += `     ${example}\n\n`;
                }
            }
            return msg;
        }
        let text = "";
        for (let item in Commands)
        {
            let key = Commands[item];
            let comObj = BlisHelp.CommandHelp(key);
            text += `${key} ${comObj.args}\n\n     ${comObj.description}\n\n`;
        }
        return text;
    }

    private async LoadApp(userState : BlisUserState, address : builder.IAddress, appId : string, cb : (text) => void) : Promise<void>
    {
        this.SendMessage(address, "Loading app...");

        try {
            // TODO - temp debug
            if (appId == '*')
            {
                appId = '0241bae4-ebba-45ca-88b2-2543339c4e6d';
            }

            if (!appId)
            {
                let msg = BlisHelp.CommandHelpString(Commands.LOADAPP, `You must provide the ID of the application to load.`);
                cb(msg);
                return;
            }

            // Initialize
            Object.assign(userState, new BlisUserState(appId));

            // Validate appId
            let loadedId = await this.blisClient.GetApp(appId)
            BlisDebug.Log(`Loaded App: ${loadedId}`);

            // Load entities to generate lookup table
            await this.GetEntities(userState, null, (text) =>
            {
                BlisDebug.Log(`Entity lookup generated`);
            }); 

            // Load actions to generate lookup table
            let numActions = await this.GetActions(userState, null, (text) =>
            {
                BlisDebug.Log(`Action lookup generated`);
            }); 

            if (numActions == 0)
            {
                cb("Application loaded.  No Actions found.");
                return;
            }
            // Load or train a new modelId
            let modelId = await this.blisClient.GetModel(userState[UserStates.APP]);
            if (!userState[UserStates.MODEL])
            {        
                BlisDebug.Log(`Training the model...`)    
                modelId = await this.blisClient.TrainModel(userState)
                BlisDebug.Log(`Model trained: ${modelId}`);
            }
            BlisDebug.Log(`Loaded Model: ${modelId}`);
            userState[UserStates.MODEL]  = modelId;

            // Create session
            BlisDebug.Log(`Creating session...`);
            let sessionId = await this.blisClient.StartSession(userState[UserStates.APP])
            BlisDebug.Log(`Stared Session: ${appId}`);
            new BlisMemory(userState).StartSession(sessionId, false);
            cb("Application loaded and Session started.");
        }
        catch (error)
        {
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }

    /** Swap matched entities in swapList */
    private SwapEntities(entityIds : string[], swapList : {})
    {
        if (Object.keys(swapList).length == 0)
        {
            return entityIds;
        }
        let swappedEntities = [];
        for (let entityId in entityIds)
        {
            if (swapList[entityId])
            {
                swappedEntities.push(swapList[entityId]);
            }
            else
            {
                swappedEntities.push(entityId);
            }
        }
        return swappedEntities;
    }
    /** Merge entites */
    private MergeEntities(app1 : BlisApp, app2 : BlisApp) : BlisApp
    {
        // Find duplicate entities, use originals from app1
        let mergedEntities = [];
        let swapList = {};
        for (let entity2 of app2.entities)
        {
            let swap = false;
            for (let entity1 of app1.entities)
            {
                // If entity name is same, use original entity
                if (entity1.name == entity2.name) 
                {
                    if ((entity1.entityType == entity2.entityType) &&
                        (entity2.luisPreName == entity2.luisPreName))
                    {
                        mergedEntities.push(entity1);
                        swapList[entity2.id] = entity1.id;
                        swap = true;
                        break;
                    }
                }
            }
            if (!swap) {
                mergedEntities.push(entity2);
            }
        }
        app2.entities = mergedEntities;

        // Make sure all other entity references are correct
        for (let action of app2.actions)
        {
            // Swap entities
            action.negativeEntities = this.SwapEntities(action.negativeEntities, swapList);
            action.requiredEntities = this.SwapEntities(action.requiredEntities, swapList);
        }
        
        // Now swap entities for training dialogs
        for (let trainDialog of app2.trainDialogs)
        {
            for (let turn of trainDialog.dialog.turns)
            {
                turn.input.entityIds = this.SwapEntities(turn.input.entityIds, swapList);
            }       
        }
        return app2;
    }

    /** Import (and merge) application with given appId */
    private async ImportApp(userState : BlisUserState, address : builder.IAddress, appId : string, cb : (text) => void) : Promise<void>
    {
        this.SendMessage(address, "Importing app...");
        try
        {
            // Get current app
            let currentApp = await this.blisClient.ExportApp(userState[UserStates.APP]);

            // Get imported app
            let mergeApp = await this.blisClient.ExportApp(appId);

            // Merge any duplicate entities
            mergeApp = this.MergeEntities(currentApp, mergeApp);

            // Upload merged app to currentApp
            let finalApp = await this.blisClient.ImportApp(userState[UserStates.APP], mergeApp);

            // reload
            let memory = new BlisMemory(userState);
            this.LoadApp(userState, address, memory.AppId(), (text) => {
                cb(text);
            });
        }
        catch (error)
        {
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(errMsg);
        }
    }

    /** Import application from sent attachment */
    private async ImportAppAttachment(userState : BlisUserState, address : builder.IAddress, attachment : builder.IAttachment, cb : (text) => void) : Promise<void>
    {
        if (attachment.contentType != "text/plain")
        {
            cb("Expected a text file for import.");
            return;
        }

        try 
        {
            var text = await this.ReadFromFile(attachment.contentUrl)

            // Import new training data
            let json = JSON.parse(text);
            let blisApp = deserialize(BlisApp, json);
            let newApp = await this.blisClient.ImportApp(userState[UserStates.APP], json)
            
            // Reload the app
            let memory = new BlisMemory(userState);
            this.LoadApp(userState, address, memory.AppId(), (text) => {
                cb(text);
            });
        }
        catch (error) 
        {
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(text);
        }
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
                let card = this.MakeHero("Teach mode started", subtext, body, null);
                cb([card]);
            }
            else {
                cb([`_Bot started..._`]);
            }
       }
       catch (error) {
           let errMsg = this.ErrorString(error);
           BlisDebug.Error(errMsg);
           userState[UserStates.SESSION] = null;  // Clear the bad session
           cb([errMsg]);
       }
    }

    private SendTyping(address : any)
    {
        let msg = <builder.IMessage>{ type: 'typing'};
        msg.address = address;
        this.bot.send(msg);
    }

    /** Send an out of band message */
    private SendMessage(address : any, content : string | builder.IIsAttachment)
    { 
        let message = new builder.Message()
			.address(address);

        if (typeof content == 'string')
        {
            message.text(content);
        }
        else
        {
            message.addAttachment(content);
        }
         this.bot.send(message);
    }

    /** Send a group of out of band message */
    private SendResponses(address : any, responses : (string|builder.IIsAttachment)[])
    {
        for (let response of responses)
        {
            this.SendMessage(address, response);
        }
    }

    private SendAsAttachment(address : any, content: string)
    {
        var base64 = Buffer.from(content).toString('base64');

        let msg =  new builder.Message();
        (<any>msg).data.address = address;
        let contentType = "text/plain";
        let attachment : builder.IAttachment =  
        {
            contentUrl: util.format('data:%s;base64,%s', contentType, base64),
            contentType: contentType,
            content: content
        }
        msg.addAttachment(attachment);
        this.bot.send(msg);
    }

    public LoadUser(address : builder.IAddress, 
                        cb : (err: Error, state: BlisUserState) => void )
    {
        // TODO handle errors
        BlisUserState.Get(this.bot, address, this.defaultApp, (error, userState, isNew) => {
            if (isNew)
            {                        
                // Attempt to load the application
                this.LoadApp(userState, address, this.defaultApp, (text) => 
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

    private HandleHelp(input : string, address : builder.IAddress, userState : BlisUserState, cb: (error: Error, result: IBlisResult) => void) : void 
    {
        let help = BlisHelp.Get(input);
        this.SendResult(address, userState, cb, [help]);
    }

    private HandleCommand(input : string, address : builder.IAddress, userState : BlisUserState, 
        cb: (responses : (string|builder.IIsAttachment)[], retrain? : boolean) => void) : void {

        let [command, arg, arg2, arg3] = input.split(' ');
        command = command.toLowerCase();

        //---------------------------------------------------
        // Commands allowed at any time
        if (command == Commands.ACTIONS)
        {
            this.GetActions(userState, arg, (text) => {
                cb([text]);
            });
        }
        else if (command == Commands.ADDENTITY)
        {
            this.AddEntity(userState, arg, arg2, arg3, (responses) => {
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
            this.GetEntities(userState, arg, (text) => {
                cb([text]);
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
                this.AddAction(userState, arg, ActionTypes.API, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.ADDTEXTACTION)
            {
                let arg = this.RemoveCommandWord(input);                
                this.AddAction(userState, arg, ActionTypes.TEXT, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.APPS)
            {
                this.GetApps((text) => {
                    cb([text]);
                });
            }
            else if (command == Commands.CREATEAPP)
            {
                this.CreateApp(userState, arg, arg2, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.DELETEALLAPPS)
            {
                this.DeleteAllApps(userState, address, (text) => {
                    cb([text]);
                });
            }
            else if (command == Commands.DELETEACTION)
            {
                this.DeleteAction(userState, arg, (text) => {
                    cb([text]);
                });
            }
            else if (command == Commands.DELETEAPP)
            {
                this.DeleteApp(userState, arg, (text) => {
                    cb( [text]);
                });
            }
            else if (command == Commands.DELETEENTITY)
            {
                this.DeleteEntity(userState, arg, (text) => {
                    cb([text]);
                });
            }
            else if (command == Commands.EXPORTAPP)
            {
                this.ExportApp(userState, address, (text) => {
                    cb([text]);
                });
            }
            else if (command == Commands.IMPORTAPP)
            {
                this.ImportApp(userState, address, arg, (text) => {
                    cb([text]); 
                });
            }
            else if (command == Commands.LOADAPP)
            {
                this.LoadApp(userState, address, arg, (text) => {
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
                this.GetTrainDialogs(userState, address, arg, (text) => {
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
                let card = this.MakeHero("Dialog Trained", null, null, {"Start Bot" : Commands.START, "Teach Bot" : Commands.TEACH, "Add Entities & Actions" : Help.NEWAPP});
                this.EndSession(userState, (text) => {
                    cb([card]);
                });
            }
            else if (command == IntCommands.FORGETTEACH) {
                // TODO: flag to not save training
                let card = this.MakeHero("Dialog Abandoned", null, null, {"Start Bot" : Commands.START, "Teach Bot" : Commands.TEACH, "Add Entities & Actions" : Help.NEWAPP});
                this.EndSession(userState, (text) => {
                    cb([card]);
                });
            }
            else if (command == IntCommands.DONETEACH) {
                let steps = this.TrainStepText(userState);
                let card = this.MakeHero("", "", "Does this look good?", 
                    { "Save" : IntCommands.SAVETEACH , "Abandon" : IntCommands.FORGETTEACH});

                cb([steps, card]);
            }
            else 
            {
                cb([`_In teaching mode. The only valid command is_ ${IntCommands.DONETEACH}`]);
            }
        }
        //-------- Valid not in Teach ------------------//
        else if (command == IntCommands.DELETEDIALOG) {
            this.DeleteTrainDialog(userState, arg, (text) => {
                cb([text]);
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
                    this.SendMessage(address, "Importing application...");
                    this.ImportAppAttachment(userState, address, context.message.attachments[0] ,(text) => {
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

                         // Clear memory of last entities that were detected
                        memory.RememberLastStep(SaveStep.ENTITY, null);

                        if (ttResponse.teachError) {
                            let title = `**ERROR**\n\n`;
                            let body = `Input did not match original text. Let's try again.\n\n`;
                            responses.push(that.MakeHero(title, body, null, null));
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
                                responses.push(`[${suggestedEntity} *]`);
                                let body = "Click Correct if suggested entity is valid or indicate entities in input string"
                                responses.push(that.MakeHero(cardtitle, null, body, { "Correct" : "1", "Help" : Help.PICKENTITY}));
                            }
                            else 
                            {
                                let cardsub = `No new entities found.\n\n`;
                                let cardtext = "Click None if correct or indicate entities in input string"
                                responses.push(that.MakeHero(cardtitle, cardsub, cardtext, { "None" : "1", "Help" : Help.PICKENTITY}));
                            }
                        }
                        else 
                        {
                            let entities = "";
                            for (let i in ttResponse.teachLabelEntities)
                            {
                                let labelEntity = ttResponse.teachLabelEntities[i];
                                let entityName = memory.EntityId2Name(labelEntity.entityId);
                                entities += `[$${entityName}: ${labelEntity.entityValue}]    _Score: ${labelEntity.score.toFixed(3)}_\n\n`;
                            }
                            responses.push(entities);
                            memory.RememberLastStep(SaveStep.ENTITY, entities);
                            let body = "Click Correct if entities are valid or indicate entities in input string"
                            responses.push(that.MakeHero(cardtitle, null, body, { "Correct" : "1", "Help" : Help.PICKENTITY}));
                        }
                    }

                    /** Process Label Entity Step */
                    let ProcessLabelAction = function(ttResponse : TakeTurnResponse, responses: (string | builder.IIsAttachment)[]) : void
                    {
                        BlisDebug.Verbose("ProcessLabelEntity");

                        // If app contains no entities, LabelEntity skip is stepped, so input must still be saved
                        if (userInput) 
                        {
                            memory.RememberTrainStep(SaveStep.INPUT, userInput);
                            memory.RememberLastStep(SaveStep.INPUT,userInput);
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
                        responses.push(that.MakeHero(title, null, body, null));

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
                                    msg += `(${1+Number(i)}) ${labelAction.content} _(${labelAction.actionType.toUpperCase()})_ Score: ${labelAction.score.toFixed(3)}\n\n`;
                                }
                                else
                                {
                                    msg += `_(${1+Number(i)}) ${labelAction.content}_ _(${labelAction.actionType.toUpperCase()})_ DISQUALIFIED\n\n`;

                                }
                            }
                            responses.push(msg);
                            responses.push(that.MakeHero(" ", null, 'Select Action by number or enter a new one', { "Help" : Help.ADDACTION}));
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
                            let outText = that.blisCallback(output, memory);
                            
                            if (inTeach)
                            {
                                memory.RememberTrainStep(SaveStep.RESPONSE, outText);
                                responses.push(that.MakeHero('Trained Response:', outText + "\n\n", "Type next user input for this Dialog or" , 
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

                    this.SendTyping(address);
                    BlisDebug.SetAddress(address);   
                    let userInput = context.message.text.trim();

                    // Handle admin commands
                    if (userInput.startsWith('!')) {

                        this.HandleCommand(userInput, address, userState, 
                            (responses : (string|builder.IIsAttachment)[], retrain: boolean) => 
                            {
                                // Some commands require retraining if user is in teach mode
                                if (inTeach && retrain) 
                                {
                                    // Send command response out of band
                                    responses.push("Retraining...");
                                    this.SendResponses(address, responses);

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
            let errMsg = this.ErrorString(error);
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
            let response = this.ErrorResponse("No Application has been loaded.\n\nTry _!createapp_, _!loadapp_ or _!help_ for more info.");
            cb(response);
            return;
        }
        else if (!userState[UserStates.MODEL]  && !userState[UserStates.TEACH] )
        {
            let response = this.ErrorResponse("This application needs to be trained first.\n\nTry _!teach, _!traindialogs_ or _!help_ for more info.");
            cb(response);
            return;
        }
        else if (!userState[UserStates.SESSION] )
        {
            let response = this.ErrorResponse("Start the bot first with _!start_ or train more with _!teach_");
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
            requestBody = payload.ToJSON();
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
                if (this.luisCallback)
                {
                    takeTurnRequest = this.luisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                }
                else
                {
                    takeTurnRequest = this.DefaultLUCallback(takeTurnResponse.originalText, takeTurnResponse.entities);
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
                        memory.RememberTrainStep(SaveStep.API, `${apiName} ${arg}`);
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
            let errMsg = this.ErrorString(error);
            BlisDebug.Error(errMsg);
            cb(null, errMsg);
        }
    }

    //====================================================
    // Built in API GetActions
    //====================================================
    private SaveEntityCB(memory : BlisMemory, arg : string) : TakeTurnRequest
    {
        let lastInput = memory.LastStep(SaveStep.INPUT);
        let entityId = memory.EntityName2Id(arg);
        memory.RememberEntity(entityId, lastInput);
        let entityIds = memory.EntityIds();
        return new TakeTurnRequest({entities: entityIds});
    }
    //====================================================

    private ErrorResponse(text : string) : TakeTurnResponse
    {
        return new TakeTurnResponse({ mode : TakeTurnModes.ERROR, error: text} );
    }

    /** Remove first work (i.e. command) from command string */
    private RemoveCommandWord(text : string) : string 
    {
       let firstSpace = text.indexOf(' ');
       return (firstSpace > 0) ? text.slice(firstSpace+1) : ""; 
    }

    private MakeHero(title : string, subtitle : string, text : string, buttons : {}) : builder.HeroCard
    {
        var buttonList : builder.CardAction[] = [];
        for (var message in buttons)
        {
            var postback = buttons[message];
            buttonList.push(builder.CardAction.postBack(null, postback, message));
        }

        var card = new builder.HeroCard()
						.title(title)
						.subtitle(subtitle)
						.text(text)		
						.buttons(buttonList);	
		
        return card;
    }

    private DefaultLUCallback(text: string, entities : LuisEntity[]) : TakeTurnRequest
    {
        return new TakeTurnRequest();  // TODO
    }

    /** Handle that catch clauses can be any type */
    private ErrorString(error) : string
    {
        if (typeof error == 'string')
        {
            return error;
        }
        else if (error.message)
        {
            return error.message;
        }
        return JSON.stringify(error);
    }

    // TODO is this used anywhere?
    private DefaultBlisCallback(text: string) : string
    {
        return text;
        /*
        let words = [];
        let tokens = text.split(' ').forEach((item) => 
        {
            if (item.startsWith('$')) 
            {
                if (this.entity_name2id[item])
                {
                    let entityId = this.entity_name2id[item];
                    let entityValue = this.entityValues[item];
                    words.push(entityValue);
                }
                else if (this.entityValues[item])
                {
                    let entityValue = this.entityValues[item];
                    words.push(entityValue);
                }
                else
                {
                    BlisDebug.Log(`Found entity reference ${item} but no value for that entity observed`);
                }
            }
            else
            {
                words.push(item);
            }
        });
        return words.join(' ');
        */
    }
}
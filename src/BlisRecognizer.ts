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
import { BlisUploader} from './BlisUploader';
import { LuisEntity } from './Model/LuisEntity';
import { Action } from './Model/Action';
import { LabelEntity } from './Model/LabelEntity';
import { LabelAction } from './Model/LabelAction';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, Commands, IntCommands, ActionTypes, SaveStep, APICalls } from './Model/Consts';
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
            BlisDebug.Log(`ERROR: ${error}`);
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

       let memory = new BlisMemory(userState);

        if (!content)
        {   //TODO
            let msg = `You must provide the ID of the action to delete.\n\n     ${Commands.DELETEACTION} {app ID}`;
            cb([msg]);
            return;
        }
        if (!actionType)
        {   //TODO
            let msg = `You must provide the ID of the action to delete.\n\n     ${Commands.DELETEACTION} {app ID}`;
            cb([msg]);
            return;
        }

        // Strip action of any positive and negative entities
        let firstNeg = content.indexOf('--');
        let firstPos = content.indexOf('++');
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

        // Extract negative and positive entities
        let negIds = [];
        let posIds = [];
        let negNames = [];
        let posNames = [];
        let saveName = null;
        let saveId = null;
        let words = Action.Split(actionText);
        for (let word of words)
        {
            // Add requirement for entity when used for substitution
            if (word.startsWith('$'))
            {
                let posName = word.slice(1);
                if (posNames.indexOf(posName) < 0)
                {
                    let posID = memory.EntityId2Name(posName);
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
            else if (word.startsWith('!'))
            {
                // Only allow one suggested entity
                if (saveName) 
                {
                    cb([`Only one entity suggestion (denoted by "!_ENTITY_") allowed per Action`]);
                    return;
                } 
                if (actionType == ActionTypes.API)
                {
                    cb([`Suggested entities can't be added to API Actions`]);
                    return;
                }
                saveName = word.slice(1);
                saveId = memory.EntityId2Name(saveName);
                if (!saveId)
                {
                    cb([`Entity $${saveName} not found.`]);
                    return;
                }
                // Add to negative entities
                if (negNames.indexOf(saveName) < 0)
                {
                    negIds.push(saveId);
                    negNames.push(saveName);
                }
            }
            else if (word.startsWith('--'))
            {
                let negName = word.slice(2);
                let negID = memory.EntityId2Name(negName);
                if (negID) {
                    negIds.push(negID);
                    negNames.push(negName);
                }  
                else
                {
                    cb([`Entity $${negName} not found.`]);
                    return;
                }
            }
            else if (word.startsWith('++')) {
                let posName = word.slice(2);
                if (posNames.indexOf(posName) < 0)
                {
                    let posID = memory.EntityId2Name(posName);
                    if (posID) {
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
        }

        // If suggested entity exists create API call for saving item
        if (saveId) 
        {
            // Make sure it hasn't aleady been added
            let saveAPI = memory.APILookup(saveName);
            if (!saveAPI) {
                let apiCall = `${APICalls.SAVEENTITY} ${saveName}`;
                // TODO - consider sending neg entity if entity is already set...
                await this.blisClient.AddAction(userState, apiCall, ActionTypes.API, [], [saveId])
                    .then((actionId) => 
                    {
                        // Remember save API for later
                        memory.AddAPILookup(saveName, actionId);
                    })
                    .catch((error) => 
                    {
                        cb([error]);
                        return;
                    });
            }
        }

        await this.blisClient.AddAction(userState, actionText, actionType, posIds, negIds)
            .then((actionId) => 
                {
                    let substr = "";
                    if (posIds.length > 0) 
                    {
                        substr += `++[${posNames.toLocaleString()}]\n\n`;
                    }
                    if (negIds.length > 0) 
                    {
                        substr += `--[${negNames.toLocaleString()}]`;
                    }
                    let card = this.MakeHero("Created Action", /* actionId + "\n\n" +*/ substr + "\n\n", actionText, null);
                    cb([card])
        
                })
            .catch((text) => cb([text]));
    }

    private async AddEntity(userState : BlisUserState, entityName : string, entityType : string, prebuiltName : string, cb : (responses : (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Add Entity ${entityName}`);

        if (!entityName)
        {
            let msg = `You must provide an entity name for the entity to create.\n\n     ${Commands.ADDENTITY} {entitiyName} {LUIS | LOCAL} {prebuiltName?}`;
            cb([msg]);
            return;
        }
        if (!entityType)
        {
            let msg = `You must provide an entity type for the entity to create.\n\n     ${Commands.ADDENTITY} {entitiyName} {LUIS | LOCAL} {prebuiltName?}`;
            cb([msg]);
            return;
        }
        entityType = entityType.toUpperCase();
        if (entityType != EntityTypes.LOCAL && entityType != EntityTypes.LUIS)
        {
            let msg = `Entity type must be 'LOCAL' or 'LUIS'\n\n     ${Commands.ADDENTITY} {entitiyName} {LUIS | LOCAL} {prebuiltName?}`;
            cb([msg]);
            return;
        }
        if (entityType == EntityTypes.LOCAL && prebuiltName != null)
        {
            let msg = `LOCAL entities shouldn't include a prebuilt name\n\n     ${Commands.ADDENTITY} {entitiyName} {LUIS | LOCAL} {prebuiltName?}`;
            cb([msg]);
            return;
        }

       await this.blisClient.AddEntity(userState, entityName, entityType, prebuiltName)
        .then((entityId) => 
        {
            let memory = new BlisMemory(userState);
            memory.AddEntityLookup(entityName, entityId);
            let card = this.MakeHero("Created Entity", entityId, entityName, null);
            cb([card]); 
        })
        .catch((text) => 
            cb([text])
        );
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
            let msg = `You must provide a name for your application.\n\n     ${Commands.CREATEAPP} {app Name} {luis key}`;
            cb([msg]);
            return;
        }
        if (!luisKey)
        {
            let msg = `You must provide a luisKey for your application.\n\n     ${Commands.CREATEAPP} {app Name} {luis key}`;
            cb([msg]);
            return;
        }

        await this.blisClient.CreateApp(userState, appName, luisKey)
            .then((appId) => 
            {
                let card = this.MakeHero("Created App", appId, null, {"Help" : Help.NEWAPP});
                cb([card]);
            })
            .catch((text) => cb([text]));
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

    private async DeleteAction(userState : BlisUserState, actionId : string, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Action`);

        if (!actionId)
        {
            let msg = `You must provide the ID of the action to delete.\n\n     ${Commands.DELETEACTION} {app ID}`;
            cb(msg);
            return;
        }

        // TODO clear savelookup
       await this.blisClient.DeleteAction(userState, actionId)
        .then((text) => cb(`Deleted Action ${actionId}`))
        .catch((text) => cb(text));
    }

    private async DeleteAllApps(userState : BlisUserState, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete All Applications`);

        // Get app ids
        let appIds = [];
        let fail = null;
        await this.blisClient.GetApps()
            .then((json) => {
                appIds = JSON.parse(json)['ids'];
                BlisDebug.Log(`Found ${appIds.length} apps`);
            })
            .catch(error => fail = error);

        if (fail) 
        {
            BlisDebug.Log(fail);
            return fail;
        }

        for (let appId of appIds){
            await this.blisClient.DeleteApp(userState, appId)
            .then((text) => BlisDebug.Log(`Deleted ${appId} apps`))
            .catch((text) => BlisDebug.Log(`Failed to delete ${appId}`));
        }
        cb("Done");
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

       await this.blisClient.DeleteApp(userState, appId)
        .then((text) => 
        {
            cb(`Deleted App ${appId}`)
        })
        .catch((text) => cb(text));
    }

    private async EndSession(userState : BlisUserState, cb : (text) => void) : Promise<void>
    {
        // Ending teaching session
        await this.blisClient.EndSession(userState)
        .then(async (sessionId) => {
            // Update the model
            await this.blisClient.GetModel(userState)
            .then((text) => {
                cb(sessionId)
            })
            .catch((error) => 
            {
                BlisDebug.Log(error);
                cb(error)
            });
        })
        .catch((error) => 
        {
            BlisDebug.Log(error);
            cb(error)
        });
    }

    private async ExportApp(userState : BlisUserState, address : builder.IAddress, cb : (text) => void) : Promise<void>
    {
        BlisDebug.Log(`Exporting App`);

        // Get actions
        let dialogIds = [];
        let fail = null;
        await this.blisClient.ExportApp(userState)
            .then((blisapp) => {
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
            })
            .catch(error => cb(error));
    }

    private async GetActions(userState : BlisUserState, detail : string, cb : (text) => void) : Promise<void>
    {
        BlisDebug.Log(`Getting actions`);

        // Get actions
        let actionIds = [];
        let fail = null;
        await this.blisClient.GetActions(userState)
            .then((json) => {
                actionIds = JSON.parse(json)['ids'];
                BlisDebug.Log(`Found ${actionIds.length} actions`);
            })
            .catch(error => fail = error);

        if (fail) 
        {
            BlisDebug.Log(fail);
            return fail;
        }

        let textactions = "";
        let apiactions = "";
        for (let actionId of actionIds)
        {
            await this.blisClient.GetAction(userState, actionId)
                .then((action : Action) => {
                    var memory = new BlisMemory(userState);
                    let posstring = memory.EntityNames(action.requiredEntities);
                    let negstring = memory.EntityNames(action.negativeEntities);
                    let atext = `${action.content}`;
                    
                    if (posstring.length > 0) {
                        atext += `  ++[${posstring}]`;
                    }
                    if (negstring.length > 0) {
                        atext += `  --[${negstring}]`;
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
                })
                .catch(error => fail = error); 
        }
        if (fail) 
        {
            BlisDebug.Log(fail);
            return fail;
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
    }

    private async GetApps(cb : (text) => void) : Promise<void>
    {
        BlisDebug.Log(`Getting apps`);

        // Get app ids
        let appIds = [];
        let fail = null;
        await this.blisClient.GetApps()
            .then((json) => {
                appIds = JSON.parse(json)['ids'];
                BlisDebug.Log(`Found ${appIds.length} apps`);
            })
            .catch(error => fail = error);

        if (fail) 
        {
            BlisDebug.Log(fail);
            return fail;
        }

        let msg = "";
        for (let appId of appIds)
        {
            await this.blisClient.GetApp(appId)
                .then((json) => {
                    let name = json['app-name'];
                    let id = json['model-id'];
                    msg += `${name} : ${id}\n\n`;
                    BlisDebug.Log(`App lookup: ${name} : ${id}`);
                })
                .catch(error => fail = error); 
        }
        if (fail) 
        {
            BlisDebug.Log(fail);
            return fail;
        }
        if (!msg) {
            msg = "This account contains no apps.";
        }
        cb(msg);
    }

    private async GetEntities(userState : BlisUserState, detail : string, cb : (text) => void) : Promise<void>
    {
        BlisDebug.Log(`Getting entities`);

        let entityIds = [];
        let fail = null;
        await this.blisClient.GetEntities(userState)
            .then((json) => {
                entityIds = JSON.parse(json)['ids'];
                BlisDebug.Log(`Found ${entityIds.length} entities`);
            })
            .catch(error => fail = error); 

        if (fail) 
        {
            BlisDebug.Log(fail);
            return fail;
        }

        let memory = new BlisMemory(userState);
        let msg = "**Entities**\n\n";
        for (let entityId of entityIds)
        {
            await this.blisClient.GetEntity(userState, entityId)
                .then((entity) => {
     
                    // Add to entity lookup table
                    memory.AddEntityLookup(entity.name, entityId);

                    BlisDebug.Log(`Entity lookup: ${entityId} : ${entity.name}`);
                    if (detail == 'Y') 
                    {
                        msg += `$${entity.name} : ${entityId}\n\n`;
                    } 
                    else
                    {
                        msg += `$${entity.name}\n\n`; 
                    }
                })
                .catch(error => fail = error); 
        }
        if (fail) 
        {
            BlisDebug.Log(fail);
            return cb(fail);
        }
        if (!msg) {
            msg = "This application contains no entities.";
        }
        cb(msg);
    }

    private async GetTrainDialogs(userState : BlisUserState, address : builder.IAddress, cb : (text) => void) : Promise<void>
    {
        await this.blisClient.ExportApp(userState)
            .then((blisApp) => {
               
                // Xform into text
                if (address.channelId == "emulator")
                {
                    cb(JSON.stringify(blisApp));
                }
                else
                {
                    this.SendAsAttachment(address, JSON.stringify(blisApp));
                    cb("");
                }
            })
            .catch(error => cb(error));
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

    private async LoadApp(userState : BlisUserState, appId : string, cb : (text) => void) : Promise<void>
    {
        BlisDebug.Log(`Trying to load Application ${appId}`);

        // TODO - temp debug
        if (appId == '*')
        {
            appId = '0241bae4-ebba-45ca-88b2-2543339c4e6d';
        }

        if (!appId)
        {
            let msg = `You must provide the ID of the application to load.\n\n     !loadapp {app ID}`;
            cb(msg);
            return;
        }

        // Initialize
        BlisUserState.InitState(appId, userState);
        let fail = null;

        // Validate appId
        await this.blisClient.GetApp(appId)
            .then((appId) => {
                BlisDebug.Log(`Found App: ${appId}`);
            })
            .catch(error => fail = error); 

        if (fail) 
        {
            BlisDebug.Log(fail);
            cb(fail);
            return;
        }

        // Validate modelId
        await this.blisClient.GetModel(userState)
            .then((appId) => {
                BlisDebug.Log(`Found Model: ${appId}`);
            })
            .catch(error => fail = error); 

        if (fail) 
        {
            BlisDebug.Log(fail);
            cb(fail);
            return;
        }

        // Train the model if needed
        if (!userState[UserStates.MODEL])
        {        
            BlisDebug.Log(`Training the model...`)    
            await this.blisClient.TrainModel(userState)
            .then((text) => BlisDebug.Log(`Model trained: ${text}`))
            .catch(error => fail = error); 
        }

        if (fail) 
        {
            BlisDebug.Log(fail);
            cb(fail);
            return;
        }

        // Load entities to generate lookup table
        await this.GetEntities(userState, null, (text) =>
        {
           BlisDebug.Log(`Entity lookup generated`);
        }); 

        if (fail) 
        {
            BlisDebug.Log(fail);
            cb(fail);
            return;
        }

        // Load actions to generate lookup table
        await this.GetActions(userState, null, (text) =>
        {
           BlisDebug.Log(`Action lookup generated`);
        }); 

        if (fail) 
        {
            BlisDebug.Log(fail);
            cb(fail);
            return;
        }

        // Create session
        BlisDebug.Log(`Creating session...`);
        let sessionId = await this.blisClient.StartSession(userState)
        .then(sessionId => {
            BlisDebug.Log(`Stared Session: ${appId}`);
            cb("Application loaded and Session started.");
        })
        .catch(error => cb(error));
    }

    private async ImportApp(userState : BlisUserState, attachment : builder.IAttachment, cb : (text) => void) : Promise<void>
    {
        if (attachment.contentType != "text/plain")
        {
            cb("Expected a text file for import.");
            return;
        }

        var text = await this.ReadFromFile(attachment.contentUrl)
            .then((text:string) => {
                try 
                { 
                    // Import new training data
                    let json = JSON.parse(text);
                    this.blisClient.ImportApp(userState, json)
                        .then(blisapp => 
                        {
                            // Reload the app
                            let memory = new BlisMemory(userState);
                            this.LoadApp(userState, memory.AppId(), (text) => {
                                cb(text);
                            });
                        })
                        .catch(error => cb(`Failed to Import App: ${error}`));
                }
                catch (error)
                {
                    cb(`Failed to Import App: ${error}`);
                }
            })
            .catch((text) => cb(text));
    }

    private async NewSession(userState : BlisUserState, teach : boolean, cb : (results : (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to create new session, Teach = ${teach}`);

       // Close any existing session
       await this.blisClient.EndSession(userState)
       .then(sessionId => BlisDebug.Log(`Ended session ${sessionId}`))
       .catch(error  => BlisDebug.Log(`${error}`));
       
       await this.blisClient.StartSession(userState, teach)
        .then((sessionId) => 
        {
            BlisDebug.Log(`Started session ${sessionId}`)   
            if (teach)
            {
                let card = this.MakeHero("Teach mode started", null, "Provide your first input", null);
                cb([card]);
            }
            else {
                cb([`_Bot started..._`]);
            }
        })
        .catch((text) => cb([text]));
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
                this.LoadApp(userState, this.defaultApp, (text) => 
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
        // Commands allowed both in TEACH and non-TEACH mode
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
        else if (command == Commands.ENTITIES)
        {
            this.GetEntities(userState, arg, (text) => {
                cb([text]);
            });
        }
        else if (userState[UserStates.TEACH] && (command != Commands.DUMP) && (command != "!debug")  && (command != Commands.TEACH)) {
           cb([`_Command not valid while in Teach mode_`]);
        }
        //---------------------------------------------------
        // Commands only allowed in non-TEACH mode
        else {
            if (command == Commands.ADDAPIACTION)
            {
                let firstSpace = input.indexOf(' ');
                let start = input.slice(firstSpace+1);
                this.AddAction(userState, start, ActionTypes.API, (responses) => {
                    cb(responses);
                });
            }
            else if (command == Commands.ADDTEXTACTION)
            {
                let firstSpace = input.indexOf(' ');
                let start = input.slice(firstSpace+1);
                this.AddAction(userState, start, ActionTypes.TEXT, (responses) => {
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
                this.DeleteAllApps(userState, (text) => {
                    cb([text]);
                });
            }
            else if (command == Commands.DELETEACTION)
            {
                this.DeleteAction(userState, arg, (text) => {
                    cb([text]);
                });
            }
            else if (command == IntCommands.DONETEACH)
            {
                cb([`_I wasn't in teach mode. Type _${Commands.TEACH}_ to begin teaching_`]);
            }
            else if (command == Commands.DELETEAPP)
            {
                this.DeleteApp(userState, arg, (text) => {
                    cb( [text]);
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
            else if (command == Commands.EXPORTAPP)
            {
                this.ExportApp(userState, address, (text) => {
                    cb([text]);
                });
            }
            else if (command == Commands.HELP)
            {
                cb([this.Help(arg)]);
            }
            else if (command == Commands.LOADAPP)
            {
                this.LoadApp(userState, arg, (text) => {
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

                if (memory.HasEntities()) 
                {
                    memory.ClearTrainSteps();
                    this.NewSession(userState, true, (results) => {
                        cb(results);
                    });
                }
                else 
                {
                    let card = this.MakeHero("", "", "First define some Entities", {"Help" : Help.NEWAPP});
                    cb([card]);
                }
            }
            else if (command == Commands.TRAINDIALOGS)
            {
                this.GetTrainDialogs(userState, address, (text) => {
                    cb([text]);
                });
            }
            else 
            {
                let text = "_Not a valid command._\n\n\n\n" + this.Help(null);
                cb([text]);
            }
        }
    }

    private HandleIntCommand(input : string, address : builder.IAddress, userState : BlisUserState, cb: (error: Error, result: IBlisResult) => void) : void 
    {
        let [command, arg, arg2, arg3] = input.split(' ');
        command = command.toLowerCase();

        if (userState[UserStates.TEACH]) {
            if (command == IntCommands.SAVETEACH) {
                let card = this.MakeHero("Dialog Trained", null, null, {"Start Bot" : Commands.START, "Teach Bot" : Commands.TEACH, "Add Entities & Actions" : Help.NEWAPP});
                this.EndSession(userState, (text) => {
                    this.SendResult(address, userState, cb, [card]);
                });
            }
            else if (command == IntCommands.FORGETTEACH) {
                // TODO: flag to not save training
                let card = this.MakeHero("Dialog Abandoned", null, null, {"Start Bot" : Commands.START, "Teach Bot" : Commands.TEACH, "Add Entities & Actions" : Help.NEWAPP});
                this.EndSession(userState, (text) => {
                    this.SendResult(address, userState, cb, [card]);
                });
            }
            else if (command == IntCommands.DONETEACH) {

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
                let card = this.MakeHero("", "", "Does this look good?", 
                    { "Save" : IntCommands.SAVETEACH , "Abandon" : IntCommands.FORGETTEACH});

                this.SendResult(address, userState, cb, [msg, card]);
            }
            else 
            {
                this.SendResult(address, userState, cb, [`_In teaching mode. The only valid command is_ ${IntCommands.DONETEACH}`]);
            }
        }
        else 
        {
                let text = "_Not a valid command._\n\n\n\n" + this.Help(null);
                this.SendResult(address, userState, cb, [text]);
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
                    this.ImportApp(userState, context.message.attachments[0] ,(text) => {
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
                                let entityType = memory.EntityId2Name(labelEntity.entityId);
                                entities += `[$${entityType}: ${labelEntity.entityValue}]    _Score: ${labelEntity.score.toFixed(3)}_\n\n`;
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
                        // If a SuggestedEntity (i.e. !entity) was in previous bot response, the entity wasn't already assigned
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

                    let TakeTurnCallback = function(ttResponse : TakeTurnResponse) : void 
                    { 
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
                        that.SendResult(address, userState, cb, responses);
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
                                    this.blisClient.Retrain(userState)
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
                        this.HandleIntCommand(userInput, address, userState, cb);
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
        catch (Error)
        {
            cb(Error, null);
        }
    }

    public async TakeTurn(userState : BlisUserState, payload : string | TakeTurnRequest,
            cb: (response : TakeTurnResponse) => void) : Promise<void>
        {
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
            let response = this.ErrorResponse("Start the bot first with _!start_ or train more with _!teach_.");
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

        await this.blisClient.SendTurnRequest(userState, requestBody)
        .then(async (takeTurnResponse) => {
            BlisDebug.LogObject(takeTurnResponse);

            // Check that expected mode matches
            if (!takeTurnResponse.mode || expectedNextModes.indexOf(takeTurnResponse.mode) < 0)
            {
                var response = new TakeTurnResponse({ mode : TakeTurnModes.ERROR, error: `Unexpected mode ${takeTurnResponse.mode}`} );
                cb(response);
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
            }

            // ACTION
            else if (takeTurnResponse.mode == TakeTurnModes.ACTION)
            {
                let action = takeTurnResponse.actions[0];
                
                if (action.actionType == ActionTypes.TEXT)
                {
                    cb(takeTurnResponse);
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
                        BlisDebug.Log(`{${apiName} ${arg}}`);
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
        })
        .catch((text) => {
            var response = this.ErrorResponse(text);
            cb(response);
        });
    }

    //====================================================
    // Built in API GetActions
    //====================================================
    private SaveEntityCB(memory : BlisMemory, arg : string) : TakeTurnRequest
    {
        let lastInput = memory.LastStep(SaveStep.INPUT);
        let entityId = memory.EntityId2Name(arg);
        memory.RememberEntity(entityId, lastInput);
        let entityIds = memory.EntityIds();
        return new TakeTurnRequest({entities: entityIds});
    }
    //====================================================

    private ErrorResponse(text : string) : TakeTurnResponse
    {
        return new TakeTurnResponse({ mode : TakeTurnModes.ERROR, error: text} );
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

/*
  private HandleCommand(input : string, address : builder.IAddress, userState : BlisUserState, 
        cb: (error: Error, result: IBlisResult) => void) : void {
            
        let [command, arg, arg2, arg3] = input.split(' ');
        command = command.toLowerCase();

        // Commands allowed both in TEACH and non-TEACH mode
        if (command == Commands.ADDENTITY)
        {
            this.AddEntity(userState, arg, arg2, arg3, (responses) => {
                if (cb)
                {
                    this.SendResult(address, userState, cb, responses);
                }
                // If I'm in teach mode only return error
                else if (teachcb)
                {
                    let error = null;
                    if (typeof responses[0] == 'string')
                    {
                        error = responses[0];
                    }
                    teachcb(error);
                }
            });
        }
        else if (userState[UserStates.TEACH] && (command != Commands.DUMP) && (command != "!debug")  && (command != Commands.TEACH)) {
           this.SendResult(address, userState, cb, [`_Command not valid while in Teach mode_`]);
        }
        else {
            if (command == Commands.ACTIONS)
            {
                this.GetActions(userState, arg, (text) => {
                    this.SendResult(address, userState, cb, [text]);
                });
            }
            else if (command == Commands.ADDAPIACTION)
            {
                let firstSpace = input.indexOf(' ');
                let start = input.slice(firstSpace+1);
                this.AddAction(userState, start, ActionTypes.API, (responses) => {
                    this.SendResult(address, userState, cb, responses);
                });
            }
            else if (command == Commands.ADDTEXTACTION)
            {
                let firstSpace = input.indexOf(' ');
                let start = input.slice(firstSpace+1);
                this.AddAction(userState, start, ActionTypes.TEXT, (responses) => {
                    this.SendResult(address, userState, cb, responses);
                });
            }
            else if (command == Commands.APPS)
            {
                this.GetApps((text) => {
                    this.SendResult(address, userState, cb, [text]);
                });
            }
            else if (command == Commands.CREATEAPP)
            {
                this.CreateApp(userState, arg, arg2, (responses) => {
                    this.SendResult(address, userState, cb, responses);
                });
            }
            else if (command == Commands.DELETEALLAPPS)
            {
                this.DeleteAllApps(userState, (text) => {
                    this.SendResult(address, userState, cb, [text]);
                });
            }
            else if (command == Commands.DELETEACTION)
            {
                this.DeleteAction(userState, arg, (text) => {
                    this.SendResult(address, userState, cb, [text]);
                });
            }
            else if (command == IntCommands.DONETEACH)
            {
                this.SendResult(address, userState, cb, [`_I wasn't in teach mode. Type _${Commands.TEACH}_ to begin teaching_`]);
            }
            else if (command == Commands.DELETEAPP)
            {
                this.DeleteApp(userState, arg, (text) => {
                    this.SendResult(address, userState, cb, [text]);
                });
            }
            else if (command == Commands.DEBUG)
            {
                userState[UserStates.DEBUG] = !userState[UserStates.DEBUG];
                BlisDebug.enabled = userState[UserStates.DEBUG];
                this.SendResult(address, userState, cb, ["Debug " + (BlisDebug.enabled ? "Enabled" : "Disabled")]);
            }
            else if (command == Commands.DEBUGHELP)
            {
                this.SendResult(address, userState, cb, [this.DebugHelp()]);
            }
            else if (command == Commands.DUMP)
            {
                let memory = new BlisMemory(userState);
                this.SendResult(address, userState, cb, [memory.Dump()]);
            }
            else if (command == Commands.ENTITIES)
            {
                this.GetEntities(userState, arg, (text) => {
                    this.SendResult(address, userState, cb, [text]);
                });
            }
            else if (command == Commands.EXPORTAPP)
            {
                this.ExportApp(userState, address, (text) => {
                    this.SendResult(address, userState, cb, [text]);
                });
            }
            else if (command == Commands.HELP)
            {
                this.SendResult(address, userState, cb, [this.Help(arg)]);
            }
            else if (command == Commands.LOADAPP)
            {
                this.LoadApp(userState, arg, (text) => {
                    this.SendResult(address, userState, cb, [text]);
                });
            }
            else if (command == Commands.START)
            {
                this.NewSession(userState, false, (responses) => {
                    this.SendResult(address, userState, cb, responses);
                });
            }
            else if (command == Commands.TEACH)
            {
                let memory = new BlisMemory(userState);

                if (memory.HasEntities()) 
                {
                    memory.ClearTrainSteps();
                    this.NewSession(userState, true, (results) => {
                        this.SendResult(address, userState, cb, results);
                    });
                }
                else 
                {
                    let card = this.MakeHero("", "", "First define some Entities", {"Help" : Help.NEWAPP});
                    this.SendResult(address, userState, cb, [card]);
                }
            }
            else if (command == Commands.TRAINDIALOGS)
            {
                this.GetTrainDialogs(userState, address, (text) => {
                    this.SendResult(address, userState, cb, [text]);
                });
            }
            else 
            {
                let text = "_Not a valid command._\n\n\n\n" + this.Help(null);
                this.SendResult(address, userState, cb, [text]);
            }
        }
    }
*/
import * as builder from 'botbuilder';
import * as request from 'request';
import * as util from 'util';
import { deserialize } from 'json-typescript-mapper';
import { TakeTurnRequest } from './Model/TakeTurnRequest'
import { SnippetList, Snippet } from './Model/SnippetList'
import { TrainDialogSNP, InputSNP, TurnSNP, AltTextSNP } from './Model/TrainDialogSNP'
import { BlisClient } from './BlisClient';
import { BlisMemory } from './BlisMemory';
import { BlisDebug} from './BlisDebug';
import { BlisUserState} from './BlisUserState';
import { BlisUploader} from './BlisUploader';
import { LuisEntity } from './Model/LuisEntity';
import { Action } from './Model/Action';
import { LabelEntity } from './Model/LabelEntity';
import { LabelAction } from './Model/LabelAction';
import { TakeTurnModes, EntityTypes, UserStates, TeachStep, Commands, IntCommands, ActionTypes, SaveStep } from './Model/Consts';
import { BlisHelp, Help } from './Model/Help';
import { TakeTurnResponse } from './Model/TakeTurnResponse'

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
    
    constructor(private bot : builder.UniversalBot, options: IBlisOptions){
        this.init(options);
        BlisDebug.InitLogger(bot);
    }

    private async init(options: IBlisOptions) {
        try {
            BlisDebug.Log("Creating client...");
            this.blisClient = new BlisClient(options.serviceUri, options.user, options.secret, options.luisCallback, options.apiCallbacks);
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
                request.get(url, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body.message);
                    }
                    else {
                        resolve(body);
                    }

                });
            }
        )
    }

    private async AddAction(userState : BlisUserState, content : string, actionType : string, cb : (responses : (string | builder.IIsAttachment)[]) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Action`);

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
        let words = content.split(/[\s,:.?]+/);
        for (let word of words)
        {
            // Add requirement for entity when used for substitution
            if (word.startsWith('$'))
            {
                let posName = word.slice(1);
                if (posNames.indexOf(posName) < 0)
                {
                    let posID = memory.EntityId(posName);
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
            else if (word.startsWith('--'))
            {
                let negName = word.slice(2);
                let negID = memory.EntityId(negName);
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
                    let posID = memory.EntityId(posName);
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
        .catch((text) => cb([text]));
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
                .then((json) => {
                    let entityName = JSON.parse(json)['name'];
                    
                    // Add to entity lookup table
                    memory.AddEntityLookup(entityName, entityId);

                    BlisDebug.Log(`Entity lookup: ${entityId} : ${entityName}`);
                    if (detail == 'Y') 
                    {
                        msg += `$${entityName} : ${entityId}\n\n`;
                    } 
                    else
                    {
                        msg += `$${entityName}\n\n`; 
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
        BlisDebug.Log(`Getting actions`);

        // Get actions
        let dialogIds = [];
        let fail = null;
        await this.blisClient.GetTrainDialogs(userState)
            .then((json) => {
                dialogIds = JSON.parse(json)['ids'];
                BlisDebug.Log(`Found ${dialogIds.length} actions`);
            })
            .catch(error => fail = error);

        if (fail) 
        {
            BlisDebug.Log(fail);
            return fail;
        }

        let msg = "[";
        for (let dialogId of dialogIds)
        {
            await this.blisClient.GetTrainDialog(userState, dialogId)
                .then((json) => {
                    if (msg.length > 1) msg += ",";
                    msg += `${json}\n\n`;
                    BlisDebug.Log(`Action lookup: ${dialogId}`);
                })
                .catch(error => fail = error); 
        }
        msg += "]"
        if (fail) 
        {
            BlisDebug.Log(fail);
            return fail;
        }
        if (!msg) {
            msg = "This application contains no training dialogs.";
        }
  /*      if (this.connector)
        {
            BlisUploader.SendAsFile(this.bot, msg, this.connector, address);
        }*/
        this.SendAsAttachment(address, msg);
        cb("");
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

        userState[UserStates.APP] = appId;
        userState[UserStates.SESSION] = null;
        userState[UserStates.MODEL] = null;
        userState[UserStates.TEACH] = false;
        userState[UserStates.MEMORY] = {};
        userState[UserStates.ENTITYLOOKUP] = {};
        userState[UserStates.LASTINPUT] = null;
        userState[UserStates.TRAINSTEPS] = {};

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

        // Create session
        BlisDebug.Log(`Creating session...`);
        let sessionId = await this.blisClient.StartSession(userState)
        .then(sessionId => {
            BlisDebug.Log(`Stared Session: ${appId}`);
            cb("Application loaded and Session started.");
        })
        .catch(error => cb(error));
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

    private async TrainFromFile(userState : BlisUserState, url : string, cb : (text) => void) : Promise<void>
    {
        if (url == "*")
        {
            url = "https://onedrive.live.com/download?cid=55DCA1313254B6CB&resid=55DCA1313254B6CB%213634&authkey=AIyjQoawD2vlHmc";
        }

        if (!url)
        {
            let msg = `You must provide url location of training file.\n\n     !trainfromurl {url}`;
            cb(msg);
            return;
        }

        var text = await this.ReadFromFile(url)
        .then((text:string) =>{
            let json = JSON.parse(text);
            let snipObj = deserialize(SnippetList, json);
            this.TrainOnSnippetList(userState, snipObj.snippets)
            .then(status => cb(status))
            .catch(error => cb("Failed to Train"));
        })
        .catch((text) => cb(text));
    }

    private async TrainOnSnippetList(userState : BlisUserState, sniplist : Snippet[]) : Promise<string>
    {
        let fail = null;

        // Extract actions and add them
        let actionList = [];
        let actiontext2id = {};
        for (let snippet of sniplist)
        {
            for (let turn of snippet.turns)
            {
                if (actionList.indexOf(turn.action) == -1)
                {
                    if (!fail)
                    {
                        BlisDebug.Log(`Add Action: ${turn.action}`)    
                        await this.blisClient.AddAction(userState, turn.action, null, new Array(), new Array(), null)
                        .then((actionId) => {
                            actionList.push(turn.action);
                            actiontext2id[turn.action] = actionId;
                        })
                        .catch((text) => 
                        {
                            BlisDebug.Log(`!!${text}`);
                            fail = text;
                        });
                    }
                }
            }
        }
        BlisDebug.Log(`Found ${actionList.length} actions. `)    
        if (fail) return fail;

        // Now train on the dialogs
        for (let snippet of sniplist)
        {
            let dialog = new TrainDialogSNP();
            for (let turn of snippet.turns)
            {
                let altTexts : AltTextSNP[] = [];
                let userText = turn.userText[0];  // TODO only training on first one

                if (turn.userText.length > 1)
                {
                    for (let i=1;i<turn.userText.length;i++)
                    {
                        altTexts.push(new AltTextSNP({text: turn.userText[i]}))
                    }
                }
                let actionId = actiontext2id[turn.action];
                let input = new InputSNP({'text' : userText, 'textAlts' : altTexts});
                let newturn = new TurnSNP({'input' :input, 'output' : actionId });
                dialog.turns.push(newturn);
            }
            if (!fail)
            {
                await this.blisClient.AddTrainDialog(userState, dialog)
                .then((text) => {
                    BlisDebug.Log(`Added: ${text}`);
                })
                .catch((text) => 
                {
                    BlisDebug.Log(`${text}`);
                    fail = text;
                });
            }
        }
        if (fail) return fail;

        // Train the model
        BlisDebug.Log(`Training the model...`)    
        await this.blisClient.TrainModel(userState)
        .then((text) => BlisDebug.Log(`Model trained: ${text}`))
        .catch((text) =>
        {
           BlisDebug.Log(`${text}`);
           fail = text;
        });
        if (fail) return fail;

        // Start a session
        BlisDebug.Log(`Starting session...`)    
        await this.blisClient.StartSession(userState)
        .then((text) => BlisDebug.Log(`Session started: ${text}`))
        .catch((text) =>
        {
           BlisDebug.Log(`${text}`);
           fail = text;
        });
        if (fail) return fail;

        return "App has been trained and bot started.";
    }

    private SendTyping(address : any)
    {
        let msg = <builder.IMessage>{ type: 'typing'};
        msg.address = address;
        this.bot.send(msg);
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
/*
        var base64 = Buffer.from(data).toString('base64');

        var msg = new builder.Message(session)
            .addAttachment({
                contentUrl: util.format('data:%s;base64,%s', contentType, base64),
                contentType: contentType,
                name: attachmentFileName
            });

        session.send(msg);
*/
/*
let msg =  new builder.Message();
        (<any>msg).data.address = address;

        let attachment : builder.IAttachment =  
        {
            contentType: "text/plain",
            content: content
        }
        msg.addAttachment(attachment);
        this.bot.send(msg);*/
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

    private HandleCommand(input : string, address : builder.IAddress, userState : BlisUserState, cb: (error: Error, result: IBlisResult) => void) : void 
    {
        let [command, arg, arg2, arg3] = input.split(' ');
        command = command.toLowerCase();

        if (userState[UserStates.TEACH] && (command != Commands.DUMP) && (command != "!debug")  && (command != Commands.TEACH)) {
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
            else if (command == Commands.ADDENTITY)
            {
                this.AddEntity(userState, arg, arg2, arg3, (responses) => {
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
            else if (command == Commands.TRAINFROMURL)
            {
                this.TrainFromFile(userState, arg, (text) => {
                    this.SendResult(address, userState, cb, [text]);
                });
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
                let dialog = memory.GetTrainSteps();
                let msg = "** New Dialog Summary **\n\n";
                msg += `-----------------------------\n\n`;

                for (let trainstep of dialog)
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
             if (context && context.message && context.message.text) {
                let address = context.message.address;
                this.LoadUser(address, (error, userState) => {

                    // TODO = handle error 
                    this.SendTyping(address);
                    BlisDebug.SetAddress(address);
                
                    let userInput = context.message.text.trim();

                    // Handle admin commands
                    if (userInput.startsWith('!')) {
                        this.HandleCommand(userInput, address, userState, cb);
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
                        let inTeach = userState[UserStates.TEACH];
                        let memory = new BlisMemory(userState);

                        this.blisClient.TakeTurn(userState, userInput, 
                            (response : TakeTurnResponse) => {
                                let responses: (string | builder.IIsAttachment)[] = [];

                                if (response.mode == TakeTurnModes.TEACH)
                                {
                                      if (response.teachStep == TeachStep.LABELENTITY) {

                                        if (response.teachError) {
                                            let title = `**ERROR**\n\n`;
                                            let body = `Input did not match original text. Let's try again.\n\n`;
                                            responses.push(this.MakeHero(title, body, null, null));
                                        }
                                        else
                                        {
                                            memory.SaveTrainStep(SaveStep.INPUT, userInput);
                                        }
                                        let cardtitle = "Teach Step: Detected Entities";
                                        if (response.teachLabelEntities.length == 0)
                                        {
                                            let cardsub = `No new entities found.\n\n`;
                                            let cardtext = "Click None if correct or indicate entities in input string"
                                            responses.push(this.MakeHero(cardtitle, cardsub, cardtext, { "None" : "1", "Help" : Help.PICKENTITY}));
                                        }
                                        else 
                                        {
                                            let entities = "";
                                            for (let i in response.teachLabelEntities)
                                            {
                                                let labelEntity = response.teachLabelEntities[i];
                                                let entityType = memory.EntityName(labelEntity.entityId);
                                                entities += `[$${entityType}: ${labelEntity.entityValue}]    _Score: ${labelEntity.score.toFixed(3)}_\n\n`;
                                            }
                                            responses.push(entities);

                                            let body = "Click Correct if entities are valid or indicate entities in input string"
                                            responses.push(this.MakeHero(cardtitle, null, body, { "Correct" : "1", "Help" : Help.PICKENTITY}));
                                        }
                                    }
                                    else if (response.teachStep == TeachStep.LABELACTION)
                                    {
                                        memory.SaveTrainStep(SaveStep.ENTITY,memory.DumpEntities());

                                        let title = `Teach Step: Select Action`;
                                        let body = `${memory.DumpEntities()}\n\n`;
                                        responses.push(this.MakeHero(title, null, body, null));

                                        if (response.teachLabelActions.length == 0)
                                        {
                                            responses.push('No actions matched.\n\n');
                                            body = 'Enter a new Action\n\n';
                                        }
                                        else 
                                        {
                                            let msg = "";
                                            for (var i in response.teachLabelActions)
                                            {
                                                var labelAction = response.teachLabelActions[i];
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
                                            responses.push(this.MakeHero(" ", null, 'Select Action by number or enter a new one', { "Help" : Help.ADDACTION}));
                                        }
                                        
                                    }
                                    else
                                    {
                                        responses.push(`Unrecognized TeachStep ${response.teachStep}`);
                                    }
                                    /*
                                    // Markdown requires double carraige returns
                                    msg = response.action.content.replace(/\n/g,":\n\n");
                                    if (inTeach)
                                    {
                                        msg = `_Pick desired response or type a new one_\n\n${msg}`;
                                    }*/
                                }
                                else if (response.mode == TakeTurnModes.ACTION)
                                {
                                    let outText = this.blisCallback(response.actions[0].content, memory);
                                    if (inTeach)
                                    {
                                        memory.SaveTrainStep(SaveStep.RESPONSE, outText);
                                        responses.push(this.MakeHero('Trained Response:', outText + "\n\n", "Type next user input for this Dialog or" , 
                                        { "Dialog Complete" : IntCommands.DONETEACH}));
                                    }
                                    else
                                    {
                                        responses.push(outText);
                                        memory.SetLastInput(userInput);
                                    }
                                } 
                                else if (response.mode == TakeTurnModes.ERROR)
                                {
                                    responses.push(response.error);
                                }
                                else 
                                {
                                    responses.push(`Don't know mode: ${response.mode}`);
                                }
                                this.SendResult(address, userState, cb, responses);
                            });
                    } 
                });                
            }
        }
        catch (Error)
        {
            cb(Error, null);
        }
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
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
import { TakeTurnModes, EntityTypes, UserStates } from './Model/Consts';
import { TakeTurnResponse } from './Model/TakeTurnResponse'

export interface IBlisResult extends builder.IIntentRecognizerResult {
    answer: string;
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

    private async AddEntity(userState : BlisUserState, entityName : string, entityType : string, prebuiltName : string, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Add Entity ${entityName}`);

        if (!entityName)
        {
            let msg = `You must provide an entity name for the entity to create.\n\n     !addEntity {entitiyName} {LUIS | LOCAL} {prebuiltName?}`;
            cb(msg);
            return;
        }
        if (!entityType)
        {
            let msg = `You must provide an entity type for the entity to create.\n\n     !addEntity {entitiyName} {LUIS | LOCAL} {prebuiltName?}`;
            cb(msg);
            return;
        }
        entityType = entityType.toUpperCase();
        if (entityType != EntityTypes.LOCAL && entityType != EntityTypes.LUIS)
        {
            let msg = `Entity type must be 'LOCAL' or 'LUIS'\n\n     !addEntity {entitiyName} {LUIS | LOCAL} {prebuiltName?}`;
            cb(msg);
            return;
        }
        if (entityType == EntityTypes.LOCAL && prebuiltName != null)
        {
            let msg = `LOCAL entities shouldn't include a prebuilt name\n\n     !addEntity {entitiyName} {LUIS | LOCAL} {prebuiltName?}`;
            cb(msg);
            return;
        }

       await this.blisClient.AddEntity(userState, entityName, entityType, prebuiltName)
        .then((entityId) => 
        {
            let memory = new BlisMemory(userState);
            memory.AddEntityLookup(entityName, entityId);
            cb(`Created Entity ${entityName} : ${entityId}`); 
        })
        .catch((text) => cb(text));
    }

    private async CreateApp(userState : BlisUserState,  appName : string, luisKey, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Create Application`);

        // TODO - temp debug
        if (luisKey == '*')
        {
            luisKey = 'fefa536979fe4079872584fc4bf41abe';
        }

        if (!appName)
        {
            let msg = `You must provide a name for your application.\n\n     !createapp {app Name} {luis key}`;
            cb(msg);
            return;
        }
        if (!luisKey)
        {
            let msg = `You must provide a luisKey for your application.\n\n     !createapp {app Name} {luis key}`;
            cb(msg);
            return;
        }

        await this.blisClient.CreateApp(userState, appName, luisKey)
            .then((text) => 
            {
                cb(`Created App ${text}.\n\nTo train try _!teach_, _!trainfromurl_ or type _!help_ for more info. `)
            })
            .catch((text) => cb(text));
    }

    private DebugHelp() : string
    {
        let text = "";
        text += "!debug\n\n       Toggle debug mode\n\n"
        text += "!deleteApp {appId}\n\n       Delete specified application\n\n"
        text += "!dump\n\n       Show client state\n\n"
        text += "!whichApp\n\n       Return current appId\n\n"
        text += "!entities\n\n       Return list of entities\n\n"
        text += "!actions\n\n       Return list of actions\n\n"
        text += "!traindialogs\n\n       Return list of training dialogs\n\n"
        text += "!help\n\n       General help"
        return text;
    }

    private async DeleteAction(userState : BlisUserState, actionId : string, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Action`);

        if (!actionId)
        {
            let msg = `You must provide the ID of the action to delete.\n\n     !deleteaction {app ID}`;
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
            let msg = `You must provide the ID of the application to delete.\n\n     !deleteapp {app ID}`;
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
                // Update the model (as we may not have had one before teaching)
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

    private async GetActions(userState : BlisUserState, cb : (text) => void) : Promise<void>
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

        let msg = "";
        for (let actionId of actionIds)
        {
            await this.blisClient.GetAction(userState, actionId)
                .then((json) => {
                    let content = JSON.parse(json)['content'];
                    msg += `${actionId} : ${content}\n\n`;
                    BlisDebug.Log(`Action lookup: ${actionId} : ${content}`);
                })
                .catch(error => fail = error); 
        }
        if (fail) 
        {
            BlisDebug.Log(fail);
            return fail;
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

    private async GetEntities(userState : BlisUserState, cb : (text) => void) : Promise<void>
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
        let msg = "";
        for (let entityId of entityIds)
        {
            await this.blisClient.GetEntity(userState, entityId)
                .then((json) => {
                    let entityName = JSON.parse(json)['name'];
                    
                    // Add to entity lookup table
                    memory.AddEntityLookup(entityName, entityId);

                    BlisDebug.Log(`Entity lookup: ${entityId} : ${entityName}`);
                    msg += `${entityId} : ${entityName}\n\n`;
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

    private Help() : string
    {
        let text = "";
        text += "!start\n\n       Start the bot\n\n";
        text += "!addEntity {entitiyName} {LUIS | LOCAL} {prebuildName?}\n\n       Create new application\n\n"
        text += "!teach\n\n       Start new teaching session\n\n"
        text += "!createApp {appName} {luisKey}\n\n       Create new application\n\n"
        text += "!deleteApp {appId}\n\n       Delete specified application\n\n"
        text += "!done\n\n       End a teaching session\n\n"
        text += "!loadApp {appId}\n\n       Switch to appId\n\n"
        text += "!trainfromurl {file url}\n\n       Train in dialogs at given url\n\n"
        text += "!deleteAction {actionId}\n\n       Delete an action on current app\n\n"
        text += "!help\n\n       This list\n\n"
        text += "!debughelp\n\n       Show debugging commands"
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
        await this.GetEntities(userState, (text) =>
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

    private async NewSession(userState : BlisUserState, teach : boolean, cb : (text) => void) : Promise<void>
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
                cb(`_Teach mode started. Provide your first input_`);
            }
            else {
                cb(`_Bot started..._`);
            }
        })
        .catch((text) => cb(text));
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
                        await this.blisClient.AddAction(userState, turn.action, new Array(), new Array(), null)
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

    private SendResult(address : builder.IAddress, userState : BlisUserState, cb: (error: Error, result: IBlisResult) => void, text : string) 
    {
        // Save user state
        BlisUserState.Save(this.bot, address, userState);

        // Assume BLIS always wins for now 
        var result: IBlisResult = { score: 1.0, answer: null, intent: null };
        result.answer = text;

        // Send callback
        cb(null, result);
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
                
                    let text = context.message.text.trim();
                    let [command, arg, arg2, arg3] = text.split(' ');
                    command = command.toLowerCase();

                    // Handle admin commands
                    if (command.startsWith('!')) {

                        if (userState[UserStates.TEACH] && (command != "!dump") && (command != "!debug")) {
                            if (command == "!done") {
                                this.EndSession(userState, (text) => {
                                    this.SendResult(address, userState, cb, "_Completed teach dialog..._");
                                });
                            }
                            else {
                                this.SendResult(address, userState, cb, "_In teaching mode. The only valid command is_ !done");
                            }
                        }
                        else {
                            if (command == "!actions")
                            {
                                this.GetActions(userState, (text) => {
                                    this.SendResult(address, userState, cb, text);
                                });
                            }
                            else if (command == "!addentity")
                            {
                                this.AddEntity(userState, arg, arg2, arg3, (text) => {
                                    this.SendResult(address, userState, cb, text);
                                });
                            }
                            else if (command == "!apps")
                            {
                                this.GetApps((text) => {
                                    this.SendResult(address, userState, cb, text);
                                });
                            }
                            else if (command == "!createapp")
                            {
                                this.CreateApp(userState, arg, arg2, (text) => {
                                    this.SendResult(address, userState, cb, text);
                                });
                            }
                            else if (command == "!deleteallapps")
                            {
                                this.DeleteAllApps(userState, (text) => {
                                    this.SendResult(address, userState, cb, text);
                                });
                            }
                            else if (command == "!deleteaction")
                            {
                                this.DeleteAction(userState, arg, (text) => {
                                    this.SendResult(address, userState, cb, text);
                                });
                            }
                            else if (command == "!done")
                            {
                                this.SendResult(address, userState, cb, "_I wasn't in teach mode. Type _!teach_ to begin teaching_");
                            }
                            else if (command == "!deleteapp")
                            {
                                this.DeleteApp(userState, arg, (text) => {
                                    this.SendResult(address, userState, cb, text);
                                });
                            }
                            else if (command == "!debug")
                            {
                                userState[UserStates.DEBUG] = !userState[UserStates.DEBUG];
                                BlisDebug.enabled = userState[UserStates.DEBUG];
                                this.SendResult(address, userState, cb, "Debug " + (BlisDebug.enabled ? "Enabled" : "Disabled"));
                            }
                            else if (command == "!debughelp")
                            {
                                this.SendResult(address, userState, cb, this.DebugHelp());
                            }
                            else if (command == "!dump")
                            {
                                let memory = new BlisMemory(userState);
                                this.SendResult(address, userState, cb, memory.Dump());
                            }
                            else if (command == "!entities")
                            {
                                this.GetEntities(userState, (text) => {
                                    this.SendResult(address, userState, cb, text);
                                });
                            }
                            else if (command == "!help")
                            {
                                this.SendResult(address, userState, cb, this.Help());
                            }
                            else if (command == "!loadapp")
                            {
                                this.LoadApp(userState, arg, (text) => {
                                    this.SendResult(address, userState, cb, text);
                                });
                            }
                            else if (command == "!start")
                            {
                                this.NewSession(userState, false, (text) => {
                                    this.SendResult(address, userState, cb, text);
                                });
                            }
                            else if (command == "!teach")
                            {
                                this.NewSession(userState, true, (text) => {
                                    this.SendResult(address, userState, cb, text);
                                });
                            }
                            else if (command == "!trainfromurl")
                            {
                                this.TrainFromFile(userState, arg, (text) => {
                                    this.SendResult(address, userState, cb, text);
                                });
                            }
                            else if (command == "!traindialogs")
                            {
                                this.GetTrainDialogs(userState, address, (text) => {
                                    this.SendResult(address, userState, cb, text);
                                });
                            }
                            else if (command == "!whichapp")
                            {
                                var msg = userState[UserStates.APP];
                                if (!msg) msg = "No app has been loaded.";
                                this.SendResult(address, userState, cb, msg);
                            }
                            else 
                            {
                                let text = "_Not a valid command._\n\n\n\n" + this.Help();
                                this.SendResult(address, userState, cb, text);
                            }
                        }
                    }
                    else 
                    {
                        let inTeach = userState[UserStates.TEACH];
                        let memory = new BlisMemory(userState);
                        this.blisClient.TakeTurn(userState, text, 
                            (response : TakeTurnResponse) => {
                                let msg = "";
                                if (response.mode == TakeTurnModes.TEACH)
                                {
                                    // Markdown requires double carraige returns
                                    msg = response.action.content.replace(/\n/g,":\n\n");
                                    if (inTeach)
                                    {
                                        msg = `_Pick desired response or type a new one_\n\n${msg}`;
                                    }
                                }
                                else if (response.mode == TakeTurnModes.ACTION)
                                {
                                    let outText = this.blisCallback(response.actions[0].content, memory);
                                    msg = outText;
                                    if (inTeach)
                                    {
                                        msg = `_Trained Response:_ ${msg}\n\n_Provide next input or _!done_ if training dialog is complete_`;
                                    }
                                } 
                                else if (response.mode == TakeTurnModes.ERROR)
                                {
                                    msg = response.error;
                                }
                                else 
                                {
                                    msg = `Don't know mode: ${response.mode}`;
                                }
                                this.SendResult(address, userState, cb, msg);
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
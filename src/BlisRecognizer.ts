import * as builder from 'botbuilder';
import * as request from 'request';
import { deserialize } from 'json-typescript-mapper';
import { TakeTurnRequest } from './Model/TakeTurnRequest'
import { SnippetList, Snippet } from './Model/SnippetList'
import { TrainDialog, Input, Turn, AltText } from './Model/TrainDialog'
import { BlisClient } from './BlisClient';
import { BlisDebug} from './BlisDebug';
import { LuisEntity } from './Model/LuisEntity';
import { TakeTurnModes } from './Model/Consts';
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
    appId?: string;

    // TODO CUT
    appName?: string;
    luisKey?: string;
    entityList?: [string];  
    prebuiltList?: [string]; 

    // Optional callback than runs after LUIS but before BLIS.  Allows Bot to substitute entities
    luisCallback? : (text: string, luisEntities : LuisEntity[]) => TakeTurnRequest;

    // Optional callback that runs after BLIS is called but before the Action is rendered
    blisCallback? : (text : string) => string;

    // Mappting between API names and functions
    apiCallbacks? : { string : () => TakeTurnRequest };
}

export class BlisRecognizer implements builder.IIntentRecognizer {
    protected blisClient : BlisClient;
    protected appId : string;
    protected luisKey : string;
    protected sessionId : string;
    protected modelId : string;
    protected luisCallback : (text: string, luisEntities : LuisEntity[]) => TakeTurnRequest;
    protected apiCallbacks : { string : () => TakeTurnRequest };
    protected blisCallback : (test : string) => string;
    protected entity_name2id : { string : string };
    protected entityValues = {};
    
    constructor(private options: IBlisOptions){
        this.init(options);
    }

    private async init(options: IBlisOptions) {
        try {
            BlisDebug.Log("Creating client...");
            this.blisClient = new BlisClient(options.serviceUri, options.user, options.secret);

            this.luisCallback = options.luisCallback;
            this.apiCallbacks = options.apiCallbacks;
            this.blisCallback = options.blisCallback ? options.blisCallback : this.DefaultBlisCallback;

            // Create App
            this.appId = options.appId;
            if (this.appId)
            {
                if (options.appName || options.luisKey)
                {
                    BlisDebug.Log("No need for appName or listKey when providing appId");
                }
            }
            else 
            {
                if (!options.appName || !options.luisKey)
                {
                    BlisDebug.Log("ERROR: Must provide either appId or appName and luisKey");
                    return;
                }
                BlisDebug.Log("Creating app...");
                this.appId = await this.blisClient.CreateApp(options.appName, options.luisKey);   // TODO parameter validation
            }
            BlisDebug.Log(`Using AppId ${this.appId}`);

            // Add any new entities
            if (options.entityList)
            {
                for (let entityName of options.entityList)
                {
                    BlisDebug.Log(`Adding new LUIS entity: ${entityName}`);
                    await this.blisClient.AddEntity(this.appId, entityName, "LOCAL", null)
                        .then((entityId) => {
                            BlisDebug.Log(`Added entity: ${entityId}`);
                        })
                        .catch(error => { 
                            BlisDebug.Log(`ERROR: ${error}`);
                        });      
                }
            }

            // Add any new prebuilts
            if (options.prebuiltList)
            {
                for (let prebuiltName of options.prebuiltList)
                {
                    BlisDebug.Log(`Adding new LUIS pre-build entity: ${prebuiltName}`);
                    await this.blisClient.AddEntity(this.appId, prebuiltName, "LUIS", prebuiltName)  // TODO support diff luis and internal name
                        .then((prebuiltId) => {
                            BlisDebug.Log(`Added entity: ${prebuiltId}`);
                        })
                        .catch(error => { 
                            BlisDebug.Log(`ERROR: ${error}`);
                        }); 
                }
            }

            // Get entities
            let entityIds = [];
            await this.blisClient.GetEntities(this.appId)
                .then((json) => {
                    entityIds = JSON.parse(json)['ids'];
                    BlisDebug.Log(`Found ${entityIds.length} entities`);
                })
                .catch(error => { 
                    BlisDebug.Log(`ERROR: ${error}`);
                }); 

            let entity_id2name = {};
            for (let entityId of entityIds)
            {
                await this.blisClient.GetEntity(this.appId, entityId)
                    .then((json) => {
                        let entityName = JSON.parse(json)['name'];
                        entity_id2name[entityId] = entityName;
                        this.entity_name2id[entityName] = entityId;
                        BlisDebug.Log(`Entity lookup: ${entityId} : ${entityName}`);
                    })
                    .catch(error => { 
                        BlisDebug.Log(`ERROR: ${error}`);
                    }); 
            }

            // Get actions
            let actionIds = [];
            await this.blisClient.GetActions(this.appId)
                .then((json) => {
                    actionIds = JSON.parse(json)['ids'];
                    BlisDebug.Log(`Found ${actionIds.length} actions`);
                })
                .catch(error => { 
                    BlisDebug.Log(`ERROR: ${error}`);
                });

            let action_id2name = {};
            let action_name2id = {};
            for (let actionId of actionIds)
            {
                await this.blisClient.GetEntity(this.appId, actionId)
                    .then((json) => {
                        let actionName = JSON.parse(json)['name'];
                        action_id2name[actionId] = json;
                        action_name2id[actionName] = actionId;
                        BlisDebug.Log(`Action lookup: ${actionId} : ${actionName}`);
                    })
                    .catch(error => { 
                        BlisDebug.Log(`ERROR: ${error}`);
                    }); 
            }

            // Train model
            if (actionIds.length > 0)
            {
                await this.blisClient.TrainModel(this.appId)
                .then((modelId) => {
                    this.modelId = modelId;
                    BlisDebug.Log(`Trained model: ${this.modelId}`);
                })
                .catch(error => { 
                    BlisDebug.Log(`ERROR: ${error}`);
                });
            } 

            // Create session
            if (this.modelId)
            {
                BlisDebug.Log(`Creating session...`);
                this.sessionId = await this.blisClient.StartSession(this.appId, this.modelId);
                BlisDebug.Log(`Created Session: ${this.sessionId}`);
            }
            else 
            {
                BlisDebug.Log(`No model.  Try training with "!next teach"`);
            }
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
    private async TrainFromFile(recognizer : BlisRecognizer, url : string, cb : (text) => void) : Promise<void>
    {
        url = "https://onedrive.live.com/download?cid=55DCA1313254B6CB&resid=55DCA1313254B6CB%213634&authkey=AIyjQoawD2vlHmc";
        var text = await this.ReadFromFile(url)
        .then((text:string) =>{
            let json = JSON.parse(text);
            let snipObj = deserialize(SnippetList, json);
            this.TrainOnSnippetList(recognizer, snipObj.snippets);
        })
        .catch((text) => cb(text));
    }

    private async TrainOnSnippetList(recognizer : BlisRecognizer, sniplist : Snippet[]) : Promise<void>
    {
        let fail = false;

        // Extract actions and add them
        let actionList = [];
        let actiontext2id = {};
        for (let snippet of sniplist)
        {
            for (let turn of snippet.turns)
            {
                if (actionList.indexOf(turn.action) == -1)
                {
                    while (!fail)
                    {
                        BlisDebug.Log(`Add Action: ${turn.action}`)    
                        await this.blisClient.AddAction(this.appId, turn.action, new Array(), new Array(), null)
                        .then((actionId) => {
                            actionList.push(turn.action);
                            actiontext2id[turn.action] = actionId;
                        })
                        .catch((text) => 
                        {
                            BlisDebug.Log(`!!${text}`);
                            fail = true;;
                        });
                    }
                }
            }
        }
        BlisDebug.Log(`Found ${actionList.length} actions. `)    
        if (fail) return;

        // Now train on the dialogs
        for (let snippet of sniplist)
        {
            let dialog = new TrainDialog();
            for (let turn of snippet.turns)
            {
                let altTexts : AltText[] = [];
                let userText = turn.userText[0];  // TODO only training on first one

                if (turn.userText.length > 1)
                {
                    for (let i=1;i<turn.userText.length;i++)
                    {
                        altTexts.push(new AltText({text: turn.userText[i]}))
                    }
                }
                let actionId = actiontext2id[turn.action];
                let input = new Input({'text' : userText, 'textAlts' : altTexts});
                let newturn = new Turn({'input' :input, 'output' : actionId });
                dialog.turns.push(newturn);
            }
            while (!fail)
            {
                await this.blisClient.TrainDialog(this.appId, dialog)
                .then((text) => {
                    BlisDebug.Log(`Added: ${text}`);
                })
                .catch((text) => 
                {
                    BlisDebug.Log(`${text}`);
                    fail = true;
                });
            }
        }
        if (fail) return;
        
        // Finally train the model
        BlisDebug.Log(`Training the model...`)    
        this.modelId = await this.blisClient.TrainModel(this.appId);
    }

    private async NewSession(recognizer : BlisRecognizer, teach : boolean, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to create new session, Teach = ${teach}`);

       if (this.sessionId) 
       {
           BlisDebug.Log(`Trying to delete existing session`);
           await this.blisClient.EndSession(this.appId, this.sessionId);
       }
       await this.blisClient.StartSession(this.appId, this.modelId, teach)
        .then((text) => 
        {
            recognizer.sessionId = text;
            cb(`New session, Teach = ${teach}`);
        })
        .catch((text) => cb(text));
    }

    private async CreateApp(recognizer : BlisRecognizer, appName : string, luisKey, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Create Application`);

        // Using existing LUIS key if not provided
        if (!luisKey) 
        {
            luisKey = recognizer.luisKey;
        }

        await this.blisClient.CreateApp(appName, luisKey)
            .then((text) => 
            {
                recognizer.appId = text;
                recognizer.luisKey = luisKey;
                cb(`Created App ${text}`)
            })
            .catch((text) => cb(text));
    }

    private async DeleteApp(recognizer : BlisRecognizer, appId : string, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Application`);

       // Delete current app if no appId provided
       if (!appId) 
       {
           appId = recognizer.appId;
       }
       await this.blisClient.DeleteApp(appId)
        .then((text) => 
        {
            // Did I delete my active app?
            if (appId == recognizer.appId)
            {
                recognizer.appId = null;
            }
            cb(`Deleted App ${appId}`)
        })
        .catch((text) => cb(text));
    }

    private async DeleteAction(recognizer : BlisRecognizer, actionId : string, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Action`);
       await this.blisClient.DeleteAction(this.appId, actionId)
        .then((text) => cb(`Deleted Action ${actionId}`))
        .catch((text) => cb(text));
    }

    private Help() : string
    {
        let text = "";
        text += "!next\n\n       Start new dialog\n\n";
        text += "!next teach\n\n       Start new teaching dialog\n\n"
        text += "!createApp {appName}\n\n       Create new application with current luisKey\n\n"
        text += "!createApp {appName} {luisKey}\n\n       Create new application\n\n"
        text += "!deleteApp\n\n       Delete existing application\n\n"
        text += "!deleteApp {appId}\n\n       Delete specified application\n\n"
        text += "!startApp\n\n       Switch to appId\n\n"
        text += "!whichApp\n\n       Return current appId\n\n"
        text += "!trainDialogs {file url}\n\n       Train in dialogs at given url\n\n"
        text += "!deleteAction {actionId}\n\n       Delete an action on current app\n\n"
        text += "!help\n\n       This list"
        return text;
    }

    public recognize(context: builder.IRecognizeContext, cb: (error: Error, result: IBlisResult) => void): void {
        
        var result: IBlisResult = { score: 1.0, answer: null, intent: null };
        
        if (context && context.message && context.message.text) {
            
            let text = context.message.text.trim();
            let [command, arg, arg2] = text.split(' ');
            command = command.toLowerCase();

            // Handle admin commands
            if (command.startsWith('!')) {
                if (command == "!next")
                {
                    let teach = (arg == 'teach');
                    this.NewSession(this, teach, (text) => {
                        result.answer = text;
                        cb(null, result);
                    });
                }
                else if (command == "!createapp")
                {
                //    let that = this;
                    this.CreateApp(this, arg, arg2, (text) => {
                        result.answer = text;
                        cb(null, result);
                    });
                }
                else if (command == "!deleteapp")
                {
                    this.DeleteApp(this, arg, (text) => {
                        result.answer = text;
                        cb(null, result);
                    });
                }
                else if (command == "!startapp")
                {
                    this.appId = arg;
                    this.sessionId = null;
                    result.answer = `Starting app ${arg}`;
                    cb(null, result);
                }
                else if (command == "!whichapp")
                {
                    result.answer = this.appId;
                    cb(null, result);
                }
                else if (command == "!deleteaction")
                {
                    this.DeleteAction(this, arg, (text) => {
                        result.answer = text;
                        cb(null, result);
                    });
                }
                else if (command == "!traindialogs")
                {
                    this.TrainFromFile(this, arg, (text) => {
                        result.answer = text;
                        cb(null, result);
                    });
                }
                else if (command == "!help")
                {
                    result.answer = this.Help();
                    cb(null, result);
                }
                else 
                {
                    let text = "Not a valid command.\n\n\n\n" + this.Help();
                    result.answer = text;
                    cb(null, result);
                }
            }
            else 
            {
                if (this.appId == null)
                {
                    result.answer = "No Application has been loaded.  Type !help for more info.";
                    cb(null, result);
                }
                else if (!this.sessionId)
                {
                    result.answer = "Create a sesion first with !next or !next teach";
                    cb(null, result);
                }
                else
                {
                    this.blisClient.TakeTurn(this.appId, this.sessionId, text, this.luisCallback, this.apiCallbacks, 
                        (response : TakeTurnResponse) => {

                            if (response.mode == TakeTurnModes.Teach)
                            {
                                // Markdown requires double carraige returns
                                var output = response.action.content.replace(/\n/g,":\n\n");
                                result.answer = output;
                            }
                            else if (response.mode == TakeTurnModes.Action)
                            {
                                let outText = this.blisCallback(response.actions[0].content);
                                result.answer = outText;
                            } 
                            else if (response.mode == TakeTurnModes.Error)
                            {
                                result.answer = response.error;
                            }
                            else 
                            {
                                result.answer = `Don't know mode: ${response.mode}`;
                            }
                            cb(null,result);
                        }
                    );
                }
            } 
        }
    }

    
    private DefaultBlisCallback(text: string)
    {
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
    }
}
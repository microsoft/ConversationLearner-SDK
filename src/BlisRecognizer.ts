import * as builder from 'botbuilder';
import * as request from 'request';
import { deserialize } from 'json-typescript-mapper';
import { TakeTurnRequest } from './Model/TakeTurnRequest'
import { SnippetList, Snippet } from './Model/SnippetList'
import { TrainDialog, Input, Turn, AltText } from './Model/TrainDialog'
import { BlisClient, BlisClientOptions } from './BlisClient';
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

    // BLIS application to employ
    appId?: string; 

    // Optional callback than runs after LUIS but before BLIS.  Allows Bot to substitute entities
    luisCallback? : (text: string, luisEntities : LuisEntity[]) => TakeTurnRequest;

    // Optional callback that runs after BLIS is called but before the Action is rendered
    blisCallback? : (text : string) => string;

    // Mappting between API names and functions
    apiCallbacks? : { string : () => TakeTurnRequest };
}

export class BlisRecognizer implements builder.IIntentRecognizer {
    protected blisClient : BlisClient;
    protected luisKey : string;
    protected blisCallback : (test : string) => string;
    protected entity_name2id : { string : string };
    protected entityValues = {};
    
    constructor(private options: IBlisOptions){
        this.init(options);
    }

    private async init(options: IBlisOptions) {
        try {
            var fail = "";

            BlisDebug.Log("Creating client...");
            this.blisClient = new BlisClient(options.serviceUri, options.user, options.secret);

            // Set client options
            let coptions = 
            {
                luisCallback : options.luisCallback,
                apiCallbacks : options.apiCallbacks,
                appId : options.appId
            }
            this.blisClient.SetOptions(coptions);
            this.blisCallback = options.blisCallback ? options.blisCallback : this.DefaultBlisCallback;

            // Attempt to load the application
            await this.LoadApp(this, options.appId, (text) => BlisDebug.Log(text));

        
/*
            // Get entities
            let entityIds = [];
            await this.blisClient.GetEntities()
                .then((json) => {
                    entityIds = JSON.parse(json)['ids'];
                    BlisDebug.Log(`Found ${entityIds.length} entities`);
                })
                .catch(error => fail = error); 
            if (fail) return fail;

            let entity_id2name = {};
            for (let entityId of entityIds)
            {
                await this.blisClient.GetEntity(entityId)
                    .then((json) => {
                        let entityName = JSON.parse(json)['name'];
                        entity_id2name[entityId] = entityName;
                        this.entity_name2id[entityName] = entityId;
                        BlisDebug.Log(`Entity lookup: ${entityId} : ${entityName}`);
                    })
                    .catch(error => fail = error); 
            }
            if (fail) 
            {
                BlisDebug.Log(fail);
                return fail;
            }

            // Get actions
            let actionIds = [];
            await this.blisClient.GetActions()
                .then((json) => {
                    actionIds = JSON.parse(json)['ids'];
                    BlisDebug.Log(`Found ${actionIds.length} actions`);
                })
                .catch(error => fail = error);
            if (fail) return fail;

            let action_id2name = {};
            let action_name2id = {};
            for (let actionId of actionIds)
            {
                await this.blisClient.GetEntity(actionId)
                    .then((json) => {
                        let actionName = JSON.parse(json)['name'];
                        action_id2name[actionId] = json;
                        action_name2id[actionName] = actionId;
                        BlisDebug.Log(`Action lookup: ${actionId} : ${actionName}`);
                    })
                    .catch(error => fail = error); 
            }
            if (fail) 
            {
                BlisDebug.Log(fail);
                return fail;
            }

            // Train model
            if (actionIds.length > 0)
            {
                await this.blisClient.TrainModel()
                .then((modelId) => {
                    BlisDebug.Log(`Trained model: ${modelId}`);
                })
                .catch(error => fail = error);
            } 
            if (fail) 
            {
                BlisDebug.Log(fail);
                return fail;
            }
*/

        }
        catch (error) {
            BlisDebug.Log(`ERROR: ${error}`);
        }
    }

    public InitDebug(bot : builder.UniversalBot) : void
    {
        BlisDebug.InitLogger(bot);
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
            this.TrainOnSnippetList(recognizer, snipObj.snippets)
            .then(status => cb(status))
            .catch(error => cb("Failed to Train"));
        })
        .catch((text) => cb(text));
    }

    private async TrainOnSnippetList(recognizer : BlisRecognizer, sniplist : Snippet[]) : Promise<string>
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
                        await this.blisClient.AddAction(turn.action, new Array(), new Array(), null)
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
            if (!fail)
            {
                await this.blisClient.TrainDialog(dialog)
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
        await this.blisClient.TrainModel()
        .then((text) => BlisDebug.Log(`Model trained: ${text}`))
        .catch((text) =>
        {
           BlisDebug.Log(`${text}`);
           fail = text;
        });
        if (fail) return fail;

        // Start a session
        BlisDebug.Log(`Starting session...`)    
        await this.blisClient.StartSession()
        .then((text) => BlisDebug.Log(`Session started: ${text}`))
        .catch((text) =>
        {
           BlisDebug.Log(`${text}`);
           fail = text;
        });
        if (fail) return fail;

        return "App has been trained and bot started.";
    }

    private async NewSession(recognizer : BlisRecognizer, teach : boolean, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to create new session, Teach = ${teach}`);

       // Close any existing session
       await this.blisClient.EndSession()
       .then(sessionId => BlisDebug.Log(`Ended session ${sessionId}`))
       .catch(error  => BlisDebug.Log(`${error}`));
       
       await this.blisClient.StartSession(teach)
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

    private async EndSession(recognizer : BlisRecognizer, cb : (text) => void) : Promise<void>
    {
        // Ending teaching session
        await this.blisClient.EndSession()
        .then((text) => cb(text))
        .catch((error) => 
        {
            BlisDebug.Log(error);
            cb(error)
        });
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
                // Save luis key
                recognizer.luisKey = luisKey;
                cb(`Created App ${text}.\n\nTo train try _!teach_, _!traindialogs_ or type _!help_ for more info. `)
            })
            .catch((text) => cb(text));
    }

    private async DeleteApp(recognizer : BlisRecognizer, appId : string, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Application`);

       await this.blisClient.DeleteApp(appId)
        .then((text) => 
        {
            cb(`Deleted App ${appId}`)
        })
        .catch((text) => cb(text));
    }

    private async LoadApp(recognizer : BlisRecognizer, appId : string, cb : (text) => void) : Promise<void>
    {
        BlisDebug.Log(`Trying to load Application ${appId}`);
        this.blisClient.SetOptions({appId : appId, sessionId : null});
        let fail = null;

        // Validate appId
        await this.blisClient.GetApp()
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
        await this.blisClient.GetModel()
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

        // Create session
        BlisDebug.Log(`Creating session...`);
        let sessionId = await this.blisClient.StartSession()
        .then(sessionId => {
            BlisDebug.Log(`Stared Session: ${appId}`);
            cb("Application loaded and Session started.");
        })
        .catch(error => cb(error));
    }

    private async DeleteAction(recognizer : BlisRecognizer, actionId : string, cb : (text) => void) : Promise<void>
    {
       BlisDebug.Log(`Trying to Delete Action`);
       await this.blisClient.DeleteAction(actionId)
        .then((text) => cb(`Deleted Action ${actionId}`))
        .catch((text) => cb(text));
    }

    private Help() : string
    {
        let text = "";
        text += "!start\n\n       Start the bot\n\n";
        text += "!teach\n\n       Start new teaching session\n\n"
        text += "!createApp {appName}\n\n       Create new application with current luisKey\n\n"
        text += "!createApp {appName} {luisKey}\n\n       Create new application\n\n"
        text += "!debug\n\n       Toggle debug mode\n\n"
        text += "!deleteApp\n\n       Delete existing application\n\n"
        text += "!deleteApp {appId}\n\n       Delete specified application\n\n"
        text += "!done\n\n       End a teaching session\n\n"
        text += "!loadApp {appId}\n\n       Switch to appId\n\n"
        text += "!whichApp\n\n       Return current appId\n\n"
        text += "!trainDialogs {file url}\n\n       Train in dialogs at given url\n\n"
        text += "!deleteAction {actionId}\n\n       Delete an action on current app\n\n"
        text += "!help\n\n       This list"
        return text;
    }

    private Dump() : string
    {
        let text = "";
        text += `App: ${this.blisClient.GetOption("appId")}\n\n`;
        text += `Model: ${this.blisClient.GetOption("modelId")}\n\n`;
        text += `Session: ${this.blisClient.GetOption("sessionId")}\n\n`;
        text += `InTeach: ${this.blisClient.GetOption("inTeach")}\n\n`;
        return text;
    }

    public recognize(context: builder.IRecognizeContext, cb: (error: Error, result: IBlisResult) => void): void {
        
        try
        {
            var result: IBlisResult = { score: 1.0, answer: null, intent: null };

             if (context && context.message && context.message.text) {
                
                BlisDebug.SetAddress(context.message.address);
            
                let text = context.message.text.trim();
                let [command, arg, arg2] = text.split(' ');
                command = command.toLowerCase();

                // Handle admin commands
                if (command.startsWith('!')) {

                    if (this.blisClient.GetOption('inTeach') && (command != "!dump") && (command != "!debug")) {
                        if (command == "!done") {
                            this.EndSession(this, (text) => {
                                result.answer = "_Completed teach dialog..._";
                                cb(null, result);
                            });
                        }
                        else {
                            result.answer = "_In teaching mode. The only valid command is_ !done";
                            cb(null, result);
                        }
                    }
                    else {
                        if (command == "!start")
                        {
                            this.NewSession(this, false, (text) => {
                                result.answer = text;
                                cb(null, result);
                            });
                        }
                        else if (command == "!teach")
                        {
                            this.NewSession(this, true, (text) => {
                                result.answer = text;
                                cb(null, result);
                            });
                        }
                        else if (command == "!done")
                        {
                            result.answer = "_I wasn't in teach mode. Type _!teach_ to begin teaching_";
                            cb(null, result);
                        }
                        else if (command == "!dump")
                        {
                            result.answer = this.Dump();
                            cb(null, result);
                        }
                        else if (command == "!createapp")
                        {
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
                        else if (command == "!debug")
                        {
                            let active = BlisDebug.Toggle();
                            result.answer = "Debug " + (active ? "Enabled" : "Disabled");
                            cb(null, result);
                        }
                        else if (command == "!loadapp")
                        {
                            this.LoadApp(this, arg, (text) => {
                                result.answer = text;
                                cb(null, result);
                            });
                        }
                        else if (command == "!whichapp")
                        {
                            result.answer = this.blisClient.GetOption('appId');
                            if (!result.answer) result.answer = "No app has been loaded.";
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
                            let text = "_Not a valid command._\n\n\n\n" + this.Help();
                            result.answer = text;
                            cb(null, result);
                        }
                    }
                }
                else 
                {
                    let inTeach = this.blisClient.GetOption('inTeach');
                    this.blisClient.TakeTurn(text,
                        (response : TakeTurnResponse) => {

                            if (response.mode == TakeTurnModes.Teach)
                            {
                                // Markdown requires double carraige returns
                                result.answer = response.action.content.replace(/\n/g,":\n\n");
                                if (inTeach)
                                {
                                    result.answer = `_Pick desired response or type a new one_\n\n${result.answer}`;
                                }
                            }
                            else if (response.mode == TakeTurnModes.Action)
                            {
                                let outText = this.blisCallback(response.actions[0].content);
                                result.answer = outText;
                                if (inTeach)
                                {
                                    result.answer = `_Trained Response:_ ${result.answer}\n\n_Provide next input or _!done_ if training dialog is complete_`;
                                }
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
                        });
                } 
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
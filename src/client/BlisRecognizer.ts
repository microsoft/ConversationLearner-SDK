import * as builder from 'botbuilder';
import * as request from 'request';
import { TakeTurnRequest } from './Model/TakeTurnRequest'
import { SnippetList, Snippet } from './Model/SnippetList'
import { BlisClient } from './client';
import { BlisDebug} from './BlisDebug';

import { Entity, TakeTurnResponse, TakeTurnModes } from '../client/Model/TakeTurnResponse'

export interface IBlisResult extends builder.IIntentRecognizerResult {
    answer: string;
}

export interface IBlisOptions extends builder.IIntentRecognizerSetOptions {
    serviceUri: string;
    user: string;
    secret: string;
    appId?: string;
    appName?: string;
    luisKey?: string;
    entityList?: [string];
    prebuiltList?: [string];
}

export class BlisRecognizer implements builder.IIntentRecognizer {
    protected blisClient : BlisClient;
    protected appId : string;
    protected luisKey : string;
    protected sessionId : string;
    protected modelId : string;
    protected LUCallback : (text: string, luisEntities : [{}]) => TakeTurnRequest;
    
    constructor(private options: IBlisOptions){
        this.init(options);
    }

    private async init(options: IBlisOptions) {
        try {
            BlisDebug.Log("Creating client...");
            this.blisClient = new BlisClient(options.serviceUri, options.user, options.secret);

            // Create App
            this.appId = options.appId;
            if (this.appId && (options.appName || options.luisKey))
            {
                    BlisDebug.Log("No need for appName or listKey when providing appId");
            }
            else {
                BlisDebug.Log("Creating app...");
                this.appId = await this.blisClient.CreateApp(options.appName, options.luisKey);   // TODO parameter validation
            }
            BlisDebug.Log(`Using AppId ${this.appId}`);

            // Load entities
            if (options.entityList)
            {
                for (let entityName of options.entityList)
                {
                    BlisDebug.Log(`Adding new LUIS entity: ${entityName}`);
                    let entityId = await this.blisClient.AddEntity(this.appId, entityName, "LOCAL", null);
                    BlisDebug.Log(`Added entity: ${entityId}`);
                }
            }

            // Load prebuilt
            if (options.prebuiltList)
            {
                for (let prebuiltName of options.prebuiltList)
                {
                    BlisDebug.Log(`Adding new LUIS pre-build entity: ${prebuiltName}`);
                    let prebuiltId = await this.blisClient.AddEntity(this.appId, prebuiltName, "LUIS", prebuiltName);
                    BlisDebug.Log(`Added prebuilt: ${prebuiltId}`);
                }
            }

            // Create location, datetime and forecast entities
        //   var locationEntityId = await this.blisClient.AddEntity(this.appId, "location", "LUIS", "geography");
        //    var datetimeEntityId = await this.blisClient.AddEntity(this.appId, "date", "LUIS", "datetime");
        //    var forecastEntityId = await this.blisClient.AddEntity(this.appId, "forecast", "LOCAL", null);

            // Create actions
    //      var whichDayActionId = await this.blisClient.AddAction(this.appId, "Which day?", new Array(), new Array(datetimeEntityId), null);
    //      var whichCityActionId = await this.blisClient.AddAction(this.appId, "Which city?", new Array(), new Array(locationEntityId), null);
    //      var forecastActionId = await this.blisClient.AddAction(this.appId, "$forecast", new Array(forecastEntityId), new Array(), null);

            // Train model
   //TEMP         this.modelId = await this.blisClient.TrainModel(this.appId);

            // Create session
            BlisDebug.Log(`Creating session...`);
            this.sessionId = await this.blisClient.StartSession(this.appId, this.modelId);
            BlisDebug.Log(`Created Session: ${this.sessionId}`);
        }
        catch (err) {
            BlisDebug.Log(err);
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
        var test = await this.ReadFromFile(url)
        let snipObj = JSON.parse(test);
        this.TrainOnSnippetList(recognizer, snipObj.snippetlist);
    }

    private async TrainOnSnippetList(recognizer : BlisRecognizer, sniplist : Snippet[]) : Promise<void>
    {
        // Extract actions and add them
        let actionList = [];
        for (let snippet of sniplist)
        {
            for (let turn of snippet.turns)
            {
                if (!actionList.includes(turn.action))
                {
                    await this.blisClient.AddAction(this.appId, turn.action);
                    actionList.push(turn.action);
                }
            }
        }
        BlisDebug.Log(`Found ${actionList.length} actions.`)    
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
        text += "!next => Start new dialog\n\n";
        text += "!next teach => Start new teaching dialog\n\n"
        text += "!createApp {appName} => Create new application with current luisKey\n\n"
        text += "!createApp {appName} {luisKey} => Create new application\n\n"
        text += "!deleteApp => Delete existing application\n\n"
        text += "!deleteApp {appId} => Delete specified application\n\n"
        text += "!startApp => Switch to appId\n\n"
        text += "!whichApp => Return current appId\n\n"
        text += "!trainDialogs {file url} => Train in dialogs at given url"
        text += "!deleteAction {actionId} => Delete an action on current app\n\n"
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
                if (command == "!reset")
                {
                    //TODO: reset
                }
                // On Next restart session dialog
                else if (command == "!next")
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
                else 
                {
                    result.answer = this.Help();
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
                    this.blisClient.TakeTurn(this.appId, this.sessionId, text, this.LUCallback, null, 
                        (response : TakeTurnResponse) => {

                            if (response.mode == TakeTurnModes.Teach)
                            {
                                // Markdown requires double carraige returns
                                var output = response.action.content.replace(/\n/g,":\n\n");
                                result.answer = output;
                            }
                            else if (response.mode == TakeTurnModes.Action)
                            {
                                let outText = this.InsertEntities(response.actions[0].content);
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

    
    private InsertEntities(text: string)
    {
        let words = [];
        let tokens = text.split(' ').forEach((item) => 
        {
            if (item.startsWith('$')) 
            {
                let name = item;                  // LARS TODO WAS: ent_name = item[1:] - why the 1:?
 //TODO               let value = this.hist[name];
 //               words.push(value);
            }
            else
            {
                words.push(item);
            }
        });
        return words.join(' ');
    }
}
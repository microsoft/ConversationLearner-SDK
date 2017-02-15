import * as builder from 'botbuilder';
import * as request from 'request';
import { TakeTurnRequest } from './Model/TakeTurnRequest'
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
    protected appId : String;
    protected sessionId : String;
    protected modelId : String;
    protected LUCallback : (text: String, luisEntities : [{}]) => TakeTurnRequest;
    
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

    private async NewSession(teach : boolean) : Promise<void>
    {
       this.blisClient.EndSession(this.appId, this.sessionId).then(async (string) =>
       {
          this.sessionId = await this.blisClient.StartSession(this.appId, this.modelId);
       });
    }

    public recognize(context: builder.IRecognizeContext, cb: (error: Error, result: IBlisResult) => void): void {
        
        var result: IBlisResult = { score: 1.0, answer: "yo", intent: null };
        
        if (context && context.message && context.message.text) {
            var text = context.message.text.trim();
            var words = text.split(' ');

            if (words[0] == "!reset")
            {
                //TODO: reset
            }
            // On Next restart session dialog
            else if (words[0] == "!next")
            {
                let teach = (words[1] && words[1] == 'teach');
                this.NewSession(teach);
                result.score = 0.0;
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
                        else {
                            result.answer = `Don't know mode: ${response.mode}`;
                        }
                        cb(null,result);
                    }
                );
            }
        }
    }

    
    private InsertEntities(text: String)
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
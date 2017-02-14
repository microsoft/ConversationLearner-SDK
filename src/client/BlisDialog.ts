import * as builder from '../../node_modules/botbuilder';
import { BlisClient } from './client';
import { Entity, TakeTurnResponse, TakeTurnModes } from '../client/Model/TakeTurnResponse'
import { TakeTurnRequest } from './Model/TakeTurnRequest'
var util = require('util');

//TODOimport { QnAMakerRecognizer, IQnAMakerResult, IQnAMakerOptions } from './QnAMakerRecognizer'; 

export interface IBlisResult extends builder.IIntentRecognizerResult {
    answer: string;
}

export class BlisDialog extends builder.Dialog {
	/*private answerThreshold: number;
	private defaultNoMatchMessage: string;
    private recognizers: builder.IntentRecognizerSet;*/
    protected blisClient : BlisClient;
    protected appId : String;
    protected sessionId : String;
    protected modelId : String;
    protected LUCallback : (text: String, luisEntities : [{}]) => TakeTurnRequest;

    constructor(){
        super();
    }

    private async init() {
        this.blisClient = new BlisClient("http://dialog.centralus.cloudapp.azure.com/", "ccastro@microsoft.com", "002a6a39-7ae3-49f5-a737-baf289d44f6f");

        // Create App
        this.appId = await this.blisClient.CreateApp("Test1", "e740e5ecf4c3429eadb1a595d57c14c5");

        // Create location, datetime and forecast entities
        var locationEntityId = await this.blisClient.AddEntity(this.appId, "location", "LUIS", "geography");
        var datetimeEntityId = await this.blisClient.AddEntity(this.appId, "date", "LUIS", "datetime");
        var forecastEntityId = await this.blisClient.AddEntity(this.appId, "forecast", "LOCAL", null);

        // Create actions
        var whichDayActionId = await this.blisClient.AddAction(this.appId, "Which day?", new Array(), new Array(datetimeEntityId), null);
        var whichCityActionId = await this.blisClient.AddAction(this.appId, "Which city?", new Array(), new Array(locationEntityId), null);
        var forecastActionId = await this.blisClient.AddAction(this.appId, "$forecast", new Array(forecastEntityId), new Array(), null);

        // Train model
        this.modelId = await this.blisClient.TrainModel(this.appId);

        // Create session
        this.sessionId = await this.blisClient.StartSession(this.appId, this.modelId);
    }

    public async replyReceived(session: builder.Session, recognizeResult?: builder.IIntentRecognizerResult): Promise<void> {
        if (!recognizeResult) {
            var locale = session.preferredLocale();
            var context = <builder.IRecognizeDialogContext>session.toRecognizeContext();
            context.dialogData = session.dialogData;
            context.activeDialog = true;
            this.recognize(context, (error, result) => {
                    var blisResult = result as IBlisResult;
                    try {
                        if (!error) {
                            this.invokeAnswer(session, recognizeResult);
                        }
                    } catch (e) {
                        this.emitError(session, e);
                    }
                }
            );
        } else {
            this.invokeAnswer(session, recognizeResult);
        }
    }

    private invokeAnswer(session: builder.Session, recognizeResult: builder.IIntentRecognizerResult): void {
        // TODO threshold
        var blisResult = recognizeResult as IBlisResult;
        session.send(blisResult.answer);
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

            this.blisClient.TakeTurn(this.appId, this.sessionId, text, this.LUCallback, null, 
                (response : TakeTurnResponse) => {

                    if (response.mode == TakeTurnModes.Teach)
                    {
                        result.answer = "> " + response.action.content;
                    }
                    else if (response.mode == TakeTurnModes.Action)
                    {
                        let outText = this.InsertEntities(response.actions[0].content);
                        result.answer = "> " + outText;
                    } 
                    else {
                        result.answer = `> Don't know mode: ${response.mode}`;
                    }
                    cb(null,result);
                }
            );
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

	private emitError(session: builder.Session, err: Error): void {
		var m = err.toString();
		err = err instanceof Error ? err : new Error(m);
		session.error(err);
	}
}
import * as builder from 'botbuilder';
import { ActionTypes, UserInput, PredictedEntity, ExtractResponse, ScoreInput, ScoredAction } from 'blis-models'
import { BlisRecognizer, IBlisResult } from './BlisRecognizer';
import { BlisDebug } from './BlisDebug';
import { Utils } from './Utils';
import { BlisMemory } from './BlisMemory';
import { BlisClient } from './BlisClient';
import { BlisContext} from './BlisContext';
import { BLIS_INTENT_WRAPPER } from './Model/Consts';
import { Server } from './Http/Server';
import { AzureFunctions } from './AzureFunctions'

export interface IBlisOptions extends builder.IIntentRecognizerSetOptions {
    // URL for BLIS service
    serviceUri: string;

    // BLIS User Name
    user: string;

    // BLIS Secret
    secret: string;

    // BLIS application to employ
    appId?: string; 

    redisServer: string;

    redisKey: string;

    // Optional callback than runs after LUIS but before BLIS.  Allows Bot to substitute entities
    luisCallback? : (text: string, predictedEntities : PredictedEntity[], memory : BlisMemory) => ScoreInput;

    // Optional callback that runs after BLIS is called but before the Action is rendered
    blisCallback? : (text : string, memory : BlisMemory) => string;

    // Mapping between API names and functions
    apiCallbacks? : { string : () => void };

    // End point for Azure function calls
    azureFunctionsUrl? : string;

    // Key for Azure function calls (optional)
    azureFunctionsKey? : string;

    // Optional connector, required for downloading train dialogs
    connector? : builder.ChatConnector;
}

export class BlisDialog extends builder.Dialog {

    public static dialog : BlisDialog;

    // Create singleton
    public static Init(bot : builder.UniversalBot, options: IBlisOptions) : BlisDialog
    {
        this.dialog = new BlisDialog(bot, options);
        return this.dialog;
    }

   // Optional callback than runs after LUIS but before BLIS.  Allows Bot to substitute entities
    private luisCallback? : (text: string, predictedEntities : PredictedEntity[], memory : BlisMemory) => ScoreInput;

    // Mapping between user defined API names and functions
    private apiCallbacks : { string : () => void };

    private blisRecognizer : BlisRecognizer;
    private recognizers: builder.IntentRecognizerSet;


    protected blisCallback : (test : string, memory : BlisMemory) => string;
    protected connector : builder.ChatConnector;
    protected defaultApp : string;

    private constructor(private bot : builder.UniversalBot, private options: IBlisOptions) {
        super();

        try {
            BlisDebug.InitLogger(bot)

            this.blisRecognizer = new BlisRecognizer();
            this.recognizers = new builder.IntentRecognizerSet({ recognizers: [this.blisRecognizer]});

            BlisDebug.Log("Creating client....");
            BlisClient.Init(options.serviceUri, options.user, options.secret, options.azureFunctionsUrl, options.azureFunctionsKey);
            BlisMemory.Init(options.redisServer, options.redisKey);

            this.luisCallback = options.luisCallback;
            this.apiCallbacks = options.apiCallbacks;
            this.blisCallback = options.blisCallback;

            // Optional connector, required for downloading train dialogs
            this.connector = options.connector;  
            this.defaultApp = options.appId;
            

            Server.Init();
        }
            catch (error) {
            BlisDebug.Error(error);
        }
    }
    
    /** Called when a new reply message has been received from a user. */
    public async replyReceived(session: builder.Session, recognizeResult?: builder.IIntentRecognizerResult): Promise<void> 
    {
        if (!recognizeResult) {
            var locale = session.preferredLocale();
            var context = <builder.IRecognizeDialogContext>session.toRecognizeContext();
            context.dialogData = session.dialogData;
            context.activeDialog = true;
            this.recognize(context, (error, result) => {
                    var blisResult = result as IBlisResult;
                    try {
                        if (!error) {
                            this.invokeAnswer(session, blisResult);
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

    /** Parses the users utterance and assigns a score from 0.0 - 1.0 indicating
     * how confident the dialog is that it understood the users utterance.  */
    public recognize(context: builder.IRecognizeContext, cb: (error: Error, result: IBlisResult) => void): void {
        this.recognizers.recognize(context, cb);
    }

    public recognizer(plugin: builder.IIntentRecognizer): this {
        // Append recognizer
        this.recognizers.recognizer(plugin);
        return this;
    }

    private invokeAnswer(session: builder.Session, recognizeResult: builder.IIntentRecognizerResult): void {

         this.ProcessInput(session, async () => {
         });
        
    }

    private async ProcessInput(session: builder.Session, cb : () => void) : Promise<void>
    {
        
        let context = new BlisContext(this.bot, session);

        let memory = context.Memory();
        let inTeach = await memory.BotState().InTeach();
        let appId = await  memory.BotState().AppId();
        let sessionId = await memory.BotState().SessionId();
        let userInput = new UserInput(session.message);

        // Teach inputs are handled via API calls from the BLIS api
        if (!inTeach)
        {
            // Call the entity extractor
            try
            {
                let extractResponse = await BlisClient.client.SessionExtract(appId, sessionId, userInput)

                await this.ProcessExtraction(appId, sessionId, memory, extractResponse.text, extractResponse.predictedEntities);
            }
            catch (error)
            {
                let msg = BlisDebug.Error(error);
                await Utils.SendText(this.bot, memory, msg);
            }  
        }
    }

    private async ProcessExtraction(appId : string, sessionId : string, memory : BlisMemory, text : string, predictedEntities : PredictedEntity[] )
    {
            // Call LUIS callback
            let scoreInput = await this.CallLuisCallback(text, predictedEntities, memory);
            
            // Call the scorer
            let scoreResponse = await BlisClient.client.SessionScore(appId, sessionId, scoreInput);

            // Get best action
            let bestAction = scoreResponse.scoredActions[0];

            // Take the action
            if (bestAction)
            {
                this.TakeAction(bestAction, memory);
 
                // If action isn't terminal loop through another time
                if (!bestAction.isTerminal)
                {
                    await this.ProcessExtraction(appId, sessionId, memory, "", []);
                }
            }
    }

    public async TakeAction(scoredAction : ScoredAction, memory : BlisMemory) : Promise<void>
    {
        let actionType = scoredAction.metadata.actionType;

        switch (actionType)  {
            case ActionTypes.TEXT:
                await this.TakeTextAction(scoredAction, memory);
                break;
            case ActionTypes.CARD:
                await this.TakeCardAction(scoredAction, memory);
                break;
            case ActionTypes.INTENT:
                await this.TakeIntentAction(scoredAction, memory);
                break;
            case ActionTypes.API_AZURE:
                await this.TakeAzureAPIAction(scoredAction, memory);
                break;
            case ActionTypes.API_LOCAL:
                await this.TakeLocalAPIAction(scoredAction, memory);
                break;
        }
    }

    private async TakeTextAction(scoredAction : ScoredAction, memory : BlisMemory) : Promise<void>
    {
        let outText = await this.CallBlisCallback(scoredAction, memory);
        await Utils.SendText(this.bot, memory, outText);
    }

    private async TakeCardAction(scoredAction : ScoredAction, memory : BlisMemory) : Promise<void>
    {
        //TODO
    }

    private async TakeLocalAPIAction(scoredAction : ScoredAction, memory : BlisMemory) : Promise<void>
    {
        if (!this.apiCallbacks)
        {
            BlisDebug.Error("No Local APIs defined.")
            return;
        }

        // Extract API name and entities
        let apiString = scoredAction.payload;
        let [apiName] = apiString.split(' ');
        let args = Utils.RemoveWords(apiString, 1);

        // Make any entity substitutions
        let entities = await memory.BotMemory().SubstituteEntities(args);

        let api = this.apiCallbacks[apiName];
        if (!api)
        {
            BlisDebug.Error(`${api} undefined`);
            return;
        }

        let output = await api(memory, args);
        if (output)
        {
            await Utils.SendText(this.bot, memory, output);
        }  
    }

    private async TakeAzureAPIAction(scoredAction : ScoredAction, memory : BlisMemory) : Promise<void>
    {
        // Extract API name and entities
        let apiString = scoredAction.payload;
        let [funcName] = apiString.split(' ');
        let args = Utils.RemoveWords(apiString, 1);

        // Make any entity substitutions
        let entities = await memory.BotMemory().SubstituteEntities(args);

        // Call Azure function and send output (if any)
        let output = await AzureFunctions.Call(BlisClient.client.azureFunctionsUrl, BlisClient.client.azureFunctionsKey, funcName, entities);
        if (output)
        {
            await Utils.SendText(this.bot, memory, output);
        }          
    }

    private async TakeIntentAction(scoredAction : ScoredAction, memory : BlisMemory) : Promise<void>
    {
        // Extract intent name and entities
        let apiString = scoredAction.payload;
        let [intentName] = apiString.split(' ');
        let args = Utils.RemoveWords(apiString, 1);

        // Make any entity substitutions
        let entities = await memory.BotMemory().GetEntities(args);
        let session = memory.BotState().Session(this.bot);

        // If in teach mode wrap the intent so can give next input cue when intent dialog completes
        let inTeach = memory.BotState().InTeach();
        if (inTeach == "true")
        {
            session.beginDialog(BLIS_INTENT_WRAPPER, {intent: intentName, entities: entities});
        }
        else
        {
            session.beginDialog(intentName, entities);
        }                
    }

    public async CallLuisCallback(text: string, predictedEntities : PredictedEntity[], memory : BlisMemory) : Promise<ScoreInput> {
        let scoreInput = await this.DefaultLuisCallback(text, predictedEntities, memory);
        return scoreInput;
        /* TODO handle passed in JS func
        return new Promise(function(resolve,reject) {
            if (this.luisCallback)
            {
                this.luisCallback(text, predictedEntities, memory, (scoreInput : ScoreInput) =>
                {
                    resolve(scoreInput);
                });
            }
            else
            {
                this.DefaultLuisCallback(text, predictedEntities, memory, (scoreInput : ScoreInput) =>
                {
                    resolve(scoreInput);
                });           
            }
        });*/
    }

    private async CallBlisCallback(scoredAction : ScoredAction, memory : BlisMemory) : Promise<string> {
        let outText = await this.DefaultBlisCallback(scoredAction.payload, memory);
        return outText;
        /* TODO handle passed in JS func
        return new Promise(function(resolve,reject) {
            if (this.luisCallback)
            {
                this.blisCallback(text, predictedEntities, memory, (scoreInput : ScoreInput) =>
                {
                    resolve(scoreInput);
                });
            }
            else
            {
                this.DefaultLuisBlisCallback(text, predictedEntities, memory, (scoreInput : ScoreInput) =>
                {
                    resolve(scoreInput);
                });           
            }
        });*/
    }

    public async DefaultLuisCallback(text: string, predictedEntities : PredictedEntity[], memory : BlisMemory) : Promise<ScoreInput>
    {
        for (var predictedEntity of predictedEntities)
        // Update entities in my memory
        {
            // If negative entity will have a positive counter entity
            if (predictedEntity.metadata && predictedEntity.metadata.positiveId)
            {
                await memory.BotMemory().ForgetEntity(predictedEntity);
            }
            else
            {
                await memory.BotMemory().RememberEntity(predictedEntity);
            }

            // If entity is associated with a task, make sure task is active
            /*
            if (predictedEntity.metadata && predictedEntity.metadata.task)
            {
                // If task is no longer active, clear the memory
                let remembered = await memory.BotMemory().WasRemembered(predictedEntity.metadata.task);
                if (!remembered)
                {
                    await memory.BotMemory().ForgetByLabel(predictedEntity);
                }
            }
            */
        }

        // Get entities from my memory
        var filledEntities = await memory.BotMemory().RememberedIds();

        let scoreInput = new ScoreInput({   
            filledEntities: filledEntities,
            context: null,
            maskedActions: []
        });
        return scoreInput;
    }

    private async DefaultBlisCallback(text: string, memory : BlisMemory) : Promise<string>
    {
        let outText = await memory.BotMemory().Substitute(text);
        return outText;
    }


	private emitError(session: builder.Session, err: Error): void {
		var m = err.toString();
		err = err instanceof Error ? err : new Error(m);
		session.error(err);
	}
}
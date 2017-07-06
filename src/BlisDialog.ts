import * as builder from 'botbuilder';
import { ActionTypes, UserInput, PredictedEntity, ExtractResponse, ScoreInput, ScoredAction } from 'blis-models'
import { BlisRecognizer, IBlisResult } from './BlisRecognizer';
import { BlisDebug } from './BlisDebug';
import { Utils } from './Utils';
import { Menu } from './Menu';
import { BlisMemory } from './BlisMemory';
import { BlisClient } from './BlisClient';
import { EditableResponse } from './Model/EditableResponse';
import { BlisContext} from './BlisContext';
import { BLIS_INTENT_WRAPPER } from './Model/Consts';
import { Action } from './Model/Action';
import { Server } from './Http/Server';

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

    // Mappting between API names and functions
    //TODO  apiCallbacks? : { string : () => TakeTurnRequest };

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
    public static Init(bot : builder.UniversalBot, options: IBlisOptions)
    {
        this.dialog = new BlisDialog(bot, options);
    }

   // Optional callback than runs after LUIS but before BLIS.  Allows Bot to substitute entities
    private luisCallback? : (text: string, predictedEntities : PredictedEntity[], memory : BlisMemory) => ScoreInput;

    // Mapping between user defined API names and functions
    // TODO private apiCallbacks : { string : () => TakeTurnRequest };

    private recognizers: builder.IntentRecognizerSet;


    protected blisCallback : (test : string, memory : BlisMemory) => string;
    protected connector : builder.ChatConnector;
    protected defaultApp : string;

    private constructor(private bot : builder.UniversalBot, private options: IBlisOptions) {
        super();

        try {
            BlisDebug.InitLogger(bot)

            var recognizer = new BlisRecognizer();
            this.recognizers = new builder.IntentRecognizerSet({ recognizers: [recognizer]});

            BlisDebug.Log("Creating client....");
            BlisClient.Init(options.serviceUri, options.user, options.secret, options.azureFunctionsUrl, options.azureFunctionsKey);
            BlisMemory.Init(options.redisServer, options.redisKey);

            this.luisCallback = options.luisCallback;
            //TODO this.apiCallbacks = options.apiCallbacks;

            // Optional connector, required for downloading train dialogs
            this.connector = options.connector;  
            this.defaultApp = options.appId;
            this.blisCallback = options.blisCallback;

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

        // Send utterance to server for entity extraction
        if (inTeach) {
            let extractResponse = await BlisClient.client.TeachExtract(appId, sessionId, userInput);
        }
        else
        {
            // Call the entity extractor
            let extractResponse = await BlisClient.client.SessionExtract(appId, sessionId, userInput)

            // Call LUIS callback
            let scoreInput = await this.CallLuisCallback(extractResponse.text, extractResponse.predictedEntities, memory);
            
            // Call the scorer
            let scoreResponse = await BlisClient.client.SessionScore(appId, sessionId, scoreInput);

            // Get best action
            let bestAction = scoreResponse.scoredActions[0];

            // Take the action
            if (bestAction)
            {
                this.TakeAction(context, bestAction);
            }
        }
    }

    public async TakeAction(context : BlisContext, scoredAction : ScoredAction)
    {
        let actionType = scoredAction.metadata.actionType;

        switch (actionType)  {
            case ActionTypes.TEXT:
                let outText = await this.CallBlisCallback(scoredAction, context.Memory());
                Utils.SendTextMessage(context, outText);
                break;
            case ActionTypes.CARD:
            case ActionTypes.INTENT:
            case ActionTypes.API_AZURE:
            case ActionTypes.API_LOCAL:
            break;
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
                await memory.BotMemory().ForgetByLabel(predictedEntity);
            }
            else
            {
                await memory.BotMemory().RememberByLabel(predictedEntity);
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

    //==============================================================================
    private invokeAnswer_v1(session: builder.Session, recognizeResult: builder.IIntentRecognizerResult): void {

        var blisResult = recognizeResult as IBlisResult;
        blisResult.recognizer.invoke_v1(session, (err, blisResponse) =>
        { 
            if (err)
            { 
                session.send(err.message);
                return;
            }
            
            // If reponses present, send to user
            if (blisResponse.responses)
            {            
                let carousel = null;
                for (let response of blisResponse.responses)
                {
                    if (response instanceof builder.SuggestedActions)
                    {
                        // Add suggested actions to carousel
                        if (carousel)
                        {
                            carousel.suggestedActions(response);
                        }
                    }
                    else if (typeof response == 'string')
                    {
                        // Send existing carousel if next entry is text
                        if (carousel)
                        {
                            session.send(carousel);
                            carousel = null
                        }
                        session.send(response);
                    }
                    else if (response == null) 
                    {
                        // Send existing carousel if empty entry
                        if (carousel)
                        {
                            session.send(carousel);
                            carousel = null
                        }
                    }
                    else if (response instanceof EditableResponse)
                    {
                        // Send existing carousel if next entry is text
                        if (carousel)
                        {
                            session.send(carousel);
                            carousel = null
                        }
                        response.Send(session);
                    }
                    else
                    {
                        if (!carousel)
                        {
                            carousel = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel);
                        }
                        carousel.addAttachment(response);
                    }
                }
                if (carousel)
                {
                    session.send(carousel);
                }
            }

            // If intent present, fire the intent
            if (blisResponse.intent)
            {
                // If in teach mode wrap the intent so can give next input cue when intent dialog completes
                let context = new BlisContext(null, session);
                let memory = context.Memory();
                memory.BotState().InTeachSync((err, inTeach) =>
                {
                    if (inTeach == "true")
                    {
                        session.beginDialog(BLIS_INTENT_WRAPPER, {intent: blisResponse.intent, entities: blisResponse.entities});
                    }
                    else
                    {
                        session.beginDialog(blisResponse.intent, blisResponse.entities);
                    }
                });
            }
        });
    }

	private emitError(session: builder.Session, err: Error): void {
		var m = err.toString();
		err = err instanceof Error ? err : new Error(m);
		session.error(err);
	}
}
import * as builder from 'botbuilder';
import { PredictedEntity, ScoreInput, ScoredAction, EntityBase } from 'blis-models';
import { IBlisResult } from './BlisRecognizer';
import { BlisMemory } from './BlisMemory';
import { ClientMemoryManager } from './Memory/ClientMemoryManager';
export declare const BLIS_INTENT_WRAPPER = "BLIS_INTENT_WRAPPER";
export interface IBlisOptions extends builder.IIntentRecognizerSetOptions {
    serviceUri: string;
    user: string;
    secret: string;
    redisServer: string;
    redisKey: string;
    luisCallback?: (text: string, predictedEntities: PredictedEntity[], memoryManager: ClientMemoryManager) => ScoreInput;
    blisCallback?: (text: string, memoryManager: ClientMemoryManager) => string | builder.Message;
    apiCallbacks?: {
        string: (memoryManager: ClientMemoryManager, args: any[]) => string | builder.Message;
    };
    azureFunctionsUrl?: string;
    azureFunctionsKey?: string;
    connector?: builder.ChatConnector;
}
export declare class BlisDialog extends builder.Dialog {
    private bot;
    static dialog: BlisDialog;
    static Init(bot: builder.UniversalBot, options: IBlisOptions): BlisDialog;
    static readonly Instance: BlisDialog;
    private luisCallback?;
    apiCallbacks: {
        string: (memoryManager: ClientMemoryManager, args: any[]) => void;
    };
    private blisRecognizer;
    private recognizers;
    protected blisCallback: (test: string, memoryManager: ClientMemoryManager) => string | builder.Message;
    protected connector: builder.ChatConnector;
    private constructor();
    /** Called when a new reply message has been received from a user. */
    replyReceived(session: builder.Session, recognizeResult?: builder.IIntentRecognizerResult): Promise<void>;
    /** Parses the users utterance and assigns a score from 0.0 - 1.0 indicating
     * how confident the dialog is that it understood the users utterance.  */
    recognize(context: builder.IRecognizeContext, cb: (error: Error, result: IBlisResult) => void): void;
    recognizer(plugin: builder.IIntentRecognizer): this;
    private invokeAnswer(session, recognizeResult);
    private ProcessInput(session, cb);
    private ProcessExtraction(appId, sessionId, memory, text, predictedEntities, allEntities);
    TakeAction(scoredAction: ScoredAction, memory: BlisMemory, allEntities: EntityBase[]): Promise<void>;
    private TakeTextAction(scoredAction, memory, allEntities);
    private TakeCardAction(scoredAction, memory, allEntities);
    private TakeLocalAPIAction(scoredAction, memory, allEntities);
    private TakeAzureAPIAction(scoredAction, memory, allEntities);
    private TakeIntentAction(scoredAction, memory, allEntities);
    CallLuisCallback(text: string, predictedEntities: PredictedEntity[], memory: BlisMemory, allEntities: EntityBase[]): Promise<ScoreInput>;
    private CallBlisCallback(scoredAction, memory, allEntities);
    DefaultLuisCallback(text: string, predictedEntities: PredictedEntity[], memoryManager: ClientMemoryManager): Promise<ScoreInput>;
    private DefaultBlisCallback(text, memoryManager);
    private emitError(session, err);
}

import * as builder from 'botbuilder';
import { TakeTurnRequest } from './Model/TakeTurnRequest'
import { LuisEntity } from './Model/LuisEntity'

/** Entity returned from LUIS */
export interface LuisEntity {
    
    /** Type of entity */
    type : string;

    /** Actual extracted entity */
    entity : string;

    /** Additional entity detail in JSON */
    resolution : {}; 
}

/** Request sent to BLIS */
export interface TakeTurnRequest
{
    /** Text inclued in the request */
    text : string;

    /** LUIS entities to send with the request */
    entities : LuisEntity[];

    /** TODO - how to describe this */
    context : {};
 
    /** Actions exclude from the response */
    actionMask : string[];
}

/** Options used to configure an IBlisOptions. */
export interface IBlisOptions {
    /** URL for BLIS service */
    serviceUri: string;

    /** BLIS User Name */
    user: string;

    /** BLIS Secret */
    secret: string;

    /** (Optional) Id of BLIS app to employ  */
    appId?: string;

    /** (Optional) appName of BLIS app to create - if no appId supplied */
    appName?: string;

    /** (Optional) luisKey to use when creating a new BLIS app - if no appId supplied */
    luisKey?: string;

    // GET RID OF?  
    entityList?: [string];
    prebuiltList?: [string];

    /** (Optional) Callback than runs after LUIS but before BLIS.  Allows Bot to substitute entities */
    luisCallback? : (text: string, luisEntities : LuisEntity[]) => TakeTurnRequest;

    /** (Optional) Callback that runs after BLIS is called but before the Action is rendered */
    blisCallback? : (text : string) => string;

    /** (Optional) Mappting between API names and functions */
    apiCallbacks? : { string : () => TakeTurnRequest };
}

/** Results returned by an Bliss recognizer. */
export interface IBlisResult extends builder.IIntentRecognizerResult {
    /** Top answer that was matched with score greater than the specified threshold. */
    answer: string;
}

/**
* Blis recognizer plugin fetches answers for users utterances using Blid)
* @param options used to initialize the recognizer.
*/
export class BlisRecognizer implements builder.IIntentRecognizer {
    /**
    * Constructs a new instance of the recognizer.
    * @param options used to initialize the recognizer.
    */
    constructor(options: IBlisOptions);

    /** Attempts to match a users text utterance and retrieves the best matching answer. */
    public recognize(context: builder.IRecognizeContext, cb: (error: Error, result: IBlisResult) => void): void;
}

/** Fetches the best matching answer response from Blis. */
export class BlisDialog extends builder.Dialog {
    /**  
    * Constructs a new instance of an BlisDialog.
    * @param options used to initialize the dialog.
    */
    constructor(options: IBlisOptions);

    /**
    * Processes messages received from the user. Called by the dialog system. 
    * @param session Session object for the current conversation.
    * @param recognizeResult (Optional) recognition results returned from a prior call to the dialogs [recognize()](#recognize) method. 
    */
    replyReceived(session: builder.Session, recognizeResult?: builder.IIntentRecognizerResult): void;

    /** Attempts to find an answer to users text utterance from QnA Maker knowledge base. */
    recognize(context: builder.IRecognizeContext, cb: (error: Error, result: IBlisResult) => void): void;

    /**
     * Adds a new recognizer plugin to the QnA Maker dialog.
     * @param plugin The recognizer to add. 
     */
    recognizer(plugin: builder.IIntentRecognizer): BlisDialog;
}
import * as builder from 'botbuilder';

/** Options used to configure an IBlisOptions. */
export interface IBlisOptions {

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
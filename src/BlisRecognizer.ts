import * as builder from 'botbuilder';

export interface IBlisResult extends builder.IIntentRecognizerResult {
   recognizer: BlisRecognizer;
}

export class BlisRecognizer implements builder.IIntentRecognizer {

    /** Receive input from user and returns a score */
    public recognize(reginput: builder.IRecognizeContext, recCb: (error: Error, result: IBlisResult) => void): void 
    {  
        // Always recognize, but score is less than 1.0 so prompts can still win
        var result: IBlisResult = { recognizer: this, score: 0.4, intent: null, entities : null };

        // Send callback
        recCb(null, result);
    }
}
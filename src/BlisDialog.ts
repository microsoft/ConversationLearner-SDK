import * as builder from 'botbuilder';
import { BlisRecognizer, IBlisResult, IBlisOptions } from './BlisRecognizer';
import { BlisDebug } from './BlisDebug';
import { Utils } from './Utils';
import { Menu } from './Menu';

export class BlisDialog extends builder.Dialog {

    private recognizers: builder.IntentRecognizerSet;

    constructor(private options: IBlisOptions) {
        super();
        // LARS TEMP options.intentThreshold = 0.05;
        this.recognizers = new builder.IntentRecognizerSet(options);
    }

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

    public recognize(context: builder.IRecognizeContext, cb: (error: Error, result: IBlisResult) => void): void {
        this.recognizers.recognize(context, cb);
    }

    public recognizer(plugin: builder.IIntentRecognizer): this {
        // Append recognizer
        this.recognizers.recognizer(plugin);
        return this;
    }

    private invokeAnswer(session: builder.Session, recognizeResult: builder.IIntentRecognizerResult): void {

        var blisResult = recognizeResult as IBlisResult;
        blisResult.recognizer.invoke(session, (err, blisResponse) =>
        { 
            if (err)
            { 
                session.send(err.message);
                return;
            }

            // Clear memory of last posts
            session.conversationData.lastPosts = [];

            // If reponses present, send to user
            if (blisResponse.responses)
            {            
                let carousel = null;
                for (let response of blisResponse.responses)
                {
                    if (response instanceof builder.SuggestedActions)
                    {
                        // Add suggested actions to carosel
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
                            Utils.SendAndRemember(session, carousel);
                            carousel = null
                        }
                        Utils.SendAndRemember(session, response);
                    }
                    else if (response == null) 
                    {
                        // Send existing carousel if empty entry
                        if (carousel)
                        {
                            Utils.SendAndRemember(session, carousel);
                            carousel = null
                        }
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
                    Utils.SendAndRemember(session, carousel);
                }
            }

            // If intent present, fire the intent
            if (blisResponse.intent)
            {
                session.replaceDialog(blisResponse.intent, blisResponse.entities);
            }
        });
    }


	private emitError(session: builder.Session, err: Error): void {
		var m = err.toString();
		err = err instanceof Error ? err : new Error(m);
		session.error(err);
	}
}
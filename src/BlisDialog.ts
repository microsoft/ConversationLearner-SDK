import * as builder from 'botbuilder';
import { BlisRecognizer, IBlisResult, IBlisOptions } from './BlisRecognizer';
import { BlisDebug } from './BlisDebug';

export class BlisDialog extends builder.Dialog {

    private recognizers: builder.IntentRecognizerSet;

    constructor(private options: IBlisOptions) {
        super();
        this.recognizers = new builder.IntentRecognizerSet(options);
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
        // TODO: Consider adding threshold
        var blisResult = recognizeResult as IBlisResult;

        let carousel = null;
        for (let response of blisResult.responses)
        {
            if (typeof response == 'string')
            {
                // Send existing carousel if next entry is text
                if (carousel)
                {
                    session.send(carousel);
                    carousel = null
                }
                session.send(response);
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

	private emitError(session: builder.Session, err: Error): void {
		var m = err.toString();
		err = err instanceof Error ? err : new Error(m);
		session.error(err);
	}
}
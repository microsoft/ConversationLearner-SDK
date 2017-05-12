import * as builder from 'botbuilder';
import { BlisDebug } from '../BlisDebug';

export class EditableResponse {

    public original : builder.IIsAttachment = null;
    public replacement : builder.IIsAttachment = null;
    public buttons : string[];
    public address : builder.IAddress;

    constructor(session: builder.Session, original : builder.IIsAttachment, replacement : builder.IIsAttachment, buttons : string[]){
        this.original = original;
        this.replacement = replacement;
        this.buttons = buttons;
        this.address = null;
        
        if (!session.userData.editableResponses)
        {
            session.userData.editableResponses = [];
        }
        session.userData.editableResponses.push(this);
    }

    /** Send message and remember it's address */
    public Send(session : builder.Session)
    {
        var msg = new builder.Message(session)
            .addAttachment(this.original);

        session.send(msg).sendBatch((err : any, addresses :any) =>
        {
            this.address = addresses[0];
            session.save().sendBatch();
        });
    }

    /** Check if button is mapped to replacable message, if so replace it */
    public static Clear(session: builder.Session) : void
    {
        session.userData.editableResponses = [];
    }

    /** Check if button is mapped to replacable message, if so replace it */
    public static Replace(session: builder.Session, buttonText : string) : void
    {
        let editableResponses : EditableResponse[] = session.userData.editableResponses;
        if (editableResponses)
        {
            for (let editableResponse of editableResponses)
            {
                if (editableResponse.address)
                {
                    for (let button of editableResponse.buttons)
                    {
                        // If button matches replace it
                        if (button == buttonText)
                        {
                            // Generate replacement message
                            var msg = new builder.Message(session)
                            .address(editableResponse.address)
                            .text("gotcha!");
                         //   .addAttachment(editableResponse.replacement);
                           
                            // Clear response cache
                            this.Clear(session);

                            // Post it
                            //session.connector.update(msg.toMessage(), function (err, address) 
                            session.connector.delete(editableResponse.address, function(err) {
                                if (err) {
                                    BlisDebug.Error(err);
                                }
                            });
                            return;
                        }
                    }
                }
            }
        }
    }
}
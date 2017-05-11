import * as builder from 'botbuilder';
import * as util from 'util';
import * as request from 'request';
import { BlisContext } from './BlisContext';

export class Utils  {
    
    /** Add hero card and keyboard to reponse list */  // NOT CURRENTL USED
    public static AddHeroKeyboard(responses: any, title : string, subtitle : string, text : string, buttons : {}) : void
    {
        responses.push(this.MakeHero(title, subtitle, text, []));
        responses.push(this.MakeKeyboard(buttons));
    } 

    /** Make hero card with buttons */
    public static MakeHero(title : string, subtitle : string, text : string, buttons : {}) : builder.HeroCard
    {
        var buttonList : builder.CardAction[] = [];
        for (var message in buttons)
        {
            var postback = buttons[message];
            buttonList.push(builder.CardAction.postBack(null, postback, message));
        }

        var card = new builder.HeroCard()
						.title(title)
						.subtitle(subtitle)
						.text(text)		
						.buttons(buttonList);	
        return card;
    }

    /** Make hero card with a keyboard */  // NOT CURRENTLY USED
    public static MakeKeyboard(buttons : {}) : builder.SuggestedActions
    {
        let buttonList : builder.CardAction[] = [];
        for (var message in buttons)
        {
            var postback = buttons[message];
            buttonList.push(builder.CardAction.postBack(null, postback, message));
        }

        return builder.SuggestedActions.create(null, buttonList);
    }

    public static SendTyping(bot : builder.UniversalBot, address : any)
    {
        let msg = <builder.IMessage>{ type: 'typing'};
        msg.address = address;
        bot.send(msg);
    }

    /** Send an out of band message */
    public static SendMessage(context : BlisContext, content : string | builder.IIsAttachment | builder.SuggestedActions)
    { 
        let message = new builder.Message()
			.address(context.Address());

        if (content instanceof builder.SuggestedActions)
        {
            let msg = new builder.Message(context.session).suggestedActions(content);
            context.bot.send(msg);
            return;
        }
        else if (typeof content == 'string')
        {
            message.text(content);
        }
        else
        {
            message.addAttachment(content);
        }
        context.session.send(message);
    }

    /** Send a group of out of band message */
    public static SendResponses(context : BlisContext, responses : (string | builder.IIsAttachment | builder.SuggestedActions)[])
    {
        for (let response of responses)
        {
            Utils.SendMessage(context, response);
        }
    }

    public static SendAsAttachment(context : BlisContext, content: string)
    {
        var base64 = Buffer.from(content).toString('base64');

        let msg =  new builder.Message();
        (<any>msg).data.address = context.Address();
        let contentType = "text/plain";
        let attachment : builder.IAttachment =  
        {
            contentUrl: util.format('data:%s;base64,%s', contentType, base64),
            contentType: contentType,
            content: content
        }
        msg.addAttachment(attachment);
        context.bot.send(msg);
    }

    /** Send a message and remember it's address */
    // Notes: User must call:  session.save().sendBatch() after calling this
    public static SendAndRemember(session : builder.Session, message: string | string[] | builder.IMessage | builder.IIsMessage | builder.Message, ...args: any[])
    {
       session.send(message);
       return;
        /* TODO: code for editing dialogs
        session.send(message).sendBatch((err : any, addresses :any) =>
            {
                if (!session.conversationData.lastPosts)
                {
                    session.conversationData.lastPosts = addresses;
                }
                else
                {
                     session.conversationData.lastPosts.concat(addresses);
                }
                session.save().sendBatch();
            });
            */
    }
        
    /** Delete previous message batch */
    public static DeleteLastMessages(session : builder.Session)
    {
        if (session.conversationData.lasPosts)
        {
            for (var address of session.conversationData.lastPosts)
            {
                session.connector.delete(address, (err) =>
                    {
                        if (err)
                        {
                            session.error(err);
                        }
                    }
                )
            }
        }
        else
        {
            session.send("No messages to delete.");
        }
    }

    /** Handle that catch clauses can be any type */
    public static ErrorString(error : any) : string
    {
        if (typeof error == 'string')
        {
            return error;
        }
        else if (error.message)
        {
            return error.message + "\n\n" + error.stack;
        }
        return JSON.stringify(error);
    }

    /** Handle that catch clauses can be any type */
    public static ErrorCard(message : string, subtext = null) : builder.HeroCard
    {
        let title = `**ERROR**\n\n`;
        return Utils.MakeHero(title, message, subtext, null);
    }

    public static ReadFromFile(url : string) : Promise<string>
    {
        return new Promise(
            (resolve, reject) => {
                const requestData = {
                    url: url, 
                    json: true,
                    encoding : 'utf8'
                }
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body.message);
                    }
                    else {
                        let model = String.fromCharCode.apply(null, body.data);
                        resolve(model);
                    }

                });
            }
        )
    }

    /** Remove words from start from command string */
    public static RemoveWords(text : string, numWords : number) : string 
    {
       let firstSpace = text.indexOf(' ');
       let remaining = (firstSpace > 0) ? text.slice(firstSpace+1) : "";
       numWords--; 
       if (numWords == 0)
       {
           return remaining;
       }
       return this.RemoveWords(remaining, numWords); 
    }
}
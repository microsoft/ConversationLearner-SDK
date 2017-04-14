import * as builder from 'botbuilder';
import * as util from 'util';
import * as request from 'request';
import { BlisContext } from './BlisContext';

export class Utils  {
    
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

    public static SendTyping(bot : builder.UniversalBot, address : any)
    {
        let msg = <builder.IMessage>{ type: 'typing'};
        msg.address = address;
        bot.send(msg);
    }

    /** Send an out of band message */
    public static SendMessage(context : BlisContext, content : string | builder.IIsAttachment)
    { 
        let message = new builder.Message()
			.address(context.address);

        if (typeof content == 'string')
        {
            message.text(content);
        }
        else
        {
            message.addAttachment(content);
        }
        context.bot.send(message);
    }

    /** Send a group of out of band message */
    public static SendResponses(context : BlisContext, responses : (string|builder.IIsAttachment)[])
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
        (<any>msg).data.address = context.address;
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

    /** Handle that catch clauses can be any type */
    public static ErrorString(error) : string
    {
        if (typeof error == 'string')
        {
            return error;
        }
        else if (error.message)
        {
            return error.message;
        }
        return JSON.stringify(error);
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
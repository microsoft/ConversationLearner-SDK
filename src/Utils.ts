import * as builder from 'botbuilder';
import * as util from 'util';
import * as request from 'request';
import { BlisContext } from './BlisContext';
import { BlisMemory } from './BlisMemory';

export class Utils  {

    public static SendTyping(bot : builder.UniversalBot, address : any)
    {
        let msg = <builder.IMessage>{ type: 'typing'};
        msg.address = address;
        bot.send(msg);
    }

    /** Send a text message */
    public static SendText(memory : BlisMemory, content : string)
    { 
        let address = memory.BotState().Address();
        let session = memory.BotState().Session();

        let message = new builder.Message()
			.address(address)
            .text(content);
       
        session.send(message);
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
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
    public static async SendMessage(bot : builder.UniversalBot, memory : BlisMemory, content : string | builder.Message)
    { 
        let address = await memory.BotState.Address();
        let session = await memory.BotState.Session(bot);

        if (typeof content !== 'string') {
            session.send(content);
        }
        else { 
            let message = new builder.Message()
                .address(address)
                .text(content);
        
            session.send(message);
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

    public static PrebuiltDisplayText(prebuiltType: string, resolution: any) : string {
        switch (prebuiltType) {
            case "builtin.datetimeV2.date":
                let date = resolution.values[0].value;
                if (resolution.values[1]) {
                    date += ` or ${resolution.values[1].value}`;
                }
                return date;
            case "builtin.datetimeV2.time":
                let time = resolution.values[0].value;
                if (resolution.values[1]) {
                    time += ` or ${resolution.values[1].value}`;
                }
                return time;
            case "builtin.datetimeV2.daterange":
                return `${resolution.values[0].start} to ${resolution.values[0].end}`
            case "builtin.datetimeV2.timerange":
                return `${resolution.values[0].start} to ${resolution.values[0].end}`
            case "builtin.datetimeV2.datetimerange":
                return `${resolution.values[0].start} to ${resolution.values[0].end}`
            case "builtin.datetimeV2.duration":
                return `${resolution.values[0].value} seconds`
            case "builtin.datetimeV2.set":
                return `${resolution.values[0].value}`
            case "builtin.number":
                return resolution.value;
            case "builtin.ordinal":
                return resolution.value;
            case "builtin.temperature":
            return resolution.value;
            case "builtin.dimension":
                return resolution.value;
            case "builtin.money":
                return resolution.value;
            case "builtin.age":
                return resolution.value;
            case "builtin.percentage":
                return resolution.value;
            case "builtin.geography.city":
                return resolution.value;
            case "builtin.geography.country":
                return resolution.value;
            case "builtin.geography.pointOfInterest":
                return resolution.value;
            case "builtin.encyclopedia":	
            default:
                return null;
        }
    }
}
import * as BB from 'botbuilder-core';
//LARSOLD import * as util from 'util';
import * as request from 'request';
import { BlisContext } from './BlisContext';
import { BlisMemory } from './BlisMemory';
import { TrainExtractorStep, TextVariation, LabeledEntity, TrainDialog, TrainRound } from 'blis-models';
import { BlisIntent } from './BlisIntent';

export class Utils  {

    public static SendTyping(bot : BB.Bot, address : any)
    {
        /*LARSTODO
        let msg = <builder.IMessage>{ type: 'typing'};
        msg.address = address;
        bot.post(msg);
        */
    }

    // TEMP: Until we re-jigger object types.  Need to be stripped
    public static StripPrebuiltInfoFromTrain(trainDialog: TrainDialog) : TrainDialog {
        return new TrainDialog(
            {
                trainDialogId: trainDialog.trainDialogId,
                version: trainDialog.version,
                packageCreationId: trainDialog.packageCreationId,
                packageDeletionId: trainDialog.packageDeletionId,
                rounds: trainDialog.rounds.map(r => 
                    new TrainRound({
                        scorerSteps: r.scorerSteps,
                        extractorStep: this.StripPrebuiltInfo(r.extractorStep)
                    }))
            }
        )
    }
    
    // TEMP: Until we re-jigger object types.  Need to be stripped
    public static StripPrebuiltInfo(trainExtractorStep: TrainExtractorStep) : TrainExtractorStep {
        return new TrainExtractorStep(
            {
                textVariations: trainExtractorStep.textVariations.map(tv => new TextVariation
                    ({
                    text: tv.text,
                    labelEntities: tv.labelEntities.map(le => 
                        { 
                            let nle = new LabeledEntity({...le});
                            delete nle.builtinType;
                            delete nle.resolution
                            return nle;
                        })
                    })
                )
            }
        )
    }
    /** Send a text message */
    public static async SendMessage(bot : BB.Bot, memory : BlisMemory, content : string /*LARSTODO | builder.Message*/)
    { 
        if (memory) {
            await memory.BotState.SendMessage(bot, content);
/* LARSTODO
            if (typeof content !== 'string') {
                botContext.send(content);
            }
            else { 
                botContext.reply(content);
            }*/
        }
    }

    /** Send an intent */
    public static async SendIntent(bot : BB.Bot, memory : BlisMemory, intent : BlisIntent)
    { 
        if (memory) {
            await memory.BotState.SendIntent(bot, intent);
        }
    }

    public static SendAsAttachment(context : BlisContext, content: string)
    {
        /*LARSTODO
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
        context.botContext.bot.post(msg);
        */
    }

    /** Trick to get errors to render on Azure */
    private static ReplaceErrors(key: any, value: any) {
        if (value instanceof Error) {
            var error = {};
    
            Object.getOwnPropertyNames(value).forEach(function (key) {
                error[key] = value[key];
            });
    
            return error;
        }
    
        return value;
    }

    /** Handle that catch clauses can be any type */
    public static ErrorString(error : any, context: string = "") : string
    {
        let prefix = context ? `${context}: ` : "";
        try {
            if (!error) {
                return prefix + "Unknown";
            }
            else if (!error.body)
            {
                if (typeof error == 'string') {
                    return prefix + error;
                } 
                else {
                    return prefix + JSON.stringify(error, this.ReplaceErrors);
                }
            }
            else if (error.body.message) {
              return prefix + error.body.message;
            }
            else if (error.body.errorMessages) {
              return prefix + error.body.errorMessages.join();
            }
            else if (typeof error.body == 'string') {
              return prefix + error.body;
            }
            else {
              return prefix + JSON.stringify(error.body);
            }
          }
          catch (e) {
            return prefix + `Error Parsing Failed`;//: ${Object.prototype.toString.call(e)} ${JSON.stringify(e)}`;
          }
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
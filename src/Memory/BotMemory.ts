import { JsonProperty } from 'json-typescript-mapper';
import { ActionCommand } from '../Model/Consts';
import { BlisMemory } from '../BlisMemory';
import { BlisDebug} from '../BlisDebug';
import { PredictedEntity, Memory } from 'blis-models';
import * as builder from 'botbuilder'

export class BotMemory 
{
    private static MEMKEY = "BOTMEMORY";

    public entityMap : {};

    public static memory : BlisMemory;

    public constructor(init?:Partial<BotMemory>)
    {
        this.entityMap = {};
        (<any>Object).assign(this, init);
    }

    public Serialize() : string
    {
        return JSON.stringify(this);
    }

    public static Deserialize(type : {new() : BotMemory }, text : string) : BotMemory
    {
        if (!text) return null;
        let json = JSON.parse(text);
        let botMemory = new BotMemory(
            {
                entityMap : json.entityMap ? json.entityMap : {}
            }
        );
        return botMemory;
    }

    private static async Get() : Promise<BotMemory>
    {
        if (!this.memory)
        {
            throw new Error("BotMemory called without initialzing memory");
        }
 
        let data = await this.memory.GetAsync(this.MEMKEY);
        if (data)
        {
            return BotMemory.Deserialize(BotMemory, data);
        } 
        return new BotMemory();  
    }

    private static async Set(entityLookup : BotMemory) : Promise<void>
    {
        if (!this.memory)
        {
            throw new Error("BotMemory called without initialzing memory");
        }
        await this.memory.SetAsync(this.MEMKEY, entityLookup.Serialize());
    }

    private static async Clear() : Promise<void>
    {
        let botMemory = new BotMemory();  
        await this.Set(botMemory);
    }

    private static async ToString() : Promise<string>
    {
        let msg = "";
        let botmemory = await this.Get();

        for (let entityName in botmemory.entityMap)
        {
            if (msg) msg += " ";
            let entityValue = botmemory.entityMap[entityName];
            msg += `[${entityName} : ${entityValue}]`;
        }
        if (msg == "") {
            msg = '[ - none - ]';
        }
        return msg;
    }

    /** Remember a predicted entity */
    private static async RememberEntity(predictedEntity : PredictedEntity) : Promise<void> {
        await this.Remember(predictedEntity.entityName, predictedEntity.entityText);
    }

    // Remember value for an entity
    public static async Remember(entityName: string, entityValue: string) : Promise<void> {

        let botmemory = await this.Get();

        // Check if entity buckets values
        if (entityName && entityName.startsWith(ActionCommand.BUCKET))
        {
            if (!botmemory.entityMap[entityName])
            {
                botmemory.entityMap[entityName] = [];
            }
            botmemory.entityMap[entityName].push(entityValue);
        }
        else
        {
            botmemory.entityMap[entityName] = entityValue;
        }
        await this.Set(botmemory);
    }

    /** Return array of entity names for which I've remembered something */
    public static async RememberedNames() : Promise<string[]>
    {
        let botmemory = await this.Get();
        return Object.keys(botmemory.entityMap);
    }


    /** Forget a predicted Entity */
    private static async ForgetEntity(predictedEntity : PredictedEntity) : Promise<void> {
        await this.Forget(predictedEntity.entityName, predictedEntity.entityText);
    }
    
    /** Forget an entity value */
    public static async Forget(entityName: string, entityValue : string) : Promise<void> {
        try {
            // Check if entity buckets values
            let botmemory = await this.Get();
            if (entityName.startsWith(ActionCommand.BUCKET))
            {
                // Find case insensitive index
                let lowerCaseNames = botmemory.entityMap[entityName].map(function(value) {
                    return value.toLowerCase();
                });

                let index = lowerCaseNames.indexOf(entityValue.toLowerCase());
                if (index > -1)
                {
                    botmemory.entityMap[entityName].splice(index, 1);
                    if (botmemory.entityMap[entityName].length == 0)
                    {
                        delete botmemory.entityMap[entityName];
                    }
                }    
            }
            else
            {
                delete botmemory.entityMap[entityName];
            }
            await this.Set(botmemory);
        }
        catch (error)
        {
             BlisDebug.Error(error);
        }  
    }

    public static async DumpMemory() : Promise<Memory[]>
    {
        // Check if entity buckets values
        let botmemory = await this.Get();

        let memory : Memory[];
        for (let entityName in botmemory.entityMap)
        {
            memory.push(new Memory({entityName:entityName, entityValue: botmemory.entityMap[entityName]}));
        }
        return memory;
    }

     //--------------------------------------------------------
    // SUBSTITUTIONS
    //--------------------------------------------------------
    private static async EntityValue(entityName : string) : Promise<any>
    {
        let botmemory = await this.Get();

        let value = botmemory.entityMap[entityName];
        if (typeof value == 'string')
        {
            return <string>value;
        }

        // Print out list in friendly manner
        let group = "";
        for (let key in value)
        {
            let index = +key;
            let prefix = "";
            if (value.length != 1 && index == value.length-1)
            {
                prefix = " and ";
            }
            else if (index != 0)
            {
                prefix = ", ";
            }
            group += `${prefix}${value[key]}`;
        }
        return group;  
    }

    public static async GetEntities(text: string) : Promise<builder.IEntity[]> {
        let entities = [];
        let words = this.Split(text);
        for (let word of words) 
        {
            if (word.startsWith(ActionCommand.SUBSTITUTE))
            {
                // Key is in form of $entityName
                let entityName = word.substr(1, word.length-1);

                let entityValue = <string> await this.EntityValue(entityName);
                if (entityValue) {
                    entities.push({ 
                        type: entityName,
                        entity: entityValue
                    });
                    text = text.replace(word, entityValue);
                }
            }
        }
        return entities;
    }

    public static async SubstituteEntities(text: string) : Promise<string> {
        let words = this.Split(text);
        for (let word of words) 
        {
            if (word.startsWith(ActionCommand.SUBSTITUTE))
            {
                // Key is in form of $entityName
                let entityName = word.substr(1, word.length-1);

                let entityValue = <string> await this.EntityValue(entityName);
                if (entityValue) {
                    text = text.replace(word, entityValue);
                }
            }
        }
        return text;
    }

    /** Extract contigent phrases (i.e. [,$name]) */
    private static SubstituteBrackets(text : string) : string {
        
        let start = text.indexOf('[');
        let end = text.indexOf(']');

        // If no legal contingency found
        if (start < 0 || end < 0 || end < start) 
        {
            return text;
        }

        let phrase = text.substring(start+1, end);

        // If phrase still contains unmatched entities, cut phrase
        if (phrase.indexOf(ActionCommand.SUBSTITUTE) > 0)
        {
            text = text.replace(`[${phrase}]`, "");
        }
        // Otherwise just remove brackets
        else
        {
            text = text.replace(`[${phrase}]`, phrase);
        }
        return this.SubstituteBrackets(text);
    }

    public static Split(action : string) : string[] {
        return action.split(/[\s,:.?!\[\]]+/);
    }

    public static async Substitute(text: string) : Promise<string> {
        // Clear suggestions
        text = text.replace(` ${ActionCommand.SUGGEST}`," ");

        // First replace all entities
        text = <string> await this.SubstituteEntities(text);

        // Remove contingent entities
        text = this.SubstituteBrackets(text);
        return text;
    }
}
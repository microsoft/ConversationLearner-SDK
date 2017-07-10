import { JsonProperty } from 'json-typescript-mapper';
import { ActionCommand } from '../Model/Consts';
import { BlisMemory } from '../BlisMemory';
import { BlisDebug} from '../BlisDebug';
import { PredictedEntity } from 'blis-models';
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

        for (let entityId in botmemory.entityMap)
        {
            if (msg) msg += " ";
            let entityName = await this.memory.EntityLookup().ToName(entityId);
            let entityValue = botmemory.entityMap[entityId];
            msg += `[${entityName} : ${entityValue}]`;
        }
        if (msg == "") {
            msg = '[ - none - ]';
        }
        return msg;
    }

    private static async RememberEntity(predictedEntity : PredictedEntity) : Promise<void> {

        let botmemory = await this.Get();

        // Check if entity buckets values
        if (predictedEntity.metadata.isBucket)
        {
            if (!botmemory.entityMap[predictedEntity.entityId])
            {
                botmemory.entityMap[predictedEntity.entityId] = [];
            }
            botmemory.entityMap[predictedEntity.entityId].push(predictedEntity.entityText);
        }
        else
        {
            botmemory.entityMap[predictedEntity.entityId] = predictedEntity.entityText;
        }
        await this.Set(botmemory);
    }

    // TODO - this old remember functions can likely go away
    private static async Remember(entityId: string, entityName: string, entityValue: string) : Promise<void> {

        let botmemory = await this.Get();

        // Check if entity buckets values
        if (entityName && entityName.startsWith(ActionCommand.BUCKET))
        {
            if (!botmemory.entityMap[entityId])
            {
                botmemory.entityMap[entityId] = [];
            }
            botmemory.entityMap[entityId].push(entityValue);
        }
        else
        {
            botmemory.entityMap[entityName] = entityValue;
        }
        await this.Set(botmemory);
    }

    public static async RememberByName(entityName: string, entityValue: string) : Promise<void> {
        let entityId = <string> await this.memory.EntityLookup().ToId(entityName);
        if (entityId)
        {
            await this.Remember(entityId, entityName, entityValue);
        } 
        else
        {
            BlisDebug.Error(`Unknown Entity: ${entityId}`);
        }
    }

    
    public static async RememberById(entityId: string, entityValue: string) : Promise<void> {
        let entityName = <string> await this.memory.EntityLookup().ToName(entityId);
        if (entityName)
        {
            await this.Remember(entityId, entityName, entityValue);
        } 
        else
        {
            BlisDebug.Error(`Unknown Entity: ${entityName}`);
        }
    }  

    // Returns true if entity was remembered
    public static async WasRemembered(entityId : string) : Promise<boolean> {
        let botmemory = await this.Get();
        return (botmemory.entityMap[entityId] != null);
    }

    /** Return array of entityIds for which I've remembered something */
    public static async RememberedIds() : Promise<string[]>
    {
        let botmemory = await this.Get();
        return Object.keys(botmemory.entityMap);
    }

    /** Forget an entity by Id */
    private static async ForgetEntity(predictedEntity : PredictedEntity) : Promise<void> {
        try {
            // Check if entity buckets values
            let botmemory = await this.Get();
            if (predictedEntity.metadata.isBucket)
            {
                // Find case insensitive index
                let lowerCaseNames = botmemory.entityMap[predictedEntity.entityId].map(function(value) {
                    return value.toLowerCase();
                });

                let index = lowerCaseNames.indexOf(predictedEntity.entityText.toLowerCase());
                if (index > -1)
                {
                    botmemory.entityMap[predictedEntity.entityId].splice(index, 1);
                    if (botmemory.entityMap[predictedEntity.entityId].length == 0)
                    {
                        delete botmemory.entityMap[predictedEntity.entityId];
                    }
                }    
            }
            else
            {
                delete botmemory.entityMap[predictedEntity.entityId];
            }
            await this.Set(botmemory);
        }
        catch (error)
        {
             BlisDebug.Error(error);
        }  
    }
    /** Forget an entity by Id */
    private static async Forget(entityId: string, entityName: string, entityValue : string) : Promise<void> {
        try {
            // Check if entity buckets values
            let botmemory = await this.Get();
            if (entityName.startsWith(ActionCommand.BUCKET))
            {
                // Find case insensitive index
                let lowerCaseNames = botmemory.entityMap[entityId].map(function(value) {
                    return value.toLowerCase();
                });

                let index = lowerCaseNames.indexOf(entityValue.toLowerCase());
                if (index > -1)
                {
                    botmemory.entityMap[entityId].splice(index, 1);
                    if (botmemory.entityMap[entityId].length == 0)
                    {
                        delete botmemory.entityMap[entityId];
                    }
                }    
            }
            else
            {
                delete botmemory.entityMap[entityId];
            }
            await this.Set(botmemory);
        }
        catch (error)
        {
             BlisDebug.Error(error);
        }  
    }

 /** Forget an entity */
    public static async ForgetByName(entityName : string, entityValue : string) : Promise<void> {
        let entityId = <string> await this.memory.EntityLookup().ToId(entityName);
        if (entityId)
        {
            await this.Forget(entityId, entityName, entityValue);
        } 
        else
        {
            BlisDebug.Error(`Unknown Entity: ${entityId}`);
        }
    }

    /** Forget an entity by Id */
    public static async ForgetById(entityId: string, entityValue : string) : Promise<void> {
        let entityName = <string> await this.memory.EntityLookup().ToName(entityId);
        if (entityName)
        {
            await this.Forget(entityId, entityName, entityValue);
        } 
        else
        {
            BlisDebug.Error(`Unknown Entity: ${entityName}`);
        }
    }

     //--------------------------------------------------------
    // SUBSTITUTIONS
    //--------------------------------------------------------
    private static async EntityValue(entityName : string) : Promise<any>
    {
        let entityId = <string> await this.memory.EntityLookup().ToId(entityName);
 
        let botmemory = await this.Get();

        let value = botmemory.entityMap[entityId];
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
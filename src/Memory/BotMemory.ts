import { BlisMemory } from '../BlisMemory';
import { BlisDebug} from '../BlisDebug';
import { Memory, PredictedEntity } from 'blis-models';
import * as builder from 'botbuilder'

export const ActionCommand =
{
    SUBSTITUTE: "$",
    NEGATIVE: "~"
}

export class EntityMemory
{
    public constructor(public id : string, public value : string = null, public bucket : string[] = []) {};
}

export class BotMemory 
{
    private static _instance : BotMemory = null;
    private static MEMKEY = "BOTMEMORY";
    private memory : BlisMemory;
    public entityMap : {[key: string] : EntityMemory };

    private constructor(init?:Partial<BotMemory>)
    {
        this.entityMap = {};
        (<any>Object).assign(this, init);
    }

    public static Get(blisMemory : BlisMemory) : BotMemory
    {
        if (!BotMemory._instance) {
            BotMemory._instance = new BotMemory();
        }
        BotMemory._instance.memory = blisMemory;
        return BotMemory._instance;
    }

    private async Init() : Promise<void>
    {
        if (!this.memory)
        {
            throw new Error("BotMemory called without initialzing memory");
        }
 
        let data = await this.memory.GetAsync(BotMemory.MEMKEY);
        if (data)
        {
            this.Deserialize(data);
        } 
        else {
            this.Clear();
        }
    }

    public Serialize() : string
    {
        return JSON.stringify(this);
    }

    private Deserialize(text : string) : void
    {
        if (!text) return null;
        let json = JSON.parse(text);
        this.entityMap = json.entityMap ? json.entityMap : {};
    }

    private async Set() : Promise<void>
    {
        if (!this.memory)
        {
            throw new Error("BotMemory called without initialzing memory");
        }
        await this.memory.SetAsync(BotMemory.MEMKEY, this.Serialize());
    }

    public async Clear() : Promise<void>		
    {		
        this.entityMap = {};
        await this.Set();		
    }

    /** Remember a predicted entity */		
    public async RememberEntity(predictedEntity : PredictedEntity) : Promise<void> {		
        let isBucket = predictedEntity.metadata ? predictedEntity.metadata.isBucket : false;		
        await this.Remember(predictedEntity.entityName, predictedEntity.entityId, predictedEntity.entityText, isBucket);		
    }

    // Remember value for an entity
    public async Remember(entityName: string, entityId: string, entityValue: string, isBucket: boolean = false) : Promise<void> {

        await this.Init();

        if (!this.entityMap[entityName])
        {
            this.entityMap[entityName] = new EntityMemory(entityId);
        }

        // Check if entity buckets values
        if (isBucket)
        {
            // Add if not a duplicate
            if (this.entityMap[entityName].bucket.indexOf(entityValue) < 0) {
                this.entityMap[entityName].bucket.push(entityValue);
            }
        }
        else
        {
            this.entityMap[entityName].value = entityValue;
        }
        await this.Set();
    }

    /** Return array of entity names for which I've remembered something */
    public async RememberedNames() : Promise<string[]>
    {
        await this.Init();
        return Object.keys(this.entityMap);
    }

    /** Return array of entity Ids for which I've remembered something */
    public async RememberedIds() : Promise<string[]>
    {
        await this.Init();
        return Object.keys(this.entityMap).map(function(val) { return this.entityMap[val].id }, this);
    }

    /** Given negative entity name, return positive version **/		
    private PositiveName(negativeName: string) : string		
    {		
        if (negativeName.startsWith(ActionCommand.NEGATIVE)) {		
            return negativeName.slice(1);		
        }		
        return null;		
    }

    /** Forget a predicted Entity */		
    public async ForgetEntity(predictedEntity : PredictedEntity) : Promise<void> {		
        let isBucket = predictedEntity.metadata ? predictedEntity.metadata.isBucket : false;		
        let posName = this.PositiveName(predictedEntity.entityName);		
        if (posName) {		
             await this.Forget(posName, predictedEntity.entityText, isBucket);		
        }		
    }

    /** Forget an entity value */
    public async Forget(entityName: string, entityValue : string = null, isBucket : boolean = false) : Promise<void> {
        try {
            // Check if entity buckets values
            await this.Init();
            if (isBucket)
            {
                // Entity might not be in memory
                if (!this.entityMap[entityName]) {
                    return;
                }

                // If no entity Value provide, clear the entity
                if (!entityValue) {
                    delete this.entityMap[entityName];
                }
                else {
                    // Find case insensitive index
                    let lowerCaseNames = this.entityMap[entityName].bucket.map(function(value) {
                        return value.toLowerCase();
                    });

                    let index = lowerCaseNames.indexOf(entityValue.toLowerCase());
                    if (index > -1)
                    {
                        this.entityMap[entityName].bucket.splice(index, 1);
                        if (this.entityMap[entityName].bucket.length == 0)
                        {
                            delete this.entityMap[entityName];
                        }
                    }    
                }
            }
            else
            {
                delete this.entityMap[entityName];
            }
            await this.Set();
        }
        catch (error)
        {
             BlisDebug.Error(error);
        }  
    }

    public async DumpMemory() : Promise<Memory[]>
    {
        // Check if entity buckets values
        await this.Init();

        let memory : Memory[] = [];
        for (let entityName in this.entityMap)
        {
            memory.push(new Memory({entityName:entityName, entityValue: this.EntityValueAsString(entityName)}));
        }
        return memory;
    }

    public async Value(entityName: string) : Promise<string> {
        await this.Init()
        return this.EntityValueAsString(entityName);
    }

    public async ValueAsList(entityName: string) : Promise<string[]> {
        await this.Init()
        return this.EntityValueAsList(entityName);
    } 

    //--------------------------------------------------------
    // SUBSTITUTIONS
    //--------------------------------------------------------
    private EntityValueAsList(entityName : string) : string[]
    {
        if (!this.entityMap[entityName]) {
            return [];
        }
        
        if (this.entityMap[entityName].value)
        {
            return [this.entityMap[entityName].value];
        }

        return this.entityMap[entityName].bucket;  
    }

    private EntityValueAsString(entityName : string) : string
    {
        if (!this.entityMap[entityName]) {
            return null;
        }
        
        if (this.entityMap[entityName].value)
        {
            return this.entityMap[entityName].value;
        }

        // Print out list in friendly manner
        let group = "";
        for (let key in this.entityMap[entityName].bucket)
        {
            let index = +key;
            let prefix = "";
            if (this.entityMap[entityName].bucket.length != 1 && index == this.entityMap[entityName].bucket.length-1)
            {
                prefix = " and ";
            }
            else if (index != 0)
            {
                prefix = ", ";
            }
            group += `${prefix}${this.entityMap[entityName].bucket[key]}`;
        }
        return group;  
    }

    public async GetEntities(text: string) : Promise<builder.IEntity[]> {
        let entities = [];
        await this.Init();
        let words = this.Split(text);
        for (let word of words) 
        {
            if (word.startsWith(ActionCommand.SUBSTITUTE))
            {
                // Key is in form of $entityName
                let entityName = word.substr(1, word.length-1);

                let entityValue = this.EntityValueAsString(entityName);
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

    public async SubstituteEntities(text: string) : Promise<string> {
        let words = this.Split(text);
        await this.Init();
        for (let word of words) 
        {
            if (word.startsWith(ActionCommand.SUBSTITUTE))
            {
                // Key is in form of $entityName
                let entityName = word.substr(1, word.length-1);

                let entityValue = this.EntityValueAsString(entityName);
                if (entityValue) {
                    text = text.replace(word, entityValue);
                }
            }
        }
        return text;
    }

    /** Extract contigent phrases (i.e. [,$name]) */
    private SubstituteBrackets(text : string) : string {
        
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

    public Split(action : string) : string[] {
        return action.split(/[\s,:.?!\[\]]+/);
    }

    public async Substitute(text: string) : Promise<string> {

        // First replace all entities
        text = <string> await this.SubstituteEntities(text);

        // Remove contingent entities
        text = this.SubstituteBrackets(text);
        return text;
    }
}
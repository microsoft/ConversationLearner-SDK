import { BlisMemory } from '../BlisMemory';
import { deserialize, serialize } from 'json-typescript-mapper';

// TODO - eliminate need for this
export class EntityLookup  
{
    private static MEMKEY = "ENTITYLOOKUP";

    public toId : {};
    public toName : {};
    public static memory : BlisMemory;

    public constructor(init?:Partial<EntityLookup>)
    {
        this.toId = {};
        this.toName = {};
        (<any>Object).assign(this, init);
    }

    public Serialize() : string
    {
        return JSON.stringify(this);
    }

    public static Deserialize(type : {new() : EntityLookup }, text : string) : EntityLookup
    {
        if (!text) return null;
        let json = JSON.parse(text);
        let entityLookup = new EntityLookup(
            {
                toId : json.toId ? json.toId : {},
                toName  : json.toName ? json.toName : {}
            }
        );
        return entityLookup;
    }

    private static async Get() : Promise<EntityLookup>
    {
        if (!this.memory)
        {
            throw new Error("Entity Lookup called without initialzing memory");
        }
         // Load entityLookup
        let data = await this.memory.GetAsync(this.MEMKEY);
        if (data)
        {
            return EntityLookup.Deserialize(EntityLookup, data);
        } 
        return new EntityLookup();  
    }

    private static async Set(entityLookup : EntityLookup) : Promise<void>
    {
        if (!this.memory)
        {
            throw new Error("Entity Lookup called without initialzing memory");
        }
        await this.memory.SetAsync(this.MEMKEY, entityLookup.Serialize());
    }


    private static async Clear() : Promise<void>
    {
        let entityLookup = new EntityLookup();  
        await this.Set(entityLookup);
    }

    private static async ToString() : Promise<string>
    {
        let entityLookup = await this.Get();
        return JSON.stringify(entityLookup);
    }

    public static async Add(entityName: string, entityId : string) : Promise<void> {
        let entityLookup = await this.Get();    

        // Set values
        entityLookup.toId[entityName] = entityId;
        entityLookup.toName[entityId] = entityName;

        // Save
        await this.Set(entityLookup);
    }

    public static async Remove(entityName: string) : Promise<void> {
        let entityLookup = await this.Get(); 

        // Remove values
        delete entityLookup.toId[entityName];
        let entityId = entityLookup.toName[entityName];
        delete entityLookup.toName[entityId];

        // Save
        await this.Set(entityLookup);
    }

    /** Convert EntityName to EntityId */
    public static async ToId(entityName: string) : Promise<string> {
        let entityLookup = await this.Get(); 

        // Make independant of prefix
        entityName = entityName.replace('$','');

        // Return value
        return entityLookup.toId[entityName];
    }

    /** Convert EntityId to EntityName */
    public static async ToName(entityId: string) :  Promise<string> {
        let entityLookup = await this.Get(); 

        // Return value
        return entityLookup.toName[entityId];
    }

    /** Convert array entityIds into an array of entityNames */
    public static async Ids2Names(ids: string[]) : Promise<string[]> {
        let entityLookup = await this.Get(); 

        // Return values
        let names = [];
        for (let entityId of ids) 
        {   
            let name = entityLookup.toName[entityId]
            names.push(name);     
        }
        return names;
    }
}
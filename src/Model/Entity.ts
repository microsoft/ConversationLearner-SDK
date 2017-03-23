import { JsonProperty } from 'json-typescript-mapper';
import { BlisClient } from '../BlisClient';
import { BlisDebug} from '../BlisDebug';

export class Entity
{
    @JsonProperty('id')
    public id : string;

    @JsonProperty('EntityType')
    public entityType : string;

    @JsonProperty('LUISPreName')
    public luisPreName : string;

    @JsonProperty('name')
    public name : string;
    
    public constructor(init?:Partial<Entity>)
    {
        this.id = undefined;
        this.entityType = undefined;
        this.luisPreName = undefined;
        this.name = undefined;
        (<any>Object).assign(this, init);
    }

    public static async toText(client : BlisClient, appId : string, entityId : string) : Promise<string>
    {
        try {
            let entity = await client.GetEntity(appId, entityId);
            return entity.name;
        }
        catch (error)
        {
            BlisDebug.Log(`ERROR: ${error}`);
            throw(error);
        }
    }
}
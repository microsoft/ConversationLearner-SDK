import { JsonProperty } from 'json-typescript-mapper';

export class LuisEntity
{
    // Guid for Entity
    @JsonProperty('id')
    public id : string;

    // Guid for Entity or Pre-Build Name
    @JsonProperty('type')
    public type : string;

    // Entity Value
    @JsonProperty('entity')
    public value : string;

    public resolution : any; 

    public constructor(init?:Partial<LuisEntity>)
    {
        this.id = undefined;
        this.type = undefined;
        this.value = undefined;
        this.resolution = undefined;
        (<any>Object).assign(this, init);
    }
}
import { JsonProperty } from 'json-typescript-mapper';

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
}
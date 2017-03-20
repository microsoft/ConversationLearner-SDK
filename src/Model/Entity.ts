import { JsonProperty } from 'json-typescript-mapper';

export class Entity
{
    @JsonProperty('EntityType')
    public entityType : string;

    @JsonProperty('LUISPreName')
    public luisPreName : string;

    @JsonProperty('name')
    public name : number;
    
    public constructor(init?:Partial<Entity>)
    {
        this.entityType = undefined;
        this.luisPreName = undefined;
        this.name = undefined;
        (<any>Object).assign(this, init);
    }
}
import { JsonProperty } from 'json-typescript-mapper';
import { Entity } from './Entity';

export class TakeTurnRequest
{
    @JsonProperty('text')
    public text : string;

    @JsonProperty({clazz: Entity, name: 'entities'})
    public entities : Entity[];

    @JsonProperty('context')
    public context : {};
 
    @JsonProperty('action-mask')
    public actionMask : [string];

    public constructor(init?:Partial<TakeTurnRequest>)
    {
        this.text = undefined;
        this.entities = undefined;
        this.context = undefined;      
        this.actionMask = undefined;
        (<any>Object).assign(this, init);
    }

    public ToJSON() : {}
    {
        var json = {};
        if (this.text)  
            json['text'] = this.text;
        if (this.entities)  
            json['entities'] = this.entities;
        if (this.context)  
            json['context'] = this.context;
        if (this.actionMask)  
            json['action-mask'] = this.context;
        return json;
    }
}
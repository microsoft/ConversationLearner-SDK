import { JsonProperty } from 'json-typescript-mapper';
import { EntityMetaData_v1 } from './Entity';

/** Entity matched in a user's string */
export class LabelEntity
{
    /** Start char number in string containing the entity */
    @JsonProperty('endIndex')
    public endIndex : number; 

    /** Matched entity value */
    @JsonProperty('entity')
    public value : string;

    /** Match score (0-1) */
    @JsonProperty('score')
    public score : number;

    /** End char number in the string containing the entity */
    @JsonProperty('startindex')
    public startIndex : number;

    /** The entityID of the matched entity */
    @JsonProperty('id')
    public id : string;

    /** The metadate for the entity */
    @JsonProperty({clazz: EntityMetaData_v1, name: 'metadata'})
    public metadata : EntityMetaData_v1;

    /** The entityID of the matched entity or prebuld name */
    @JsonProperty('type')
    public type : string;

    public resolution : any; 

    public constructor(init?:Partial<LabelEntity>)
    {
        this.endIndex = null;
        this.value = null;
        this.score = null;
        this.startIndex = null;
        this.id = null;
        this.metadata = null;
        this.type = null;
        this.resolution = null;
        (<any>Object).assign(this, init);
    }
}
import { JsonProperty } from 'json-typescript-mapper';

/** Entity matched in a user's string */
export class LabelEntity
{
    /** Start char number in string containing the entity */
    @JsonProperty('endIndex')
    public endIndex : number; 

    /** Matched entity value */
    @JsonProperty('entity')
    public entityValue : string;

    /** Match score (0-1) */
    @JsonProperty('score')
    public score : number;

    /** End char number in the string containing the entity */
    @JsonProperty('startindex')
    public startIndex : number;

    /** The entityID of the matched entity */
    @JsonProperty('id')
    public entityId : string;

    /** The entityID of the matched entity or prebuld name */
    @JsonProperty('type')
    public type : string;

    public constructor(init?:Partial<LabelEntity>)
    {
        this.endIndex = null;
        this.entityValue = null;
        this.score = null;
        this.startIndex = null;
        this.entityId = null;
        this.type = null;
        (<any>Object).assign(this, init);
    }
}
import { JsonProperty } from 'json-typescript-mapper';

// TODO fix all commments
/** Action in response to a user's string */
export class LabelAction
{
    /** Start char number in string containing the entity */
    @JsonProperty('action_type')
    public actionType : string; 

    /** Matched entity value */
    @JsonProperty('available')
    public available : boolean;

    /** Match score (0-1) */
    @JsonProperty('content')
    public content : string;

    /** End char number in the string containing the entity */
    @JsonProperty('id')
    public id : string;

    /** The entityID of the matched entity */
    @JsonProperty('score')
    public score : number;
 
    public constructor(init?:Partial<LabelAction>)
    {
        this.actionType = null;
        this.available = null;
        this.content = null;
        this.id = null;
        this.score = null;
        (<any>Object).assign(this, init);
    }
}
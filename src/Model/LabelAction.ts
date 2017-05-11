import { JsonProperty } from 'json-typescript-mapper';

/** Action in response to a user's string */
export class LabelAction
{
    /** Type of action (API or TEXT)*/
    @JsonProperty('action_type')
    public actionType : string; 

    /** Can this action fire? */
    @JsonProperty('available')
    public available : boolean;

    /** Content of the action */
    @JsonProperty('content')
    public content : string;

    /** Id of the Action */
    @JsonProperty('id')
    public id : string;

    /** Score from 0-1 */
    @JsonProperty('score')
    public score : number;
 
    // When true RNN will pause for input
    // Defaults: text action = true / api action = false
    @JsonProperty('sequence_terminal')
    public waitAction : string[];

    public constructor(init?:Partial<LabelAction>)
    {
        this.actionType = null;
        this.available = null;
        this.content = null;
        this.id = null;
        this.score = null;
        this.waitAction = null;
        (<any>Object).assign(this, init);
    }
}
import { JsonProperty } from 'json-typescript-mapper';

export class Action
{
    @JsonProperty('action_type')
    public actionType : string;

    @JsonProperty('content')
    public content : string;

    public constructor()
    {
        this.actionType = undefined;
        this.content = undefined;
    }
}
import { JsonProperty } from 'json-typescript-mapper';

export class Action
{
    @JsonProperty('id')
    public id : string;

    @JsonProperty('action_type')
    public actionType : string;

    @JsonProperty('content')
    public content : string;

    @JsonProperty('NegativeEntities')
    public negativeEntities : string[];
    
    @JsonProperty('RequiredEntities')
    public requiredEntities : string[];

    public constructor(init?:Partial<Action>)
    {
        this.id = undefined;
        this.actionType = undefined;
        this.content = undefined;
        this.negativeEntities = undefined;
        this.requiredEntities = undefined;
        (<any>Object).assign(this, init);
    }

    public static GetEntitySuggestion(action : string) : string
    {
        if (!action) return null;

        let words = this.Split(action);
        for (let word of words) 
        {
            if (word.startsWith("!"))
            {
                // Key is in form of $entityName
                let entityName = word.substr(1, word.length-1);
                return entityName;
            }
        }
        return null;
    }
    
    public static Split(action : string) : string[] {
        return action.split(/[\s,:.?]+/);
    }
}
import { JsonProperty } from 'json-typescript-mapper';

export class Entity
{
}

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


export class TakeTurnResponse
{
    @JsonProperty('orig-text')
    public originalText : String;

    @JsonProperty({clazz: Entity, name: 'entities'})
    public entities : Entity[];

    @JsonProperty('mode')
    public mode : String;

    @JsonProperty({clazz: Action, name: 'actions'})
    public actions : Action[];

    @JsonProperty({clazz: Action, name: 'action'})
    public action : Action;

    public constructor(init?:Partial<TakeTurnResponse>)
    {
        this.originalText = undefined;
        this.entities = undefined;
        this.mode = undefined;
        this.actions = undefined;
        this.action = undefined;
        (<any>Object).assign(this, init);
    }
    
    public ToJSON() : {}
    {
        var json = {};
        if (this.originalText)  
            json['text'] = this.originalText;
        if (this.entities)  
            json['entities'] = this.entities;
        return json;
    }
}

export class TakeTurnModes
{
    public static Callback : String = "lu_callback";
    public static Teach : String = "teach";
    public static Action : String = "action";
}

export class ActionTypes
{
    public static Text = "text";
    public static API = "api";
}
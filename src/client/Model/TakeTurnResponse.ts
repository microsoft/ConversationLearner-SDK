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
    public originalText : string;

    @JsonProperty({clazz: Entity, name: 'entities'})
    public entities : Entity[];

    @JsonProperty('mode')
    public mode : string;

    @JsonProperty({clazz: Action, name: 'actions'})
    public actions : Action[];

    @JsonProperty({clazz: Action, name: 'action'})
    public action : Action;

    @JsonProperty('error')
    public error : string;

    public constructor(init?:Partial<TakeTurnResponse>)
    {
        this.originalText = undefined;
        this.entities = undefined;
        this.mode = undefined;
        this.actions = undefined;
        this.action = undefined;
        this.error = undefined;
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
    public static Callback : string = "lu_callback";
    public static Teach : string = "teach";
    public static Action : string = "action";
    public static Error : string = "error";
}

export class ActionTypes
{
    public static Text = "text";
    public static API = "api";
}
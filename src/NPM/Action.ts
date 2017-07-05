import { JsonProperty } from 'json-typescript-mapper';

export class ActionMetaData
{
    // APIType
    @JsonProperty('actionType')  
    public actionType : string;

    public constructor(init?:Partial<ActionMetaData>)
    {
        this.actionType = undefined;
        (<any>Object).assign(this, init);
    }

    public Equal(metaData : ActionMetaData) : boolean
    {
        if (this.actionType != metaData.actionType) return false;
        return true;
    }
}

export class ActionBase
{
    @JsonProperty('actionId')
    public actionId : string;

    @JsonProperty('payload')
    public payload : string;

    @JsonProperty('isTerminal')
    public isTerminal : boolean;

    @JsonProperty('requiredEntities')
    public requiredEntities : string[];

    @JsonProperty('negativeEntities')
    public negativeEntities : string[];

    @JsonProperty('version')
    public version : number;

    @JsonProperty('packageCreationId')
    public packageCreationId : number;

    @JsonProperty('packageDeletionId')
    public packageDeletionId : number;

    @JsonProperty({clazz: ActionMetaData, name: 'metadata'})
    public metadata : ActionMetaData;

    public constructor(init?:Partial<ActionBase>)
    {
        this.actionId = undefined;
        this.payload = undefined;
        this.isTerminal = undefined;
        this.requiredEntities = undefined;
        this.negativeEntities = undefined;
        this.version = undefined;
        this.packageCreationId = undefined;
        this.packageDeletionId = undefined;
        this.metadata = new ActionMetaData();
        (<any>Object).assign(this, init);
    } 
}

export class ActionList
{
    @JsonProperty('actions')  
    public actions : ActionBase[];

    public constructor(init?:Partial<ActionList>)
    {
        this.actions = undefined;
        (<any>Object).assign(this, init);
    }
}

export class ActionIdList
{
    @JsonProperty('actionIds')  
    public actionIds : string[];

    public constructor(init?:Partial<ActionIdList>)
    {
        this.actionIds = undefined;
        (<any>Object).assign(this, init);
    }
}
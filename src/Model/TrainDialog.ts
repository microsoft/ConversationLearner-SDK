import { JsonProperty } from 'json-typescript-mapper';

export class AltText
{
    @JsonProperty('text')  
    public text : string;
        
    public constructor(init?:Partial<Input>)
    {
        this.text = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TextEntity
{
    @JsonProperty('EndToken')  
    public endToken : number;

    @JsonProperty('EntityType')  
    public entityId : string;

    @JsonProperty('StartToken')  
    public startToken : number;

    public constructor(init?:Partial<Input>)
    {
        this.endToken = undefined;
        this.entityId = undefined;
        this.startToken = undefined;
        (<any>Object).assign(this, init);
    }
}

export class Input
{
    @JsonProperty('context')  
    public context : {};

    @JsonProperty('entities')
    public entityIds : string[];

    @JsonProperty('masked-actions')
    public maskedActionIds : string[];

    @JsonProperty('text')  
    public text : string;

    @JsonProperty({clazz: AltText, name: 'text-alts'})
    public textAlts : AltText[];

    @JsonProperty({clazz: TextEntity, name: 'text-entities'})
    public textEntities : TextEntity[];

    public constructor(init?:Partial<Input>)
    {
        this.context = undefined;
        this.entityIds = undefined;
        this.maskedActionIds = undefined;
        this.text = undefined;
        this.textAlts = undefined;
        this.textEntities = undefined;

        (<any>Object).assign(this, init);
    }
}

export class Turn
{
    @JsonProperty({clazz: Input, name: 'input'})  
    public input : Input;

    @JsonProperty('output')  
    public activityId : string;
    
    public constructor(init?:Partial<Turn>)
    {
        this.input = undefined;
        this.activityId = undefined;
        (<any>Object).assign(this, init);
    }
}

export class Dialog
{
    @JsonProperty({clazz: Turn, name: 'turns'})
    public turns : Turn[];
    
    public constructor(init?:Partial<Dialog>)
    {
        this.turns = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TrainDialog
{
    @JsonProperty('id')
    public id : string;

    @JsonProperty({clazz: Dialog, name: 'dialog'})
    public dialog : Dialog;



    public constructor(init?:Partial<TrainDialog>)
    {
        this.id = undefined;
        this.dialog = undefined;
        (<any>Object).assign(this, init);
    }
}
    

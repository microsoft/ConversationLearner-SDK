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
export class Input
{
    @JsonProperty('text')  
    public text : string;

    @JsonProperty({clazz: Input, name: 'text-alts'})
    public textAlts : AltText[];

    public constructor(init?:Partial<Input>)
    {
        this.text = undefined;
        this.textAlts = undefined;
        (<any>Object).assign(this, init);
    }
}

export class Turn
{
    @JsonProperty({clazz: Input, name: 'input'})  
    public input : Input;

    @JsonProperty('output')  
    public output : string;
    
    public constructor(init?:Partial<Turn>)
    {
        this.input = undefined;
        this.output = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TrainDialog
{
    @JsonProperty({clazz: Turn, name: 'snippetlist'})
    public turns : Turn[] = [];
}
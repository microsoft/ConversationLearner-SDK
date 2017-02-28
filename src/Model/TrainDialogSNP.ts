import { JsonProperty } from 'json-typescript-mapper';

export class AltTextSNP
{
    @JsonProperty('text')  
    public text : string;
        
    public constructor(init?:Partial<InputSNP>)
    {
        this.text = undefined;
        (<any>Object).assign(this, init);
    }
}
export class InputSNP
{
    @JsonProperty('text')  
    public text : string;

    @JsonProperty({clazz: InputSNP, name: 'text-alts'})
    public textAlts : AltTextSNP[];

    public constructor(init?:Partial<InputSNP>)
    {
        this.text = undefined;
        this.textAlts = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TurnSNP
{
    @JsonProperty({clazz: InputSNP, name: 'input'})  
    public input : InputSNP;

    @JsonProperty('output')  
    public output : string;
    
    public constructor(init?:Partial<TurnSNP>)
    {
        this.input = undefined;
        this.output = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TrainDialogSNP
{
    @JsonProperty({clazz: TurnSNP, name: 'snippetlist'})
    public turns : TurnSNP[] = [];
}
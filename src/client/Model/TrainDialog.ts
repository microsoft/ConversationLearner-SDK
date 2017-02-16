import { JsonProperty } from 'json-typescript-mapper';

export class Input
{
    @JsonProperty('text')  
    public text : string;

    public constructor(init?:Partial<Input>)
    {
        this.text = undefined;
        (<any>Object).assign(this, init);
    }

    public ToJSON() : {}
    {
        var json = {};
        if (this.text)  
            json['text'] = this.text;
        return json;
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

    public ToJSON() : {}
    {
        var json = {};
        if (this.input)  
            json['input'] = this.input.ToJSON();
        if (this.output)
            json['output'] = this.output;
        return json;
    }
}

export class TrainDialog
{
    @JsonProperty({clazz: Turn, name: 'snippetlist'})
    public turns : Turn[];

    public ToJSON() : {}
    {
        var json = {};
        if (this.turns)  
        {
           // json['turns'] = this.originalText;
        }
        return json;
    }
}
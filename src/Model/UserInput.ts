import { JsonProperty } from 'json-typescript-mapper';

export class UserInput
{
    @JsonProperty("text")
    public text : string;

    public constructor(init?:Partial<UserInput>)
    {
        this.text = undefined;
        (<any>Object).assign(this, init);
    } 
}
import { JsonProperty } from 'json-typescript-mapper';

export class Metrics
{
    @JsonProperty('wallTime')
    public wallTime : number;

    public constructor(init?:Partial<Metrics>)
    {
        this.wallTime = undefined;
        (<any>Object).assign(this, init);
    }
}
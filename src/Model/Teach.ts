import { JsonProperty } from 'json-typescript-mapper';

export class Teach
{
    @JsonProperty("teachId")
    public teachId : string;

    @JsonProperty("createdDatetime")
    public createdDatetime : string;

    @JsonProperty("lastQueryDatetime")
    public lastQueryDatetime : string;

    @JsonProperty("lastQueryDatetime")
    public packageId : number;

    public constructor(init?:Partial<Teach>)
    {
        this.teachId = undefined;
        this.createdDatetime = undefined;
        this.lastQueryDatetime = undefined;
        this.packageId = undefined;
        (<any>Object).assign(this, init);
    } 
}

export class TeachResponse
{
    @JsonProperty("packageId")
    public packageId : number;

    @JsonProperty("teachId")
    public teachId : string;

    @JsonProperty("trainDialogId")
    public trainDialogId : string;

    public constructor(init?:Partial<TeachResponse>)
    {
        this.packageId = undefined;
        this.teachId = undefined;
        this.trainDialogId = undefined;
        (<any>Object).assign(this, init);
    } 
}
import { JsonProperty } from 'json-typescript-mapper';

export class Session
{
    @JsonProperty("sessionId")
    public sessionId : string;

    @JsonProperty("createdDatetime")
    public createdDatetime : string;

    @JsonProperty("lastQueryDatetime")
    public lastQueryDatetime : string;

    @JsonProperty("lastQueryDatetime")
    public packageId : number;

    @JsonProperty("saveToLog")
    public saveToLog : boolean;

    public constructor(init?:Partial<Session>)
    {
        this.sessionId = undefined;
        this.createdDatetime = undefined;
        this.lastQueryDatetime = undefined;
        this.packageId = undefined;
        this.saveToLog = undefined;
        (<any>Object).assign(this, init);
    } 
}
import { JsonProperty } from 'json-typescript-mapper';

export const SessionType =
{
    Teach : "Teach",
    Run : "Run" 
}

export class Session
{
    @JsonProperty("sessionId")
    public sessionId : string;

    @JsonProperty("sessionType")
    public sessionType : string;

    public constructor(init?:Partial<Session>)
    {
        this.sessionId = undefined;
        this.sessionType = undefined;
        (<any>Object).assign(this, init);
    } 
}
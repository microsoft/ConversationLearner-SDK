import { Serializable } from './Serializable';
import { JsonProperty } from 'json-typescript-mapper';

export class CueCommand extends Serializable {

    @JsonProperty('commandName')  
    public commandName : string;

    @JsonProperty('args')  
    public args : string;

    public constructor(init?:Partial<CueCommand>)
    {
        super();
        this.commandName = undefined;
        this.args = undefined;
        (<any>Object).assign(this, init);
    }
}
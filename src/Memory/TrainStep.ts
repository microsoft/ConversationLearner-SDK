/**
 * Used to remember training steps during a train dialog
 */
import { Serializable } from './Serializable';
import { JsonProperty } from 'json-typescript-mapper';

export class TrainStep extends Serializable {

    // TODO: Obsolete with new UI?
    @JsonProperty('input')  
    public input : string = null;

    @JsonProperty('entity')  
    public entity: string = null;
    
    @JsonProperty('api')  
    public api : string[] = [];
    
    @JsonProperty('response')  
    public response : string[] = [];

    public constructor(init?:Partial<TrainStep>)
    {
        super();
        this.input = undefined;
        this.entity = undefined;
        this.api = [];
        this.response = [];
        (<any>Object).assign(this, init);
    }
}
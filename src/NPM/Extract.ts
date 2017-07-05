import { JsonProperty } from 'json-typescript-mapper';
import { LabeledEntity } from './TrainDialog';
import { Metrics } from './Metrics'

export class PredictedEntity extends LabeledEntity
{
    @JsonProperty('score')
    public score : number;

    public constructor(init?:Partial<PredictedEntity>)
    {
        super(init);
        this.score = undefined;
        (<any>Object).assign(this, init);
    }
}

export class ExtractResponse
{
    @JsonProperty('text')
    public text : string;

    @JsonProperty({clazz: PredictedEntity, name: 'predictedEntities'})
    public predictedEntities : PredictedEntity[];

    @JsonProperty({clazz: Metrics, name: 'metrics'})
    public metrics : Metrics;

    @JsonProperty('packageId')
    public packageId : string;

    public constructor(init?:Partial<ExtractResponse>)
    {
        this.text = undefined;
        this.predictedEntities = undefined;
        this.metrics = undefined;
        this.packageId = undefined;
        (<any>Object).assign(this, init);
    }
}

import { JsonProperty } from 'json-typescript-mapper';
import { Metrics } from './Metrics';

export class ScoreInput
{
    @JsonProperty('filledEntities')
    public filledEntities : string[];

    @JsonProperty('context')
    public context : string;

    @JsonProperty('maskedActions')
    public maskedActions : string[];

    public constructor(init?:Partial<ScoreInput>)
    {
        this.filledEntities = undefined;
        this.context = undefined;
        this.maskedActions = undefined;
        (<any>Object).assign(this, init);
    }
}

export class UnscoredAction
{
    @JsonProperty('actionId')
    public actionId : string;

    @JsonProperty('reason')
    public reason : string;

    public constructor(init?:Partial<ScoredAction>)
    {
        this.actionId = undefined;
        this.reason = undefined;
        (<any>Object).assign(this, init);
    }
}

export class ScoredAction
{
    @JsonProperty('actionId')
    public actionId : string;

    @JsonProperty('score')
    public score : number;

    public constructor(init?:Partial<ScoredAction>)
    {
        this.actionId = undefined;
        this.score = undefined;
        (<any>Object).assign(this, init);
    }
}

export class ScoreResponse
{
    @JsonProperty({clazz: ScoredAction, name: 'scoredActions'})
    public scoredActions : ScoredAction[];

    @JsonProperty({clazz: UnscoredAction, name: 'unscoredActions'})
    public unscoredActions : UnscoredAction[];

    @JsonProperty({clazz: Metrics, name: 'metrics'})
    public metrics : Metrics;

    public constructor(init?:Partial<ScoreResponse>)
    {
        this.scoredActions = undefined;
        this.unscoredActions = undefined;
        this.metrics = undefined;
        (<any>Object).assign(this, init);
    }
}
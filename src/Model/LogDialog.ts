import * as builder from 'botbuilder';
import { JsonProperty } from 'json-typescript-mapper';
import { ScoreResponse, ScoreInput } from './Score';
import { ExtractResponse } from './Extract';
import { Metrics } from './Metrics';

export class LogExtractorStep extends ExtractResponse
{
    @JsonProperty('stepBeginDatetime')
    public stepBeginDatetime : string;

    @JsonProperty('stepEndDatetime')
    public stepEndDatetime : string;

    public constructor(init?:Partial<LogExtractorStep>)
    {   
        super();
        this.stepBeginDatetime = undefined;
        this.stepEndDatetime = undefined;
        (<any>Object).assign(this, init);
    }
}

export class LogScorerStep
{
    @JsonProperty({clazz: ScoreInput, name: 'input'})
    public input : ScoreInput;

    @JsonProperty('predictedAction')
    public predictedAction : string;

    @JsonProperty({clazz: ScoreResponse, name: 'predictionDetails'})
    public predictionDetails : ScoreResponse;

    @JsonProperty('stepBeginDatetime')
    public stepBeginDatetime : string;

    @JsonProperty('stepEndDatetime')
    public stepEndDatetime : string;

    @JsonProperty({clazz: Metrics, name: 'metrics'})
    public metrics : Metrics;

    public constructor(init?:Partial<LogScorerStep>)
    {
        this.input = undefined;
        this.predictedAction = undefined;
        this.predictionDetails = undefined;
        this.stepBeginDatetime = undefined;
        this.stepEndDatetime = undefined;
        this.metrics = undefined;
        (<any>Object).assign(this, init);
    }
}

export class LogRound
{
    @JsonProperty({clazz: LogExtractorStep, name: 'extractorStep'})
    public extractorStep : LogExtractorStep;

    @JsonProperty({clazz: LogScorerStep, name: 'scorerSteps'})
    public scorerSteps : LogScorerStep[];

    public constructor(init?:Partial<LogRound>)
    {
        this.extractorStep = undefined;
        this.scorerSteps = undefined;
        (<any>Object).assign(this, init);
    }
}

export class LogDialog
{
    @JsonProperty('logDialogId')
    public logDialogId : string;

    @JsonProperty('dialogBeginDatetime')
    public dialogBeginDatetime : string;

    @JsonProperty('dialogEndDatetime')
    public dialogEndDatetime : string;

    @JsonProperty('packageId')
    public packageId : number;

    @JsonProperty('metrics')
    public metrics : string;

    @JsonProperty({clazz: LogRound, name: 'rounds'})
    public rounds : LogRound[];

    public constructor(init?:Partial<LogDialog>)
    {
        this.logDialogId = undefined;
        this.dialogBeginDatetime = undefined;
        this.dialogEndDatetime = undefined;
        this.packageId = undefined;
        this.metrics = undefined;
        this.rounds = undefined;
        (<any>Object).assign(this, init);
    }
}

export class LogDialogList
{
    @JsonProperty({clazz: LogDialog, name: 'logDialogs'})
    public logDialogs : LogDialog[];

    public constructor(init?:Partial<LogDialogList>)
    {
        this.logDialogs = undefined;
        (<any>Object).assign(this, init);
    }
}

export class LogDialogIdList
{
    @JsonProperty('logdialogIds')  
    public logDialogIds : string[];

    public constructor(init?:Partial<LogDialogIdList>)
    {
        this.logDialogIds = undefined;
        (<any>Object).assign(this, init);
    }
}
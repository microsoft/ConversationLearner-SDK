import * as builder from 'botbuilder';
import { JsonProperty } from 'json-typescript-mapper';
import { BlisHelp } from '../Model/Help'; 
import { BlisDebug} from '../BlisDebug';
import { BlisClient } from '../BlisClient';
import { TakeTurnModes, EntityTypes, TeachStep, ActionTypes_v1, APICalls, ActionCommand } from '../Model/Consts';
import { IntCommands, LineCommands, CueCommands, HelpCommands } from './Command';
import { BlisMemory } from '../BlisMemory';
import { Utils } from '../Utils';
import { Action_v1 } from './Action';
import { Entity_v1 } from './Entity';
import { Menu } from '../Menu';
import { Pager } from '../Memory/Pager';
import { BlisContext } from '../BlisContext';
import { EditableResponse } from './EditableResponse';
import { Input, LabeledEntity } from './TrainDialog';


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

export class PredictedEntity extends LabelEntity
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

export class LogExtractorStep
{
    @JsonProperty('text')
    public text : string;

    @JsonProperty({clazz: PredictedEntity, name: 'predictedEntities'})
    public predictedEntities : PredictedEntity[];

    @JsonProperty('stepBeginDatetime')
    public stepBeginDatetime : string;

    @JsonProperty('stepEndDatetime')
    public stepEndDatetime : string;

    @JsonProperty({clazz: Metrics, name: 'metrics'})
    public metrics : Metrics;

    public constructor(init?:Partial<LogExtractorStep>)
    {
        this.text = undefined;
        this.predictedEntities = undefined;
        this.stepBeginDatetime = undefined;
        this.stepEndDatetime = undefined;
        this.metrics = undefined;
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

export class PredictionDetails
{
    @JsonProperty({clazz: ScoredAction, name: 'scoredActions'})
    public scoredActions : ScoredAction[];

    @JsonProperty({clazz: UnscoredAction, name: 'unscoredActions'})
    public unscoredActions : UnscoredAction[];

    public constructor(init?:Partial<PredictionDetails>)
    {
        this.scoredActions = undefined;
        this.unscoredActions = undefined;
        (<any>Object).assign(this, init);
    }
}

export class LogScorerStep
{
    @JsonProperty({clazz: Input, name: 'input'})
    public input : Input;

    @JsonProperty('predictedAction')
    public predictedAction : string;

    @JsonProperty({clazz: PredictionDetails, name: 'predictionDetails'})
    public predictionDetails : PredictionDetails;

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
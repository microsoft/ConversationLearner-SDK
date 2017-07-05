import { JsonProperty } from 'json-typescript-mapper';
import { ScoreInput } from './Score';

export class LabeledEntity
{
    @JsonProperty('startCharIndex')
    public startCharIndex : number;

    @JsonProperty('endCharIndex')
    public endCharIndex : number;

    @JsonProperty('entityId')
    public entityId : string;

    @JsonProperty('entityText')
    public entityText : string;

    public constructor(init?:Partial<LabeledEntity>)
    {
        this.startCharIndex = undefined;
        this.endCharIndex = undefined;
        this.entityId = undefined;
        this.entityText = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TextVariation
{
    @JsonProperty('text')
    public text : String;

    @JsonProperty({clazz: LabeledEntity, name: 'labelEntities'})
    public labelEntities : LabeledEntity[];

    public constructor(init?:Partial<TextVariation>)
    {
        this.text = undefined;
        this.labelEntities = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TrainExtractorStep
{
    @JsonProperty({clazz: TextVariation, name: 'textVariations'})
    public textVariations : TextVariation[];

    public constructor(init?:Partial<TrainExtractorStep>)
    {
        this.textVariations = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TrainScorerStep
{
    @JsonProperty({clazz: ScoreInput, name: 'input'})
    public input : ScoreInput;

    @JsonProperty('labelAction')
    public labelAction : string;

    public constructor(init?:Partial<TrainScorerStep>)
    {
        this.input = undefined;
        this.labelAction = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TrainRound
{
    @JsonProperty({clazz: TrainExtractorStep, name: 'extractorStep'})
    public extractorStep : TrainExtractorStep;

    @JsonProperty({clazz: TrainScorerStep, name: 'scorerSteps'})
    public scorerSteps : TrainScorerStep[];

    public constructor(init?:Partial<TrainRound>)
    {
        this.extractorStep = undefined;
        this.scorerSteps = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TrainDialog
{
    @JsonProperty('trainDialogId')
    public trainDialogId : string;

    @JsonProperty('version')
    public version : number;

    @JsonProperty('packageCreationId')
    public packageCreationId : number;

    @JsonProperty('packageDeletionId')
    public packageDeletionId : number;

    @JsonProperty({clazz: TrainRound, name: 'rounds'})
    public rounds : TrainRound[];

    public constructor(init?:Partial<TrainDialog>)
    {
        this.trainDialogId = undefined;
        this.version = undefined;
        this.packageCreationId = undefined;
        this.packageDeletionId = undefined;
        this.rounds = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TrainResponse
{
    @JsonProperty("packageId")
    public packageId : number;

    @JsonProperty("trainingStatus")
    public trainingStatus : string;

    @JsonProperty("trainDialogId")
    public trainDialogId : string;

    public constructor(init?:Partial<TrainResponse>)
    {
        this.packageId = undefined;
        this.trainingStatus = undefined;
        this.trainDialogId = undefined;
        (<any>Object).assign(this, init);
    } 
}

export class TrainDialogList
{
    @JsonProperty({clazz: TrainDialog, name: 'trainDialogs'})
    public trainDialogs : TrainDialog[];

    public constructor(init?:Partial<TrainDialogList>)
    {
        this.trainDialogs = undefined;
        (<any>Object).assign(this, init);
    }
}

export class TrainDialogIdList
{
    @JsonProperty('trainDialogIds')  
    public trainDialogIds : string[];

    public constructor(init?:Partial<TrainDialogIdList>)
    {
        this.trainDialogIds = undefined;
        (<any>Object).assign(this, init);
    }
}
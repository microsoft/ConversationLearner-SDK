import { BlisMemory } from '../BlisMemory';
import { BlisDebug} from '../BlisDebug';
import { TrainStep } from './TrainStep';
import { Serializable } from './Serializable';
import { SaveStep } from '../Model/Consts';
import * as builder from 'botbuilder'
import { deserialize, serialize } from 'json-typescript-mapper';
import { JsonProperty } from 'json-typescript-mapper';

export class TrainHistory 
{
    private static MEMKEY = "TRAINHISTORY";
    public static memory : BlisMemory;

    @JsonProperty({clazz: TrainStep, name: 'curStep'})
    public curStep : TrainStep;

    @JsonProperty({clazz: TrainStep, name: 'lastStep'})
    public lastStep : TrainStep;

    @JsonProperty({clazz: TrainStep, name: 'allSteps'})
    public allSteps : TrainStep[];

    public constructor(init?:Partial<TrainHistory>)
    {
        this.curStep = null;
        this.lastStep = null;
        this.allSteps = [];
        (<any>Object).assign(this, init);
    }

    public Serialize() : string
    {
        return JSON.stringify(this);
    }

    public static Deserialize(type : {new() : TrainHistory }, text : string) : TrainHistory
    {
        if (!text) return null;
        let json = JSON.parse(text);
        let trainHistory = deserialize(TrainHistory, json);
        if (!trainHistory.allSteps)
        {
            trainHistory.allSteps = [];
        }
        return trainHistory;
    }

    private static async Get() : Promise<TrainHistory>
    {
        if (!this.memory)
        {
            throw new Error("TrainHistory called without initialzing memory");
        }
 
        let data = await this.memory.GetAsync(this.MEMKEY);
        if (data)
        {
            return TrainHistory.Deserialize(TrainHistory, data);
        } 
        return new TrainHistory();  
    }

    private static async Set(trainHistory : TrainHistory) : Promise<void>
    {
        if (!this.memory)
        {
            throw new Error("TrainHistory called without initialzing memory");
        }
        if (trainHistory)
        {
            await this.memory.SetAsync(this.MEMKEY, trainHistory.Serialize());
        }
        else
        {
            await this.memory.DeleteAsync(this.MEMKEY);
        }
    }

    private static async Clear() : Promise<void>
    {
        let trainHistory = new TrainHistory();  
        await this.Set(trainHistory);
    }

    private static async ClearLastStep() : Promise<void>
    {
        let trainHistory = await this.Get();
        trainHistory.lastStep = null;
        await this.Set(trainHistory);
    }

    private static async ToString() : Promise<string>
    {
        let trainHistory = await this.Get();
        return JSON.stringify(trainHistory);
    }

    public static async SetStep(saveStep: string, value: string) : Promise<void> {
        let trainHistory = await this.Get();  

        if (!trainHistory.curStep)
        {
            trainHistory.curStep = new TrainStep();
        }
        if (saveStep == SaveStep.INPUT)
        {
            trainHistory.curStep[SaveStep.INPUT] = value;
        }
        else if (saveStep == SaveStep.ENTITY)
        {
            trainHistory.curStep[SaveStep.ENTITY] = value;
        }
        else if (saveStep == SaveStep.RESPONSES)
        {
            // Can be mulitple Response steps
            trainHistory.curStep[SaveStep.RESPONSES].push(value);
        }
        else if (saveStep = SaveStep.APICALLS)
        {
            // Can be mulitple API steps
            trainHistory.curStep[SaveStep.APICALLS].push(value);
        }
        else
        {
            console.log(`Unknown SaveStep value ${saveStep}`);
            return;
        }
        await this.Set(trainHistory);
    }

    public static async SetLastStep(saveStep: string, value: any) : Promise<void> {
        let trainHistory = await this.Get();  

        if (trainHistory.lastStep == null)
        {
            trainHistory.lastStep = new TrainStep();
        }
        if (saveStep == SaveStep.RESPONSES)
        {
            // Can be mulitple Response steps
            trainHistory.lastStep[SaveStep.RESPONSES].push(value);
        }
        else if (saveStep == SaveStep.APICALLS)
        {
            // Can be mulitple API steps
            trainHistory.lastStep[SaveStep.APICALLS].push(value);
        }
        else
        {
            trainHistory.lastStep[saveStep] = value;
        }
        await this.Set(trainHistory);
    }

    public static async LastStep(saveStep: string) : Promise<any> {
        let trainHistory = await this.Get();  

        if (!trainHistory.lastStep)
        {
            return null;
        }
        return trainHistory.lastStep[saveStep];
    }


    /** Returns input of current train step */ 
    public static async CurrentInput() : Promise<TrainStep> {
         let trainHistory = await this.Get();  

        if (trainHistory.curStep)
        {
            return trainHistory.curStep[SaveStep.INPUT];
        }
        return null;
    }

    /** Push current training step onto the training step history */
    public static async FinishStep() : Promise<void> {
        // Move cur stop onto history
        let trainHistory = await this.Get();  

        if (!trainHistory.curStep) return;   

        if (!trainHistory.allSteps) {
            trainHistory.allSteps = [];
        }
 
        trainHistory.allSteps.push(trainHistory.curStep);
        trainHistory.curStep = null;

        await this.Set(trainHistory);
    }

    public static async Steps() : Promise<TrainStep[]> {
        let trainHistory = await this.Get();     
        return trainHistory.allSteps;
    }
}
import * as builder from 'botbuilder';
import { ClientMemoryManager} from './Memory/ClientMemoryManager';
import { PredictedEntity, ScoreInput } from 'blis-models'
import { BlisDialog} from './BlisDialog';


export function APICallback(name: string, target : (memoryManager: ClientMemoryManager, args : any[]) => string | builder.Message)
{
    BlisDialog.apiCallbacks[name] = target;
}

export function LuisCallback(target : (text: string, predictedEntities : PredictedEntity[], memoryManager : ClientMemoryManager) => ScoreInput)
{
    BlisDialog.luisCallback = target;
}

export function BlisCallback(target : (text : string, memoryManager : ClientMemoryManager) => string | builder.Message)
{
    BlisDialog.blisCallback = target;
}
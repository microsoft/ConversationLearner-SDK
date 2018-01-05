import * as BB from 'botbuilder-core';
import { BlisMemory } from './BlisMemory';
import { ScoredAction, EntityBase } from 'blis-models'

export interface BlisIntent extends BB.Intent {
    scoredAction: ScoredAction;
    blisEntities: EntityBase[];
    memory: BlisMemory;
    inTeach: boolean;
}
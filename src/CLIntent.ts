import * as BB from 'botbuilder'
import { CLMemory } from './CLMemory'
import { ScoredAction, EntityBase } from 'conversationlearner-models'

export interface CLIntent extends BB.Intent {
    scoredAction: ScoredAction
    clEntities: EntityBase[]
    memory: CLMemory
    inTeach: boolean
}

/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import { CLMemory } from './CLMemory'
import { ScoredAction, EntityBase } from 'conversationlearner-models'

export interface CLRecognizerResult {
    scoredAction: ScoredAction
    clEntities: EntityBase[]
    memory: CLMemory
    inTeach: boolean
}

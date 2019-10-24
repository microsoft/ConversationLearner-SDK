/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { CLState } from './Memory/CLState'
import * as BB from 'botbuilder'
import { ScoredAction, EntityBase } from '@conversationlearner/models'

export interface CLRecognizerResult {
    scoredAction: ScoredAction
    clEntities: EntityBase[]
    memory: CLState
    inTeach: boolean
    activity: BB.Activity
}

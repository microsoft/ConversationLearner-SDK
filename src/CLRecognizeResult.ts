/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { CLState } from './Memory/CLState'
import * as BB from 'botbuilder'
import { ScoredAction, EntityBase } from '@conversationlearner/models'
import { ConversationLearner } from './ConversationLearner'

export interface CLRecognizerResult {
    model: ConversationLearner
    scoredAction: ScoredAction
    clEntities: EntityBase[]
    memory: CLState
    inTeach: boolean
    activity: BB.Activity
}

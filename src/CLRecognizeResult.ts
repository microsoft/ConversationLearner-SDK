/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { CLStorage } from './CLStorage'
import * as BB from 'botbuilder'
import { ScoredAction, EntityBase } from '@conversationlearner/models'

export interface CLRecognizerResult {
    scoredAction: ScoredAction
    clEntities: EntityBase[]
    memory: CLStorage
    inTeach: boolean,
    activity: BB.Activity
}

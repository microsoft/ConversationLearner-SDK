/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ConversationLearner } from './ConversationLearner'
import { CLOptions } from './CLOptions'
import { CLModelOptions } from './CLModelOptions'
import { ClientMemoryManager, ReadOnlyClientMemoryManager } from './Memory/ClientMemoryManager'
import { RedisStorage } from './RedisStorage'
import { FileStorage } from './FileStorage'
import uiRouter from './uiRouter'
import { SessionEndState, MemoryValue } from '@conversationlearner/models'
import { EntityDetectionCallback, OnSessionStartCallback, OnSessionEndCallback, LogicCallback, RenderCallback, ICallbackInput } from './CLRunner'
import { ILogStorage } from './Memory/ILogStorage'
import { CosmosLogStorage } from './CosmosLogStorage'

export {
    uiRouter,
    ConversationLearner,
    CLOptions as ICLOptions,
    CLModelOptions,
    ClientMemoryManager,
    ReadOnlyClientMemoryManager,
    RedisStorage,
    FileStorage,
    SessionEndState,
    EntityDetectionCallback,
    OnSessionStartCallback,
    OnSessionEndCallback,
    LogicCallback,
    MemoryValue,
    RenderCallback,
    ICallbackInput,
    // Interface for custom log storage
    ILogStorage,
    // Sample implementation of ILogStorage using CosmosDB
    CosmosLogStorage
}

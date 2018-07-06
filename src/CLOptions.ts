/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
export interface ICLOptions {
    botPort: any

    LUIS_AUTHORING_KEY: string | undefined
    LUIS_SUBSCRIPTION_KEY: string | undefined
    APIM_SUBSCRIPTION_KEY: string | undefined

    // URL for Conversation Learner service
    CONVERSATION_LEARNER_SERVICE_URI: string
    CONVERSATION_LEARNER_UI_PORT: number

    // Application settings
    SESSION_MAX_TIMEOUT?: number
}

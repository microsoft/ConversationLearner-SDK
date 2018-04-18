export interface ICLOptions {
    luisAuthoringKey: string | undefined
    luisSubscriptionKey: string | undefined
    apimSubscriptionKey: string | undefined
    // URL for Conversation Learner service
    serviceUri: string
    sdkPort: number
    uiPort: number
    // Application settings
    sessionMaxTimeout?: number
    // Running on localhost
    localhost?: boolean
    dolBotUrl: string
    dolServiceUrl: string
}

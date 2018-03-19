export interface IBlisOptions {
    luisAuthoringKey: string | undefined
    luisSubscriptionKey: string | undefined
    // URL for BLIS service
    serviceUri: string
    sdkPort: number
    uiPort: number
    // Application to start
    appId: string
    // Application settings
    sessionMaxTimeout?: number
    // Running on localhost
    localhost?: boolean
    dolBotUrl: string
    dolServiceUrl: string
}

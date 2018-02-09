export interface IBlisOptions {
    // URL for BLIS service
    serviceUri: string;

    // BLIS User Name
    user: string;

    // BLIS Secret
    secret: string;

    // Application to start
    appId: string;

    // End point for Azure function calls
    azureFunctionsUrl? : string;

    // Key for Azure function calls (optional)
    azureFunctionsKey? : string;

    // Running on localhost
    localhost? : boolean;
}
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as models from '@conversationlearner/models'
import { CLDebug } from './CLDebug'
import * as NodeCache from 'node-cache'
import * as Request from 'request'

const apimSubscriptionKeyHeader = 'Ocp-Apim-Subscription-Key'
const apimSubscriptionIdHeader = 'apim-subscription-id'
const luisAuthoringKeyHeader = 'x-luis-authoring-key'
const luisSubscriptionKeyHeader = 'x-luis-subscription-key'

type HTTP_METHOD = 'GET' | 'PUT' | 'POST' | 'DELETE'
const requestMethodMap = new Map<HTTP_METHOD, typeof Request.get | typeof Request.post>([
    ['GET', Request.get],
    ['PUT', Request.put],
    ['POST', Request.post],
    ['DELETE', Request.delete]
])

export interface ICLClientOptions {
    CONVERSATION_LEARNER_SERVICE_URI: string
    // This should only set when directly targeting cognitive services ppe environment.
    APIM_SUBSCRIPTION_KEY: string | undefined
    LUIS_AUTHORING_KEY: string | undefined
    LUIS_SUBSCRIPTION_KEY?: string
}

export class CLClient {
    private options: ICLClientOptions
    private actionCache = new NodeCache({ stdTTL: 300, checkperiod: 600 })
    private entityCache = new NodeCache({ stdTTL: 300, checkperiod: 600 })
    private exportCache = new NodeCache({ stdTTL: 300, checkperiod: 600 })

    constructor(options: ICLClientOptions) {
        this.options = options;

        if (options.APIM_SUBSCRIPTION_KEY === undefined) {
            options.APIM_SUBSCRIPTION_KEY = options.LUIS_AUTHORING_KEY;
        }
    }

    public ValidationErrors(): string[] {
        let errors: string[] = []
        if (typeof this.options.CONVERSATION_LEARNER_SERVICE_URI !== 'string' || this.options.CONVERSATION_LEARNER_SERVICE_URI.length === 0) {
            errors.push(`CONVERSATION_LEARNER_SERVICE_URI must be a non-empty string. You passed: ${this.options.CONVERSATION_LEARNER_SERVICE_URI}`)
        }

        if (typeof this.options.LUIS_AUTHORING_KEY !== 'string' || this.options.LUIS_AUTHORING_KEY.length === 0) {
            errors.push(`LUIS_AUTHORING_KEY must be a non-empty string. You passed: ${this.options.LUIS_AUTHORING_KEY}`)
        }
        return errors;
    }

    public LuisAuthoringKey(): string | undefined {
        return this.options.LUIS_AUTHORING_KEY;
    }

    private BuildURL(baseUri: string, apiPath: string, query?: string)
    {
        let uri = baseUri + (!baseUri.endsWith('/') ? '/' : '') + apiPath
        if (query) {
            uri += `?${query}`
        }
        return uri
    }

    private MakeURL(apiPath: string, query?: string) {
        return this.BuildURL(this.options.CONVERSATION_LEARNER_SERVICE_URI, apiPath, query)
    }

    private MakeSessionURL(apiPath: string, query?: string) {
        // check if request is bypassing cognitive services APIM
        if(!this.options.CONVERSATION_LEARNER_SERVICE_URI.includes('api.cognitive.microsoft.com'))
        {
            // In this case we are not chaning the serviceUrl and it stays the same, 
            // for example: https://localhost:37936/api/v1/ -> https://localhost:37936/api/v1/
            return this.MakeURL(apiPath, query)
        }
        
        // The base uri for session API in cognitive services APIM is in the form of '<service url>/conversationlearner/session/v1.0/'
        // Session API are the following api: 
        //  1) POST /app/<appId>/session
        //  2) PUT /app/<appId>/session/extract
        //  3) PUT /app/<appId>/session/score
        //  4) DELETE /app/<appId>/session
        let baseUri = this.options.CONVERSATION_LEARNER_SERVICE_URI.endsWith('/') ? 
            this.options.CONVERSATION_LEARNER_SERVICE_URI : 
            `${this.options.CONVERSATION_LEARNER_SERVICE_URI}/`
        const apimVersionSuffix = '/v1.0/'
        if(baseUri.endsWith(apimVersionSuffix))
        {
            // In this case, serviceurl has api version information in it; "session" will be inserted before /v1.0
            // this means that https://westus.api.cognitive.microsoft.com/conversationlearner/v1.0/ becomes 
            // https://westus.api.cognitive.microsoft.com/conversationlearner/session/v1.0/
            baseUri = `${baseUri.substring(0, baseUri.lastIndexOf(apimVersionSuffix))}/session${apimVersionSuffix}`
        }
        else
        {
            // When api version information is not part of the serviceUrl, we simply add /session/ to end of the api
            // example: https://westus.api.cognitive.microsoft.com/conversationlearner/ -> https://westus.api.cognitive.microsoft.com/conversationlearner/session/
            baseUri += 'session/'
        }
        return this.BuildURL(baseUri, apiPath, query)
    }

    public ClearExportCache(appId: string): void {
        this.exportCache.del(appId)
    }

    private send<T>(method: HTTP_METHOD, url: string, body?: any): Promise<T> {
        return new Promise((resolve, reject) => {
            const requestData = {
                url,
                headers: {
                    [luisAuthoringKeyHeader]: this.options.LUIS_AUTHORING_KEY,
                    [luisSubscriptionKeyHeader]: this.options.LUIS_SUBSCRIPTION_KEY,
                    // This is only used when directly targeting service.  In future APIM will provide user/subscription id associated from LUIS key
                    [apimSubscriptionIdHeader]: this.options.LUIS_AUTHORING_KEY,
                    [apimSubscriptionKeyHeader]: this.options.APIM_SUBSCRIPTION_KEY
                },
                json: true,
                body
            }

            CLDebug.LogRequest(method, url, requestData)
            const requestMethod = requestMethodMap.get(method)
            if(!requestMethod) {
                throw new Error(`Request method not found for http verb: ${method}`)
            }
    
            requestMethod(requestData, (error, response, responseBody) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    resolve(responseBody)
                }
            })
        })
    }

    //=============================================================================
    // Action
    //=============================================================================

    /** 
     * Retrieves information about a specific action for the current package
     * (or the specified package if provided)
     */
    public async GetAction(appId: string, actionId: string, query: string): Promise<models.ActionBase> {
        let action = this.actionCache.get(actionId) as models.ActionBase
        if (action) {
            return Promise.resolve(action)         
        }

        let apiPath = `app/${appId}/action/${actionId}`
        action = await this.send<models.ActionBase>('GET', this.MakeURL(apiPath, query))
        action.actionId = actionId
        this.actionCache.set(actionId, action)

        return action
    }

    /** 
     * Retrieves definitions of ALL actions for the current package
     * (or the specified package if provided). To retrieve just the
     * IDs of actions, see the GetActionIds Method
     */
    public GetActions(appId: string, query: string): Promise<models.ActionList> {
        let apiPath = `app/${appId}/actions`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** 
     * Retrieves a list of action IDs for the latest package
     * (or the specified package, if provided).  To retrieve
     * the definitions of many actions, see the GetAction method
     */
    public GetActionIds(appId: string, query: string): Promise<models.ActionIdList> {
        let apiPath = `app/${appId}/action`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Updates payload and/or metadata on an existing action */
    public EditAction(appId: string, action: models.ActionBase): Promise<models.DeleteEditResponse> {
        this.actionCache.del(action.actionId)
        let apiPath = `app/${appId}/action/${action.actionId}`
        return this.send('PUT', this.MakeURL(apiPath), action)
    }

    /** Marks an action as deleted */
    public DeleteAction(appId: string, actionId: string): Promise<models.DeleteEditResponse> {
        this.actionCache.del(actionId)
        let apiPath = `app/${appId}/action/${actionId}`
        return this.send('DELETE', this.MakeURL(apiPath))
    }

    /** Create a new action */
    // TODO: Fix API to return full object
    public async AddAction(appId: string, action: models.ActionBase): Promise<string> {
        let apiPath = `app/${appId}/action`
        const actionResponse = await this.send<any>('POST', this.MakeURL(apiPath), action)
        return actionResponse.actionId
    }

    //==============================================================================
    // App
    //=============================================================================

    /** 
     * Retrieve information about a specific application
     * If the app ID isn't found in the set of (non-archived) apps,
     * returns 404 error ("not found")
     */
    public GetApp(appId: string): Promise<models.AppBase> {
        let apiPath = `app/${appId}`
        return this.send('GET', this.MakeURL(apiPath))
    }

    public GetAppSource(appId: string, packageId: string): Promise<models.AppDefinition> {
        let apiPath = `app/${appId}/source?package=${packageId}`
        return this.send('GET', this.MakeURL(apiPath))
    }

    public SetAppSource(appId: string, source: models.AppDefinition): Promise<string> {
        let apiPath = `app/${appId}/source`
        return this.send('POST', this.MakeURL(apiPath), source)
    }

    public GetAppTrainingStatus(appId: string, query: string): Promise<models.TrainingStatus> {
        let apiPath = `app/${appId}/trainingstatus`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Retrieve a list of (active) applications */
    public GetApps(query: string): Promise<models.AppList> {
        let apiPath = `apps`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Create a new application */
    public CopyApps(srcUserId: string, destUserId: string, appId: string, luisSubscriptionKey: string): Promise<string> {
        const apiPath = `apps/copy?srcUserId=${srcUserId}&destUserId=${destUserId}&appId=${appId}&luisSubscriptionKey=${luisSubscriptionKey}`
        return this.send('POST', this.MakeURL(apiPath))
    }

    /** 
     * Rename an existing application or changes its LUIS key
     * Note: Renaming an application does not affect packages
     */
    public EditApp(app: models.AppBase, query: string): Promise<string> {
        let apiPath = `app/${app.appId}`
        return this.send('PUT', this.MakeURL(apiPath, query), app)
    }

    /** 
     * Archive an existing application
     * Note: "deleting" an application doesn't destroy it, but rather archives
     * it for a period (eg 30 days).  During the archive period, the application
     * can be restored with the next API call.  At the end of the archive period,
     * the application is destroyed.
     */
    public ArchiveApp(appId: string): Promise<string> {
        let apiPath = `app/${appId}`
        return this.send('DELETE', this.MakeURL(apiPath))
    }

    /** 
     * Create a new application
     */
    // TODO: Fix API to return full object
    public async AddApp(app: models.AppBase, query: string): Promise<string> {
        const apiPath = `app`
        const appResponse = await this.send<models.AppBase>('POST', this.MakeURL(apiPath, query), app)
        return appResponse.appId
    }

    /** 
     * Destroys an existing application, including all its models, sessions, and logged dialogs
     * Deleting an application from the archive really destroys it – no undo.
     */
    public DeleteApp(appId: string): Promise<string> {
        let apiPath = `archive/${appId}`
        return this.send('DELETE', this.MakeURL(apiPath))
    }

    /** Retrieves details for a specific $appId */
    public GetAppStatus(appId: string): Promise<models.AppBase> {
        let apiPath = `archive/${appId}`
        return this.send('DELETE', this.MakeURL(apiPath))
    }

    /** Moves an application from the archive to the set of active applications */
    public RestoreApp(appId: string): Promise<string> {
        let apiPath = `archive/${appId}`
        return this.send('PUT', this.MakeURL(apiPath))
    }

    /** Retrieves a list of application Ids in the archive for the given user */
    public GetArchivedAppIds(query: string): Promise<models.AppIdList> {
        let apiPath = `archive`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Retrieves a list of full applications in the archive for the given user */
    public GetArchivedApps(query: string): Promise<models.AppList> {
        let apiPath = `archives`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Creates a new package tag */
    public PublishApp(appId: string, tagName: string): Promise<models.PackageReference> {
        let apiPath = `app/${appId}/publish?version=${tagName}`
        return this.send('PUT', this.MakeURL(apiPath))
    }

    /** Sets a package tags as the live version */
    public PublishProdPackage(appId: string, packageId: string): Promise<string> {
        let apiPath = `app/${appId}/publish/${packageId}`
        return this.send('POST', this.MakeURL(apiPath))
    }

    //==============================================================================
    // Entity
    //=============================================================================

    /**
     * Retrieves information about a specific entity in the latest package
     * (or the specified package, if provided)
     */
    public async GetEntity(appId: string, entityId: string, query: string): Promise<models.EntityBase> {
        // Check cache first
        let entity = this.entityCache.get(entityId) as models.EntityBase
        if (entity) {
            return Promise.resolve(entity)
        }

        let apiPath = `app/${appId}/entity/${entityId}`
        entity = await this.send<models.EntityBase>('GET', this.MakeURL(apiPath, query))
        this.entityCache.set(entityId, entity)
        return entity
    }

    /**
     * Retrieves definitions of ALL entities in the latest package
     * (or the specified package, if provided).  To retrieve just the IDs
     * of all entities, see the GetEntityIds method
     */
    public GetEntities(appId: string, query?: string): Promise<models.EntityList> {
        let apiPath = `app/${appId}/entities`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /**
     * Retrieves a list of entity IDs for the latest package
     * (or the specified package, if provided).  To retrieve the definitions
     * of many entities, see the GetEntities method
     */
    public GetEntityIds(appId: string, query: string): Promise<models.EntityIdList> {
        let apiPath = `app/${appId}/entity`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Updates name and/or metadata on an existing entity */
    public EditEntity(appId: string, entity: models.EntityBase): Promise<string> {
        let apiPath = `app/${appId}/entity/${entity.entityId}`

        // Clear old one from cache
        this.entityCache.del(entity.entityId)

        return this.send('PUT', this.MakeURL(apiPath), entity)
    }

    /** Deletes an entity */
    public DeleteEntity(appId: string, entityId: string): Promise<string> {
        let apiPath = `app/${appId}/entity/${entityId}`
        return this.send('DELETE', this.MakeURL(apiPath))
    }

    /** Create a new entity */
    // TODO: Fix API to return entity
    public async AddEntity(appId: string, entity: models.EntityBase): Promise<string> {
        let apiPath = `app/${appId}/entity`
        const entityResponse = await this.send<any>('POST', this.MakeURL(apiPath), entity)
        return entityResponse.entityId
    }

    //=============================================================================
    // Log Dialogs
    //=============================================================================

    /** Retrieves information about a specific logDialog */
    public GetLogDialog(appId: string, logDialogId: string): Promise<models.LogDialog> {
        let apiPath = `app/${appId}/logdialog/${logDialogId}`
        let query = 'includeDefinitions=false'
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /**
     * Retrieves the contents of many/all logDialogs.
     * To retrieve just a list of IDs of all logDialogs,
     * see the GET GetLogDialogIds method.
     */
    public GetLogDialogs(appId: string, packageId: string): Promise<models.LogDialogList> {
        let packages = packageId.split(",").map(p => `package=${p}`).join("&");
        let apiPath = `app/${appId}/logdialogs?includeDefinitions=false&${packages}`
        return this.send('GET', this.MakeURL(apiPath))
    }

    /**
     * Retrieves just the IDs of logDialogs.
     * To retrieve the contents of many logDialogs, see the GetLogDialogs method.
     */
    public GetLogDialogIds(appId: string, query: string): Promise<models.LogDialogIdList> {
        let apiPath = `app/${appId}/logdialog`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Deletes a LogDialog */
    public DeleteLogDialog(appId: string, logDialogId: string): Promise<string> {
        let apiPath = `app/${appId}/logdialog/${logDialogId}`
        return this.send('DELETE', this.MakeURL(apiPath))
    }

    //=============================================================================
    // Train Dialogs
    //=============================================================================

    /** Create a new TrainDialog */
    public AddTrainDialog(appId: string, trainDialog: models.TrainDialog): Promise<models.TrainResponse> {
        let apiPath = `app/${appId}/traindialog`
        return this.send('POST', this.MakeURL(apiPath), trainDialog)
    }

    /** Updates a trainDialog, overwriting the content of its dialog */
    public EditTrainDialog(appId: string, trainDialog: models.TrainDialog): Promise<models.TrainResponse> {
        let apiPath = `app/${appId}/traindialog/${trainDialog.trainDialogId}`
        return this.send('PUT', this.MakeURL(apiPath), trainDialog)
    }

    /**
     * Retrieves information about a specific trainDialog in the current package
     * (or the specified package, if provided)
     */
    public GetTrainDialog(appId: string, trainDialogId: string, includeDefinitions: boolean = false): Promise<models.TrainDialog> {
        let query = `includeDefinitions=${includeDefinitions}`
        let apiPath = `app/${appId}/traindialog/${trainDialogId}`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /**
     * Retrieves the contents of many/all train dialogs.
     * To retrieve just a list of IDs of all trainDialogs,
     * see the GetTrainDialogIds method
     */
    public GetTrainDialogs(appId: string, query: string): Promise<models.TrainDialogList> {
        let apiPath = `app/${appId}/traindialogs`
        if(!query.includes('includeDefinitions'))
        {
            query += `${query.length > 0 ? '&' : ''}includeDefinitions=false`; 
        }
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /**
     * Retrieves a list of trainDialog IDs.
     * To retrieve the contents of multiple trainDialogs,
     * see the GetTrainDialogs method
     */
    public GetTrainDialogIds(appId: string, query: string): Promise<models.TrainDialogIdList> {
        let apiPath = `app/${appId}/traindialog`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Deletes a TrainDialog */
    public DeleteTrainDialog(appId: string, trainDialogId: string): Promise<models.TrainResponse> {
        let apiPath = `app/${appId}/traindialog/${trainDialogId}`
        return this.send('DELETE', this.MakeURL(apiPath))
    }

    /** Runs entity extraction (prediction). */
    public TrainDialogExtract(
        appId: string,
        trainDialogId: string,
        turnIndex: string,
        userInput: models.UserInput
    ): Promise<models.ExtractResponse> {
        let apiPath = `app/${appId}/traindialog/${trainDialogId}/extractor/${turnIndex}`
        // Always retrieve entity list
        let query = 'includeDefinitions=true'
        return this.send('PUT', this.MakeURL(apiPath, query), userInput)
    }

    //=============================================================================
    // Session
    //=============================================================================

    /** Creates a new session and a corresponding logDialog */
    public StartSession(appId: string, sessionCreateParams: models.SessionCreateParams): Promise<models.Session> {
        let apiPath = `app/${appId}/session`
        return this.send('POST', this.MakeSessionURL(apiPath), sessionCreateParams)
    }

    /** Retrieves information about the specified session */
    public GetSession(appId: string, sessionId: string): Promise<models.Session> {
        let apiPath = `app/${appId}/session/${sessionId}`
        return this.send('GET', this.MakeURL(apiPath))
    }

    /** Runs entity extraction (prediction). */
    public SessionExtract(appId: string, sessionId: string, userInput: models.UserInput): Promise<models.ExtractResponse> {
        let apiPath = `app/${appId}/session/${sessionId}/extractor`

        // Always retrieve entity list
        let query = 'includeDefinitions=true'

        return this.send('PUT', this.MakeSessionURL(apiPath, query), userInput)
    }

    /** Take a turn and returns chosen action */
    public SessionScore(appId: string, sessionId: string, scorerInput: models.ScoreInput): Promise<models.ScoreResponse> {
        let apiPath = `app/${appId}/session/${sessionId}/scorer`
        return this.send('PUT', this.MakeSessionURL(apiPath), scorerInput)
    }

    /** End a session. */
    public EndSession(appId: string, sessionId: string): Promise<string> {
        let apiPath = `app/${appId}/session/${sessionId}`
        //TODO: remove this when redundant query parameter is removed 
        let query = 'saveDialog=false'
        return this.send('DELETE', this.MakeSessionURL(apiPath, query))
    }

    /**
     * Retrieves definitions of ALL open sessions
     * To retrieve just the IDs, see the GetSessionIds method
     */
    public GetSessions(appId: string, query: string): Promise<models.SessionList> {
        let apiPath = `app/${appId}/sessions`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /**
     * Retrieves a list of session IDs
     * To retrieve the definitions, see the GetSessions method
     */
    public GetSessionIds(appId: string, query: string): Promise<models.SessionIdList> {
        let apiPath = `app/${appId}/session`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    //=============================================================================
    // Teach
    //=============================================================================

    /** Creates a new teaching session and a corresponding trainDialog */
    public StartTeach(appId: string, createTeachParams: models.CreateTeachParams | null): Promise<models.TeachResponse> {
        let apiPath = `app/${appId}/teach`
        return this.send('POST', this.MakeURL(apiPath), createTeachParams ? createTeachParams : {})
    }

    /** Retrieves information about the specified teach */
    public GetTeach(appId: string, teachId: string): Promise<models.Teach> {
        let apiPath = `app/${appId}/teach/${teachId}`
        return this.send('GET', this.MakeURL(apiPath))
    }

    /**
     * Runs entity extraction (prediction).
     * If a more recent version of the package is available on
     * the server, the session will first migrate to that newer version.  This
     * doesn't affect the trainDialog maintained.
     */
    public TeachExtract(appId: string, teachId: string, userInput: models.UserInput): Promise<models.ExtractResponse> {
        let apiPath = `app/${appId}/teach/${teachId}/extractor`
        let query = 'includeDefinitions=true'
        return this.send('PUT', this.MakeURL(apiPath, query), { text: userInput.text })
    }

    /**
     * Uploads a labeled entity extraction instance
     * ie "commits" an entity extraction label, appending it to the teach session's
     * trainDialog, and advancing the dialog. This may yield produce a new package.
     */
    public TeachExtractFeedback(appId: string, teachId: string, extractorStep: models.TrainExtractorStep): Promise<models.TeachResponse> {
        let apiPath = `app/${appId}/teach/${teachId}/extractor`
        return this.send('POST', this.MakeURL(apiPath), extractorStep)
    }

    /**
     * Takes a turn and return distribution over actions.
     * If a more recent version of the package is
     * available on the server, the session will first migrate to that newer version.
     * This doesn't affect the trainDialog maintained by the teaching session.
     */
    public TeachScore(appId: string, teachId: string, scorerInput: models.ScoreInput): Promise<models.ScoreResponse> {
        let apiPath = `app/${appId}/teach/${teachId}/scorer`
        return this.send('PUT', this.MakeURL(apiPath), scorerInput)
    }

    /**
     * Uploads a labeled scorer step instance
     * – ie "commits" a scorer label, appending it to the teach session's
     * trainDialog, and advancing the dialog. This may yield produce a new package.
     */
    public TeachScoreFeedback(appId: string, teachId: string, scorerResponse: models.TrainScorerStep): Promise<models.TeachResponse> {
        let apiPath = `app/${appId}/teach/${teachId}/scorer`
        return this.send('POST', this.MakeURL(apiPath), scorerResponse)
    }

    /**
     * Ends a teach.
     * For Teach sessions, does NOT delete the associated trainDialog.
     * To delete the associated trainDialog, call DELETE on the trainDialog.
     */
    public EndTeach(appId: string, teachId: string, query: string): Promise<models.TrainResponse> {
        let apiPath = `app/${appId}/teach/${teachId}`
        return this.send('DELETE', this.MakeURL(apiPath, query))
    }

    /**
     * Retrieves definitions of ALL teaching sessions
     * To retrieve just the IDs, see the GetTeachIds method
     */
    public GetTeaches(appId: string, query: string): Promise<models.TeachList> {
        let apiPath = `app/${appId}/teaches`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /**
     * Retrieves a list of teach session IDs
     * To retrieve the definitions, see the GetTeaches method
     */
    public GetTeachIds(appId: string, query: string): Promise<models.TeachIdList> {
        let apiPath = `app/${appId}/teach`
        return this.send('GET', this.MakeURL(apiPath, query))
    }
}

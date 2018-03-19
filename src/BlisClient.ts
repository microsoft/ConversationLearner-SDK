import * as models from 'blis-models'
import { BlisDebug } from './BlisDebug'
import * as NodeCache from 'node-cache'
import * as Request from 'request'

const luisAuthoringKeyHeader = 'x-luis-authoring-key'
const luisSubscriptionKeyHeader = 'x-luis-subscription-key'

type HTTP_METHOD = 'GET' | 'PUT' | 'POST' | 'DELETE'
const requestMethodMap = new Map<HTTP_METHOD, typeof Request.get | typeof Request.post>([
    ['GET', Request.get],
    ['PUT', Request.put],
    ['POST', Request.post],
    ['DELETE', Request.delete]
])

export interface IBlisClientOptions {
    serviceUri: string
    luisAuthoringKey?: string
    luisSubscriptionKey?: string
}

export class BlisClient {
    static authorizationHeader: string
    private serviceUri: string
    private luisAuthoringKey: string | undefined
    private luisSubscriptionKey: string | undefined
    private actionCache = new NodeCache({ stdTTL: 300, checkperiod: 600 })
    private entityCache = new NodeCache({ stdTTL: 300, checkperiod: 600 })
    private exportCache = new NodeCache({ stdTTL: 300, checkperiod: 600 })

    constructor(options: IBlisClientOptions) {
        if (typeof options.serviceUri !== 'string' || options.serviceUri.length === 0) {
            throw new Error(`serviceUri must be a non-empty string. You passed: ${options.serviceUri}`)
        }

        // TODO: Make luisAuthoringKey required, add guard statement similar to serviceUri

        this.serviceUri = options.serviceUri
        this.luisAuthoringKey = options.luisAuthoringKey
        this.luisSubscriptionKey = options.luisSubscriptionKey
    }

    private MakeURL(apiPath: string, query?: string) {
        let uri = this.serviceUri + (!this.serviceUri.endsWith('/') ? '/' : '') + apiPath
        if (query) uri += `?${query}`
        return uri
    }

    public ClearExportCache(appId: string): void {
        this.exportCache.del(appId)
    }

    private send<T>(method: HTTP_METHOD, url: string, body?: any): Promise<T> {
        return new Promise((resolve, reject) => {
            const requestData = {
                url,
                headers: {
                    Authorization: BlisClient.authorizationHeader,
                    [luisAuthoringKeyHeader]: this.luisAuthoringKey,
                    [luisSubscriptionKeyHeader]: this.luisSubscriptionKey
                },
                json: true,
                body
            }

            BlisDebug.LogRequest(method, url, requestData)
            const requestMethod = requestMethodMap.get(method)
            if(!requestMethod) {
                throw new Error(`Request method not found for http verb: ${method}`)
            }
    
            requestMethod(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    resolve(body)
                }
            })
        })
    }

    //=============================================================================
    // Action
    //=============================================================================

    /** 
     * Retrieves information about a specific action for the current package
     *  (or the specified package if provided)
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
    public EditAction(appId: string, action: models.ActionBase): Promise<string> {
        this.actionCache.del(action.actionId)

        let apiPath = `app/${appId}/action/${action.actionId}`
        return this.send('PUT', this.MakeURL(apiPath), action)
    }

    /** Marks an action as deleted */
    public DeleteAction(appId: string, actionId: string): Promise<string> {
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
    public GetApp(appId: string, query: string): Promise<models.BlisAppBase> {
        let apiPath = `app/${appId}`
        return this.send<models.BlisAppBase>('GET', this.MakeURL(apiPath))
    }

    public GetAppSource(appId: string, query: string): Promise<models.TrainingStatus> {
        let apiPath = `app/${appId}/source`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    public GetAppTrainingStatus(appId: string, query: string): Promise<models.TrainingStatus> {
        let apiPath = `app/${appId}/trainingstatus`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Retrieve a list of (active) applications */
    public GetApps(query: string): Promise<models.BlisAppList> {
        let apiPath = `apps`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Create a new application */
    public CopyApps(srcUserId: string, destUserId: string, luisSubscriptionKey: string): Promise<string> {
        var apiPath = `apps/copy?srcUserId=${srcUserId}&destUserId=${destUserId}&luisSubscriptionKey=${luisSubscriptionKey}`
        return this.send('POST', this.MakeURL(apiPath))
    }

    /** 
     * Rename an existing application or changes its LUIS key
     * Note: Renaming an application does not affect packages
     */
    public EditApp(app: models.BlisAppBase, query: string): Promise<string> {
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
    public async AddApp(blisApp: models.BlisAppBase, query: string): Promise<string> {
        var apiPath = `app`
        const appResponse = await this.send<models.BlisAppBase>('POST', this.MakeURL(apiPath, query), blisApp)
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

    /** Retrieves details for a specific $appId*/
    public GetAppStatus(appId: string): Promise<models.BlisAppBase> {
        let apiPath = `archive/${appId}`
        return this.send('DELETE', this.MakeURL(apiPath))
    }

    /** Moves an application from the archive to the set of active applications */
    public RestoreApp(appId: string): Promise<string> {
        let apiPath = `archive/${appId}`
        return this.send('PUT', this.MakeURL(apiPath))
    }

    /** Retrieves a list of application Ids in the archive for the given user */
    public GetArchivedAppIds(query: string): Promise<models.BlisAppIdList> {
        let apiPath = `archive`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Retrieves a list of full applications in the archive for the given user */
    public GetArchivedApps(query: string): Promise<models.BlisAppList> {
        let apiPath = `archives`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    //==============================================================================
    // Entity
    //=============================================================================

    /** Retrieves information about a specific entity in the latest package
     * (or the specified package, if provided) */
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

    /** Retrieves definitions of ALL entities in the latest package
     * (or the specified package, if provided).  To retrieve just the IDs
     * of all entities, see the GetEntityIds method */
    public GetEntities(appId: string, query?: string): Promise<models.EntityList> {
        let apiPath = `app/${appId}/entities`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Retrieves a list of entity IDs for the latest package
     * (or the specified package, if provided).  To retrieve the definitions
     * of many entities, see the GetEntities method */
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
        return this.send('GET', this.MakeURL(apiPath))
    }

    /** Retrieves the contents of many/all logDialogs.
     * To retrieve just a list of IDs of all logDialogs,
     * see the GET GetLogDialogIds method. */
    public GetLogDialogs(appId: string, query: string): Promise<models.LogDialogList> {
        let apiPath = `app/${appId}/logdialogs`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Retrieves just the IDs of logDialogs.
     * To retrieve the contents of many logDialogs, see the GetLogDialogs method. */
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

    /** Retrieves information about a specific trainDialog in the current package
     * (or the specified package, if provided) */
    public GetTrainDialog(appId: string, trainDialogId: string, includeDefinitions: boolean = false): Promise<models.TrainDialog> {
        let query = `includeDefinitions=${includeDefinitions}`
        let apiPath = `app/${appId}/traindialog/${trainDialogId}`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Retrieves the contents of many/all train dialogs.
     * To retrieve just a list of IDs of all trainDialogs,
     * see the GetTrainDialogIds method */
    public GetTrainDialogs(appId: string, query: string): Promise<models.TrainDialogList> {
        let apiPath = `app/${appId}/traindialogs`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Retrieves a list of trainDialog IDs.
     * To retrieve the contents of multiple trainDialogs,
     * see the GetTrainDialogs method */
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
        return this.send('PUT', this.MakeURL(apiPath, query))
    }

    //=============================================================================
    // Session
    //=============================================================================

    /** Creates a new session and a corresponding logDialog */
    public StartSession(appId: string, sessionCreateParams: models.SessionCreateParams): Promise<models.Session> {
        let apiPath = `app/${appId}/session`
        return this.send('POST', this.MakeURL(apiPath), sessionCreateParams)
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

        return this.send('PUT', this.MakeURL(apiPath, query), userInput)
    }

    /** Take a turn and returns chosen action */
    public SessionScore(appId: string, sessionId: string, scorerInput: models.ScoreInput): Promise<models.ScoreResponse> {
        let apiPath = `app/${appId}/session/${sessionId}/scorer`
        return this.send('PUT', this.MakeURL(apiPath), scorerInput)
    }

    /** End a session. */
    public EndSession(appId: string, sessionId: string): Promise<string> {
        let apiPath = `app/${appId}/session/${sessionId}`
        return this.send('DELETE', this.MakeURL(apiPath))
    }

    /** Retrieves definitions of ALL open sessions
     * To retrieve just the IDs, see the GetSessionIds method */
    public GetSessions(appId: string, query: string): Promise<models.SessionList> {
        let apiPath = `app/${appId}/sessions`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Retrieves a list of session IDs
     * To retrieve the definitions, see the GetSessions method */
    public GetSessionIds(appId: string, query: string): Promise<models.SessionIdList> {
        let apiPath = `app/${appId}/session`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    //=============================================================================
    // Teach
    //=============================================================================

    /** Creates a new teaching session and a corresponding trainDialog */
    public StartTeach(appId: string, contextDialog: models.ContextDialog | null): Promise<models.TeachResponse> {
        let apiPath = `app/${appId}/teach`
        return this.send('POST', this.MakeURL(apiPath), contextDialog ? contextDialog : {})
    }

    /** Retrieves information about the specified teach */
    public GetTeach(appId: string, teachId: string): Promise<models.Teach> {
        let apiPath = `app/${appId}/teach/${teachId}`
        return this.send('GET', this.MakeURL(apiPath))
    }

    /** Runs entity extraction (prediction).
     * If a more recent version of the package is available on
     * the server, the session will first migrate to that newer version.  This
     * doesn't affect the trainDialog maintained.
     */
    public TeachExtract(appId: string, teachId: string, userInput: models.UserInput): Promise<models.ExtractResponse> {
        let apiPath = `app/${appId}/teach/${teachId}/extractor`
        let query = 'includeDefinitions=true'
        return this.send('PUT', this.MakeURL(apiPath, query), { text: userInput.text })
    }

    /** Uploads a labeled entity extraction instance
     * ie "commits" an entity extraction label, appending it to the teach session's
     * trainDialog, and advancing the dialog. This may yield produce a new package.
     */
    public TeachExtractFeedback(appId: string, teachId: string, extractorStep: models.TrainExtractorStep): Promise<models.TeachResponse> {
        let apiPath = `app/${appId}/teach/${teachId}/extractor`
        return this.send('POST', this.MakeURL(apiPath), extractorStep)
    }

    /** Takes a turn and return distribution over actions.
     * If a more recent version of the package is
     * available on the server, the session will first migrate to that newer version.
     * This doesn't affect the trainDialog maintained by the teaching session.
     */
    public TeachScore(appId: string, teachId: string, scorerInput: models.ScoreInput): Promise<models.ScoreResponse> {
        let apiPath = `app/${appId}/teach/${teachId}/scorer`
        return this.send('PUT', this.MakeURL(apiPath), scorerInput)
    }

    /** Uploads a labeled scorer step instance
     * – ie "commits" a scorer label, appending it to the teach session's
     * trainDialog, and advancing the dialog. This may yield produce a new package.
     */
    public TeachScoreFeedback(appId: string, teachId: string, scorerResponse: models.TrainScorerStep): Promise<models.TeachResponse> {
        let apiPath = `app/${appId}/teach/${teachId}/scorer`
        return this.send('POST', this.MakeURL(apiPath), scorerResponse)
    }

    /** Ends a teach.
     * For Teach sessions, does NOT delete the associated trainDialog.
     * To delete the associated trainDialog, call DELETE on the trainDialog.
     */
    public EndTeach(appId: string, teachId: string, query: string): Promise<models.TrainResponse> {
        let apiPath = `app/${appId}/teach/${teachId}`
        return this.send('DELETE', this.MakeURL(apiPath, query))
    }

    /** Retrieves definitions of ALL teaching sessions
     * To retrieve just the IDs, see the GetTeachIds method */
    public GetTeaches(appId: string, query: string): Promise<models.TeachList> {
        let apiPath = `app/${appId}/teaches`
        return this.send('GET', this.MakeURL(apiPath, query))
    }

    /** Retrieves a list of teach session IDs
     * To retrieve the definitions, see the GetTeaches method */
    public GetTeachIds(appId: string, query: string): Promise<models.TeachIdList> {
        let apiPath = `app/${appId}/teach`
        return this.send('GET', this.MakeURL(apiPath, query))
    }
}

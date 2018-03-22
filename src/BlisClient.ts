import * as models from 'blis-models'
import { BlisDebug } from './BlisDebug'
import * as NodeCache from 'node-cache'
import * as Request from 'request'
import { PackageReference } from 'blis-models';

export class BlisClient {
    static authorizationHeader: string
    private serviceUri: string
    private actionCache = new NodeCache({ stdTTL: 300, checkperiod: 600 })
    private entityCache = new NodeCache({ stdTTL: 300, checkperiod: 600 })
    private exportCache = new NodeCache({ stdTTL: 300, checkperiod: 600 })

    constructor(serviceUri: string) {
        if (typeof serviceUri !== 'string' || serviceUri.length === 0) {
            throw new Error(`serviceUri must be a non-empty string. You passed: ${serviceUri}`)
        }

        this.serviceUri = serviceUri
    }

    private MakeURL(apiPath: string, query?: string) {
        let uri = this.serviceUri + (!this.serviceUri.endsWith('/') ? '/' : '') + apiPath
        if (query) uri += `?${query}`
        return uri
    }

    public ClearExportCache(appId: string): void {
        this.exportCache.del(appId)
    }

    //=============================================================================
    // Action
    //=============================================================================

    /** Retrieves information about a specific action for the current package
     *  (or the specified package if provided) */
    public GetAction(appId: string, actionId: string, query: string): Promise<models.ActionBase> {
        return new Promise((resolve, reject) => {
            // Check cache first
            let action = this.actionCache.get(actionId) as models.ActionBase
            if (action) {
                resolve(action)
                return
            }

            // Call API
            let apiPath = `app/${appId}/action/${actionId}`
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    var action: models.ActionBase = body
                    action.actionId = actionId
                    this.actionCache.set(actionId, action)
                    resolve(action)
                }
            })
        })
    }

    /** Retrieves definitions of ALL actions for the current package
     * (or the specified package if provided). To retrieve just the
     * IDs of actions, see the GetActionIds Method */
    public GetActions(appId: string, query: string): Promise<models.ActionList> {
        let apiPath = `app/${appId}/actions`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let actions: models.ActionList = body
                    resolve(actions)
                }
            })
        })
    }

    /** Retrieves a list of action IDs for the latest package
     * (or the specified package, if provided).  To retrieve
     * the definitions of many actions, see the GetAction method */
    public GetActionIds(appId: string, query: string): Promise<models.ActionIdList> {
        let apiPath = `app/${appId}/action`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let actions: models.ActionIdList = body
                    resolve(actions)
                }
            })
        })
    }

    /** Updates payload and/or metadata on an existing action */
    public EditAction(appId: string, action: models.ActionBase): Promise<string> {
        let apiPath = `app/${appId}/action/${action.actionId}`

        // Clear old one from cache
        this.actionCache.del(action.actionId)

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: action,
                json: true
            }

            BlisDebug.LogRequest('PUT', apiPath, requestData)
            Request.put(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    // Service returns a 204
                    resolve(body)
                }
            })
        })
    }

    /** Marks an action as deleted */
    public DeleteAction(appId: string, actionId: string): Promise<string> {
        let apiPath = `app/${appId}/action/${actionId}`

        return new Promise((resolve, reject) => {
            let url = this.MakeURL(apiPath)
            const requestData = {
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('DELETE', apiPath, requestData)
            Request.delete(url, requestData, (error, response, body) => {
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

    /** Create a new action */
    public AddAction(appId: string, action: models.ActionBase): Promise<string> {
        let apiPath = `app/${appId}/action`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: action,
                json: true
            }
            BlisDebug.LogRequest('POST', apiPath, requestData)
            Request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    resolve(body.actionId)
                }
            })
        })
    }

    //==============================================================================
    // App
    //=============================================================================

    /** Retrieve information about a specific application
     * If the app ID isn't found in the set of (non-archived) apps,
     * returns 404 error ("not found")
     */
    public GetApp(appId: string): Promise<models.BlisAppBase> {
        let apiPath = `app/${appId}`

        return new Promise((resolve, reject) => {
            let url = this.MakeURL(apiPath)
            const requestData = {
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(url, requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    var blisApp: models.BlisAppBase = body
                    blisApp.appId = appId
                    resolve(blisApp)
                }
            })
        })
    }

    public GetAppSource(appId: string, packageId: string): Promise<models.AppDefinition> {
        let apiPath = `app/${appId}/source?package=${packageId}`

        return new Promise((resolve, reject) => {
            let url = this.MakeURL(apiPath)
            const requestData = {
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(url, requestData, (error, response, body) => {
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

    public GetAppTrainingStatus(appId: string, query: string): Promise<models.TrainingStatus> {
        let apiPath = `app/${appId}/trainingstatus`

        return new Promise((resolve, reject) => {
            let url = this.MakeURL(apiPath, query)
            const requestData = {
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            // Disable unless debugging to reduce chatter
            //BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(url, requestData, (error, response, body) => {
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

    /** Retrieve a list of (active) applications */
    public GetApps(query: string): Promise<models.BlisAppList> {
        let apiPath = `apps`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }

            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let apps: models.BlisAppList = body
                    resolve(apps)
                }
            })
        })
    }

    /** Create a new application
     */
    public CopyApps(srcUserId: string, destUserId: string, luisSubscriptionKey: string): Promise<string> {
        var apiPath = `apps/copy?srcUserId=${srcUserId}&destUserId=${destUserId}&luisSubscriptionKey=${luisSubscriptionKey}`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('POST', apiPath, requestData)
            Request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    // Array of appIds
                    resolve(body) 
                }
            })
        })
    }

    /** Rename an existing application or changes its LUIS key
     * Note: Renaming an application does not affect packages
     */
    public EditApp(app: models.BlisAppBase, query: string): Promise<string> {
        let apiPath = `app/${app.appId}`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: app,
                json: true
            }

            BlisDebug.LogRequest('PUT', apiPath, requestData)
            Request.put(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    // Service returns a 204
                    resolve(body)
                }
            })
        })
    }

    /** Archive an existing application
     * Note: "deleting" an application doesn't destroy it, but rather archives
     * it for a period (eg 30 days).  During the archive period, the application
     * can be restored with the next API call.  At the end of the archive period,
     * the application is destroyed.
     */
    public ArchiveApp(appId: string): Promise<string> {
        let apiPath = `app/${appId}`

        return new Promise((resolve, reject) => {
            let url = this.MakeURL(apiPath)
            const requestData = {
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('DELETE', apiPath, requestData)
            Request.delete(url, requestData, (error, response, body) => {
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

    /** Create a new application
     */
    public AddApp(blisApp: models.BlisAppBase, query: string): Promise<string> {
        var apiPath = `app`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: blisApp,
                json: true
            }
            BlisDebug.LogRequest('POST', apiPath, requestData)
            Request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    resolve(body.appId)
                }
            })
        })
    }

    /** Destroys an existing application, including all its models, sessions, and logged dialogs
     * Deleting an application from the archive really destroys it – no undo.
     */
    public DeleteApp(appId: string): Promise<string> {
        let apiPath = `archive/${appId}`

        return new Promise((resolve, reject) => {
            let url = this.MakeURL(apiPath)
            const requestData = {
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('DELETE', apiPath, requestData)
            Request.delete(url, requestData, (error, response, body) => {
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

    /** Retrieves details for a specific $appId*/
    public GetAppStatus(appId: string): Promise<models.BlisAppBase> {
        let apiPath = `archive/${appId}`

        return new Promise((resolve, reject) => {
            let url = this.MakeURL(apiPath)
            const requestData = {
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('DELETE', apiPath, requestData)
            Request.get(url, requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let app: models.BlisAppBase = body
                    resolve(app)
                }
            })
        })
    }

    /** Moves an application from the archive to the set of active applications */
    public RestoreApp(appId: string): Promise<string> {
        let apiPath = `archive/${appId}`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }

            BlisDebug.LogRequest('PUT', apiPath, requestData)
            Request.put(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    // Service returns a 204
                    resolve(body)
                }
            })
        })
    }

    /** Retrieves a list of application Ids in the archive for the given user */
    public GetArchivedAppIds(query: string): Promise<models.BlisAppIdList> {
        let apiPath = `archive`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }

            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let apps: models.BlisAppIdList = body
                    resolve(apps)
                }
            })
        })
    }

    /** Retrieves a list of full applications in the archive for the given user */
    public GetArchivedApps(query: string): Promise<models.BlisAppList> {
        let apiPath = `archives`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }

            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let apps: models.BlisAppList = body
                    resolve(apps)
                }
            })
        })
    }

    /** Creates a new package tag */
    public PublishApp(appId: string, tagName: string): Promise<PackageReference> {
        let apiPath = `app/${appId}/publish?version=${tagName}`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }

            BlisDebug.LogRequest('PUT', apiPath, requestData)
            Request.put(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let packageReference: models.PackageReference = body
                    resolve(packageReference)
                }
            })
        })
    }

    /** Sets a package tags as the live version */
    public PublishProdPackage(appId: string, packageId: string): Promise<string> {
        let apiPath = `app/${appId}/publish/${packageId}`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }

            BlisDebug.LogRequest('POST', apiPath, requestData)
            Request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    // Service returns a 204
                    resolve(body)
                }
            })
        })
    }

    //==============================================================================
    // Entity
    //=============================================================================

    /** Retrieves information about a specific entity in the latest package
     * (or the specified package, if provided) */
    public GetEntity(appId: string, entityId: string, query: string): Promise<models.EntityBase> {
        return new Promise((resolve, reject) => {
            // Check cache first
            let entity = this.entityCache.get(entityId) as models.EntityBase
            if (entity) {
                resolve(entity)
                return
            }

            let apiPath = `app/${appId}/entity/${entityId}`
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let entity: models.EntityBase = body
                    this.entityCache.set(entityId, entity)
                    resolve(entity)
                }
            })
        })
    }

    /** Retrieves definitions of ALL entities in the latest package
     * (or the specified package, if provided).  To retrieve just the IDs
     * of all entities, see the GetEntityIds method */
    public GetEntities(appId: string, query?: string): Promise<models.EntityList> {
        let apiPath = `app/${appId}/entities`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let entities: models.EntityList = body
                    resolve(entities)
                }
            })
        })
    }

    /** Retrieves a list of entity IDs for the latest package
     * (or the specified package, if provided).  To retrieve the definitions
     * of many entities, see the GetEntities method */
    public GetEntityIds(appId: string, query: string): Promise<models.EntityIdList> {
        let apiPath = `app/${appId}/entity`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let entityIds: models.EntityIdList = body
                    resolve(entityIds)
                }
            })
        })
    }

    /** Updates name and/or metadata on an existing entity */
    public EditEntity(appId: string, entity: models.EntityBase): Promise<string> {
        let apiPath = `app/${appId}/entity/${entity.entityId}`

        // Clear old one from cache
        this.entityCache.del(entity.entityId)

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: entity,
                json: true
            }

            BlisDebug.LogRequest('PUT', apiPath, requestData)
            Request.put(requestData, (error, response, body) => {
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

    /** Deletes an entity */
    public DeleteEntity(appId: string, entityId: string): Promise<string> {
        let apiPath = `app/${appId}/entity/${entityId}`

        return new Promise((resolve, reject) => {
            let url = this.MakeURL(apiPath)
            const requestData = {
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('DELETE', apiPath, requestData)
            Request.delete(url, requestData, (error, response, body) => {
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

    /** Create a new entity */
    public AddEntity(appId: string, entity: models.EntityBase): Promise<string> {
        let apiPath = `app/${appId}/entity`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: entity,
                json: true
            }
            BlisDebug.LogRequest('POST', apiPath, requestData)
            Request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    resolve(body.entityId)
                }
            })
        })
    }

    //=============================================================================
    // Log Dialogs
    //=============================================================================

    /** Retrieves information about a specific logDialog */
    public GetLogDialog(appId: string, logDialogId: string): Promise<models.LogDialog> {
        return new Promise((resolve, reject) => {
            let apiPath = `app/${appId}/logdialog/${logDialogId}`
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let logDialog: models.LogDialog = body
                    logDialog.logDialogId = logDialogId
                    resolve(logDialog)
                }
            })
        })
    }

    /** Retrieves the contents of many/all logDialogs.
     * To retrieve just a list of IDs of all logDialogs,
     * see the GET GetLogDialogIds method. */
    public GetLogDialogs(appId: string, packageId: string): Promise<models.LogDialogList> {

        // LARS TEMP
        let packages = packageId.split(",").map(p => `package=${p}`).join("&");
        
        let apiPath = `app/${appId}/logdialogs?${packages}`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let logDialogList: models.LogDialogList = body
                    resolve(logDialogList)
                }
            })
        })
    }

    /** Retrieves just the IDs of logDialogs.
     * To retrieve the contents of many logDialogs, see the GetLogDialogs method. */
    public GetLogDialogIds(appId: string, query: string): Promise<models.LogDialogIdList> {
        let apiPath = `app/${appId}/logdialog`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let logDialogsIds: models.LogDialogIdList = body
                    resolve(logDialogsIds)
                }
            })
        })
    }

    /** Deletes a LogDialog */
    public DeleteLogDialog(appId: string, logDialogId: string): Promise<string> {
        let apiPath = `app/${appId}/logdialog/${logDialogId}`

        return new Promise((resolve, reject) => {
            let url = this.MakeURL(apiPath)
            const requestData = {
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('DELETE', apiPath, requestData)
            Request.delete(url, requestData, (error, response, body) => {
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
    // Train Dialogs
    //=============================================================================

    /** Create a new TrainDialog */
    public AddTrainDialog(appId: string, trainDialog: models.TrainDialog): Promise<models.TrainResponse> {
        let apiPath = `app/${appId}/traindialog`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: trainDialog,
                json: true
            }
            BlisDebug.LogRequest('POST', apiPath, requestData)
            Request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let editResponse: models.TrainResponse = body
                    resolve(editResponse)
                }
            })
        })
    }

    /** Updates a trainDialog, overwriting the content of its dialog */
    public EditTrainDialog(appId: string, trainDialog: models.TrainDialog): Promise<models.TrainResponse> {
        let apiPath = `app/${appId}/traindialog/${trainDialog.trainDialogId}`

        // Clear old one from cache
        this.entityCache.del(trainDialog.trainDialogId)

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: trainDialog,
                json: true
            }

            BlisDebug.LogRequest('PUT', apiPath, requestData)
            Request.put(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let editResponse: models.TrainResponse = body
                    resolve(editResponse)
                }
            })
        })
    }

    /** Retrieves information about a specific trainDialog in the current package
     * (or the specified package, if provided) */
    public GetTrainDialog(appId: string, trainDialogId: string, includeDefinitions: boolean = false): Promise<models.TrainDialog> {
        return new Promise((resolve, reject) => {
            let query = `includeDefinitions=${includeDefinitions}`

            let apiPath = `app/${appId}/traindialog/${trainDialogId}`
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let trainDialog: models.TrainDialog = body
                    trainDialog.trainDialogId = trainDialogId
                    resolve(trainDialog)
                }
            })
        })
    }

    /** Retrieves the contents of many/all train dialogs.
     * To retrieve just a list of IDs of all trainDialogs,
     * see the GetTrainDialogIds method */
    public GetTrainDialogs(appId: string, query: string): Promise<models.TrainDialogList> {
        let apiPath = `app/${appId}/traindialogs`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let trainDialogList: models.TrainDialogList = body
                    resolve(trainDialogList)
                }
            })
        })
    }

    /** Retrieves a list of trainDialog IDs.
     * To retrieve the contents of multiple trainDialogs,
     * see the GetTrainDialogs method */
    public GetTrainDialogIds(appId: string, query: string): Promise<models.TrainDialogIdList> {
        let apiPath = `app/${appId}/traindialog`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let trainDialogsIds: models.TrainDialogIdList = body
                    resolve(trainDialogsIds)
                }
            })
        })
    }

    /** Deletes a TrainDialog */
    public DeleteTrainDialog(appId: string, trainDialogId: string): Promise<models.TrainResponse> {
        let apiPath = `app/${appId}/traindialog/${trainDialogId}`

        return new Promise((resolve, reject) => {
            let url = this.MakeURL(apiPath)
            const requestData = {
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('DELETE', apiPath, requestData)
            Request.delete(url, requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let deleteResponse: models.TrainResponse = body
                    resolve(deleteResponse)
                }
            })
        })
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
        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: userInput,
                json: true
            }

            BlisDebug.LogRequest('PUT', apiPath, requestData)
            Request.put(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    var extractResponse: models.ExtractResponse = body
                    resolve(extractResponse)
                }
            })
        })
    }

    //=============================================================================
    // Session
    //=============================================================================

    /** Creates a new session and a corresponding logDialog */
    public StartSession(appId: string, sessionCreateParams: models.SessionCreateParams): Promise<models.Session> {
        let apiPath = `app/${appId}/session`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: sessionCreateParams,
                json: true
            }

            BlisDebug.LogRequest('POST', apiPath, requestData)
            Request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let session: models.Session = body
                    resolve(session)
                }
            })
        })
    }

    /** Retrieves information about the specified session */
    public GetSession(appId: string, sessionId: string): Promise<models.Session> {
        return new Promise((resolve, reject) => {
            let apiPath = `app/${appId}/session/${sessionId}`
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let session: models.Session = body
                    session.sessionId = sessionId
                    resolve(session)
                }
            })
        })
    }

    /** Runs entity extraction (prediction). */
    public SessionExtract(appId: string, sessionId: string, userInput: models.UserInput): Promise<models.ExtractResponse> {
        let apiPath = `app/${appId}/session/${sessionId}/extractor`

        // Always retrieve entity list
        let query = 'includeDefinitions=true'
        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: userInput,
                json: true
            }

            BlisDebug.LogRequest('PUT', apiPath, requestData)
            Request.put(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    var extractResponse: models.ExtractResponse = body
                    resolve(extractResponse)
                }
            })
        })
    }

    /** Take a turn and returns chosen action */
    public SessionScore(appId: string, sessionId: string, scorerInput: models.ScoreInput): Promise<models.ScoreResponse> {
        let apiPath = `app/${appId}/session/${sessionId}/scorer`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: scorerInput,
                json: true
            }

            BlisDebug.LogRequest('PUT', apiPath, requestData)
            Request.put(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    var score: models.ScoreResponse = body
                    resolve(score)
                }
            })
        })
    }

    /** End a session. */
    public EndSession(appId: string, sessionId: string): Promise<string> {
        let apiPath = `app/${appId}/session/${sessionId}`

        return new Promise((resolve, reject) => {
            let url = this.MakeURL(apiPath)
            const requestData = {
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('DELETE', apiPath, requestData)
            Request.delete(url, requestData, (error, response, body) => {
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

    /** Retrieves definitions of ALL open sessions
     * To retrieve just the IDs, see the GetSessionIds method */
    public GetSessions(appId: string, query: string): Promise<models.SessionList> {
        let apiPath = `app/${appId}/sessions`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let sessions: models.SessionList = body
                    resolve(sessions)
                }
            })
        })
    }

    /** Retrieves a list of session IDs
     * To retrieve the definitions, see the GetSessions method */
    public GetSessionIds(appId: string, query: string): Promise<models.SessionIdList> {
        let apiPath = `app/${appId}/session`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let sessionIds: models.SessionIdList = body
                    resolve(sessionIds)
                }
            })
        })
    }

    //=============================================================================
    // Teach
    //=============================================================================

    /** Creates a new teaching session and a corresponding trainDialog */
    public StartTeach(appId: string, contextDialog: models.ContextDialog | null): Promise<models.TeachResponse> {
        let apiPath = `app/${appId}/teach`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: contextDialog ? contextDialog : {},
                json: true
            }

            BlisDebug.LogRequest('POST', apiPath, requestData)
            Request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    var teachResponse: models.TeachResponse = body
                    resolve(teachResponse)
                }
            })
        })
    }

    /** Retrieves information about the specified teach */
    public GetTeach(appId: string, teachId: string): Promise<models.Teach> {
        return new Promise((resolve, reject) => {
            let apiPath = `app/${appId}/teach/${teachId}`
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let teach: models.Teach = body
                    teach.teachId = teachId
                    resolve(teach)
                }
            })
        })
    }

    /** Runs entity extraction (prediction).
     * If a more recent version of the package is available on
     * the server, the session will first migrate to that newer version.  This
     * doesn't affect the trainDialog maintained.
     */
    public TeachExtract(appId: string, teachId: string, userInput: models.UserInput): Promise<models.ExtractResponse> {
        let apiPath = `app/${appId}/teach/${teachId}/extractor`

        // Always retrieve entity list
        let query = 'includeDefinitions=true'
        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: { text: userInput.text },
                json: true
            }

            BlisDebug.LogRequest('PUT', apiPath, requestData)
            Request.put(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    var extractResponse: models.ExtractResponse = body
                    resolve(extractResponse)
                }
            })
        })
    }

    /** Uploads a labeled entity extraction instance
     * ie "commits" an entity extraction label, appending it to the teach session's
     * trainDialog, and advancing the dialog. This may yield produce a new package.
     */
    public TeachExtractFeedback(appId: string, teachId: string, extractorStep: models.TrainExtractorStep): Promise<models.TeachResponse> {
        let apiPath = `app/${appId}/teach/${teachId}/extractor`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: extractorStep,
                json: true
            }

            BlisDebug.LogRequest('POST', apiPath, requestData)
            Request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    var teachResponse: models.TeachResponse = body
                    resolve(teachResponse)
                }
            })
        })
    }

    /** Takes a turn and return distribution over actions.
     * If a more recent version of the package is
     * available on the server, the session will first migrate to that newer version.
     * This doesn't affect the trainDialog maintained by the teaching session.
     */
    public TeachScore(appId: string, teachId: string, scorerInput: models.ScoreInput): Promise<models.ScoreResponse> {
        let apiPath = `app/${appId}/teach/${teachId}/scorer`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: scorerInput,
                json: true
            }

            BlisDebug.LogRequest('PUT', apiPath, requestData)
            Request.put(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    var scoreResponse: models.ScoreResponse = body
                    resolve(scoreResponse)
                }
            })
        })
    }

    /** Uploads a labeled scorer step instance
     * – ie "commits" a scorer label, appending it to the teach session's
     * trainDialog, and advancing the dialog. This may yield produce a new package.
     */
    public TeachScoreFeedback(appId: string, teachId: string, scorerResponse: models.TrainScorerStep): Promise<models.TeachResponse> {
        let apiPath = `app/${appId}/teach/${teachId}/scorer`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                body: scorerResponse,
                json: true
            }

            BlisDebug.LogRequest('POST', apiPath, requestData)
            Request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    var teachResponse: models.TeachResponse = body
                    resolve(teachResponse)
                }
            })
        })
    }

    /** Ends a teach.
     * For Teach sessions, does NOT delete the associated trainDialog.
     * To delete the associated trainDialog, call DELETE on the trainDialog.
     */
    public EndTeach(appId: string, teachId: string, query: string): Promise<models.TrainResponse> {
        let apiPath = `app/${appId}/teach/${teachId}`

        return new Promise((resolve, reject) => {
            let url = this.MakeURL(apiPath, query)
            const requestData = {
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('DELETE', apiPath, requestData)
            Request.delete(url, requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    var trainResponse: models.TrainResponse = body
                    resolve(trainResponse)
                }
            })
        })
    }

    /** Retrieves definitions of ALL teaching sessions
     * To retrieve just the IDs, see the GetTeachIds method */
    public GetTeaches(appId: string, query: string): Promise<models.TeachList> {
        let apiPath = `app/${appId}/teaches`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let teaches: models.TeachList = body
                    resolve(teaches)
                }
            })
        })
    }

    /** Retrieves a list of teach session IDs
     * To retrieve the definitions, see the GetTeaches method */
    public GetTeachIds(appId: string, query: string): Promise<models.TeachIdList> {
        let apiPath = `app/${appId}/teach`

        return new Promise((resolve, reject) => {
            const requestData = {
                url: this.MakeURL(apiPath, query),
                headers: {
                    Authorization: BlisClient.authorizationHeader
                },
                json: true
            }
            BlisDebug.LogRequest('GET', apiPath, requestData)
            Request.get(requestData, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (response.statusCode && response.statusCode >= 300) {
                    reject(response)
                } else {
                    let teachIds: models.TeachIdList = body
                    resolve(teachIds)
                }
            })
        })
    }
}

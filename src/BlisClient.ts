import { 
        ActionList, ActionIdList, 
        BlisAppList, BlisAppIdList, 
        EntityMetaData, EntityList, EntityIdList, 
        LogDialog, LogDialogList, LogDialogIdList, 
        TrainDialog, TrainResponse, TrainDialogList, TrainDialogIdList, 
        Session, SessionList, SessionIdList,
        UserInput, 
        ExtractResponse, 
        ScoreInput, ScoreResponse, 
        Teach, TeachResponse, TeachList, TeachIdList,
        TrainExtractorStep, TrainScorerStep,
        ActionBase, BlisAppBase, EntityBase 
    } from 'blis-models';
import { Credentials } from './Http/Credentials';
import { BlisDebug } from './BlisDebug';
import * as NodeCache from 'node-cache';
import * as Request from 'request';

export class BlisClient {

    public static client : BlisClient;
    private static serviceURI : string;
    
    // Create singleton
    public static Init(user : string, secret : string, azureFunctionsUrl : string, azureFunctionsKey : string)
    {
        this.client = new BlisClient(this.serviceURI, user, secret, azureFunctionsUrl, azureFunctionsKey);
    }

    public static SetServiceURI(serviceURI : string) : void
    {
        this.serviceURI = serviceURI;
    }

    private serviceUri : string;
    private credentials : Credentials;
    public azureFunctionsUrl : string;
    public azureFunctionsKey: string;

    private actionCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
    private entityCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
    private exportCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

    private constructor(serviceUri : string, public user : string, secret : string, azureFunctionsUrl : string, azureFunctionsKey : string)
    { 
        if (!serviceUri) 
        {
            throw "ServiceUri is not set";
        } 
        BlisDebug.Log("Creating BlisClient...");
        this.serviceUri = serviceUri;

        this.credentials = new Credentials(user, secret);
        this.azureFunctionsUrl = azureFunctionsUrl;
        this.azureFunctionsKey = azureFunctionsKey;
    }

    private MakeURL(apiPath : string, query? : string) 
    {
        let uri = this.serviceUri + (!this.serviceUri.endsWith("/") ? "/" : "") + apiPath;
        if (query) uri +=  `?${query}`;
        return uri;
    }

    public ClearExportCache(appId : string) : void
    {
        this.exportCache.del(appId);
    }

    //=============================================================================
    // Action
    //=============================================================================

        /** Retrieves information about a specific action for the current package
         *  (or the specified package if provided) */
        public GetAction(appId : string, actionId : string, query : string) : Promise<ActionBase>
        {
            return new Promise(
                (resolve, reject) => {
                    // Check cache first
                    let action = this.actionCache.get(actionId) as ActionBase;
                    if (action) {
                        resolve(action);
                        return;
                    }

                    // Call API
                    let apiPath = `app/${appId}/action/${actionId}`;
                    const requestData = {
                            url: this.MakeURL(apiPath, query),
                            headers: {
                                'Cookie' : this.credentials.Cookiestring()
                            },
                            json: true
                        }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            var action = new ActionBase(body);
                            action.actionId = actionId;
                            this.actionCache.set(actionId, action);
                            resolve(action);
                        }
                    });
                }
            )
        }

        /** Retrieves definitions of ALL actions for the current package 
         * (or the specified package if provided). To retrieve just the 
         * IDs of actions, see the GetActionIds Method */
        public GetActions(appId : string, query : string) : Promise<ActionList>
        {
            let apiPath = `app/${appId}/actions`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let actions = new ActionList(body);
                            resolve(actions);
                        }
                    });
                }
            )
        }

        /** Retrieves a list of action IDs for the latest package 
         * (or the specified package, if provided).  To retrieve 
         * the definitions of many actions, see the GetAction method */
        public GetActionIds(appId : string, query : string) : Promise<ActionIdList>
        {
            let apiPath = `app/${appId}/action`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let actions = new ActionIdList(body);
                            resolve(actions);
                        }
                    });
                }
            )
        }

        /** Updates payload and/or metadata on an existing action */
        public EditAction(appId : string, action : ActionBase) : Promise<string>
        {
            let apiPath = `app/${appId}/action/${action.actionId}`;

            // Clear old one from cache
            this.actionCache.del(action.actionId);

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: action,
                        json: true
                    }

                    BlisDebug.LogRequest("PUT",apiPath, requestData);
                    Request.put(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            // Service returns a 204
                            resolve(body);
                        }
                    });
                }
            )
        }

        /** Marks an action as deleted */
        public DeleteAction(appId : string, actionId : string) : Promise<string>
        {
            let apiPath = `app/${appId}/action/${actionId}`;

            return new Promise(
                (resolve, reject) => {
                    let url = this.MakeURL(apiPath);
                    const requestData = {
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("DELETE",apiPath, requestData);
                    Request.delete(url, requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            resolve(body);
                        }
                    });
                }
            )
        }

        /** Create a new action */
        public AddAction(appId : string, action : ActionBase) : Promise<string>
        {
            let apiPath = `app/${appId}/action`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: action,
                        json: true
                    }
                    BlisDebug.LogRequest("POST",apiPath, requestData);
                    Request.post(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            resolve(body.actionId);
                        }
                    });
                }
            )
        }

    //==============================================================================
    // App
    //=============================================================================

        /** Retrieve information about a specific application
         * If the app ID isn't found in the set of (non-archived) apps, 
         * returns 404 error ("not found") 
         */
        public GetApp(appId : string, query : string) : Promise<BlisAppBase> 
        {
            let apiPath = `app/${appId}?userId=${this.user}`;

            return new Promise(
                (resolve, reject) => {
                    let url = this.MakeURL(apiPath, query);
                    const requestData = {
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(url, requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            var blisApp = new BlisAppBase(body);
                            blisApp.appId = appId;
                            resolve(blisApp);
                        }
                    });
                }
            )
        }

        /** Retrieve a list of (active) applications */
        public GetApps(query : string) : Promise<BlisAppList>
        {
            let apiPath = `apps`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }

                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let apps = new BlisAppList(body);
                            resolve(apps);
                        }
                    });
                }
            )
        }

        /** Rename an existing application or changes its LUIS key
         * Note: Renaming an application does not affect packages
         */
        public EditApp(app : BlisAppBase, query : string) : Promise<string>
        {
            let apiPath = `app/${app.appId}`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: app,
                        json: true
                    }

                    BlisDebug.LogRequest("PUT",apiPath, requestData);
                    Request.put(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            // Service returns a 204
                            resolve(body);
                        }
                    });
                }
            )
        }
        
        /** Archive an existing application
         * Note: "deleting" an application doesn't destroy it, but rather archives 
         * it for a period (eg 30 days).  During the archive period, the application 
         * can be restored with the next API call.  At the end of the archive period, 
         * the application is destroyed.
         */
        public ArchiveApp(appId : string) : Promise<string>
        {
            let apiPath = `app/${appId}`;

            return new Promise(
                (resolve, reject) => {
                    let url = this.MakeURL(apiPath);
                    const requestData = {
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("DELETE",apiPath, requestData);
                    Request.delete(url, requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            resolve(body);
                        }
                    });
                }
            )
        }
    
        /** Create a new application
         */
        public AddApp(blisApp : BlisAppBase, query : string) : Promise<string>
        {
            var apiPath = `app`;


            return new Promise(
                (resolve, reject) => {
                    const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring(),
                        },
                        body: blisApp,
                        json: true
                    }
                    BlisDebug.LogRequest("POST",apiPath, requestData);
                    Request.post(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            var appId = body.appId;
                            resolve(appId);
                        }
                    });
                }
            )
        }

        /** Destroys an existing application, including all its models, sessions, and logged dialogs
         * Deleting an application from the archive really destroys it – no undo.
         */
        public DeleteApp(appId : string) : Promise<string>
        {
            let apiPath = `archive/${appId}`;

            return new Promise(
                (resolve, reject) => {
                    let url = this.MakeURL(apiPath);
                    const requestData = {
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("DELETE",apiPath, requestData);
                    Request.delete(url, requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            resolve(body);
                        }
                    });
                }
            )
        }

        /** Retrieves details for a specific $appId*/
        public GetAppStatus(appId : string) : Promise<BlisAppBase>
        {
            let apiPath = `archive/${appId}`;

            return new Promise(
                (resolve, reject) => {
                    let url = this.MakeURL(apiPath);
                    const requestData = {
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("DELETE",apiPath, requestData);
                    Request.get(url, requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let app = new BlisAppBase(body);
                            resolve(app);
                        }
                    });
                }
            )
        }

        /** Moves an application from the archive to the set of active applications */
        public RestoreApp(appId : string) : Promise<string>
        {
            let apiPath = `archive/${appId}`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }

                    BlisDebug.LogRequest("PUT",apiPath, requestData);
                    Request.put(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            // Service returns a 204
                            resolve(body);
                        }
                    });
                }
            )
        }

        /** Retrieves a list of application Ids in the archive for the given user */
        public GetArchivedAppIds(query : string) : Promise<BlisAppIdList>
        {
            let apiPath = `archive`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }

                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let apps = new BlisAppIdList(body);
                            resolve(apps);
                        }
                    });
                }
            )
        }

        
        /** Retrieves a list of full applications in the archive for the given user */
        public GetArchivedApps(query : string) : Promise<BlisAppList>
        {
            let apiPath = `archives`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }

                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let apps = new BlisAppList(body);
                            resolve(apps);
                        }
                    });
                }
            )
        }

    //==============================================================================
    // Entity
    //=============================================================================

        /** Retrieves information about a specific entity in the latest package
         * (or the specified package, if provided) */
        public GetEntity(appId : string, entityId : string, query : string) : Promise<EntityBase>
        {
                return new Promise(
                (resolve, reject) => {
                    // Check cache first
                    let entity = this.entityCache.get(entityId) as EntityBase;
                    if (entity) {
                        resolve(entity);
                        return;
                    }

                let apiPath = `app/${appId}/entity/${entityId}`;
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let entity = new EntityBase(body);
                            entity.entityId = entityId;
                            if (!entity.metadata)
                            {
                                entity.metadata = new EntityMetaData();
                            }
                            this.entityCache.set(entityId, entity);
                            resolve(entity);
                        }
                    });
                }
            )
        }

        /** Retrieves definitions of ALL entities in the latest package 
         * (or the specified package, if provided).  To retrieve just the IDs 
         * of all entities, see the GetEntityIds method */
        public GetEntities(appId : string, query : string) : Promise<EntityList>
        {
            let apiPath = `app/${appId}/entities`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let entities = new EntityList(body);
                            resolve(entities);
                        }
                    });
                }
            )
        }

        /** Retrieves a list of entity IDs for the latest package 
         * (or the specified package, if provided).  To retrieve the definitions
         * of many entities, see the GetEntities method */
        public GetEntityIds(appId : string, query : string) : Promise<EntityIdList>
        {
            let apiPath = `app/${appId}/entity`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath,query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let entityIds = new EntityIdList(body);
                            resolve(entityIds);
                        }
                    });
                }
            )
        }

        /** Updates name and/or metadata on an existing entity */
        public EditEntity(appId : string, entity : EntityBase) : Promise<string>
        { 
            let apiPath = `app/${appId}/entity/${entity.entityId}`;

            // Clear old one from cache
            this.entityCache.del(entity.entityId);

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: entity,
                        json: true
                    }

                    BlisDebug.LogRequest("PUT",apiPath, requestData);
                    Request.put(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            resolve(body);
                        }
                    });
                }
            )
        }

        /** Deletes an entity */
        public DeleteEntity(appId : string, entityId : string) : Promise<string>
        {
            let apiPath = `app/${appId}/entity/${entityId}`;

            return new Promise(
                (resolve, reject) => {
                    let url = this.MakeURL(apiPath);
                    const requestData = {
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("DELETE",apiPath, requestData);
                    Request.delete(url, requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            resolve(body);
                        }
                    });
                }
            )
        }

        /** Create a new entity */
        public AddEntity(appId : string, entity : EntityBase) : Promise<string>
        {
            let apiPath = `app/${appId}/entity`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: entity,
                        json: true
                    }
                    BlisDebug.LogRequest("POST",apiPath, requestData);
                    Request.post(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            resolve(body.entityId);
                        }
                    });
                }
            )
        }

    //=============================================================================
    // Log Dialogs
    //=============================================================================
    
        /** Retrieves information about a specific logDialog */
        public GetLogDialog(appId : string, logDialogId : string) : Promise<LogDialog>
        {
                return new Promise(
                (resolve, reject) => {

                let apiPath = `app/${appId}/logdialog/${logDialogId}`;
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let logDialog = new LogDialog(body);
                            logDialog.logDialogId = logDialogId;
                            resolve(logDialog);
                        }
                    });
                }
            )
        }

        /** Retrieves the contents of many/all logDialogs.  
         * To retrieve just a list of IDs of all logDialogs, 
         * see the GET GetLogDialogIds method. */
        public GetLogDialogs(appId : string, query : string) : Promise<LogDialogList>
        {
            let apiPath = `app/${appId}/logdialogs`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let logDialogList = new LogDialogList(body);
                            resolve(logDialogList);
                        }
                    });
                }
            )
        }

        /** Retrieves just the IDs of logDialogs.  
         * To retrieve the contents of many logDialogs, see the GetLogDialogs method. */
        public GetLogDialogIds(appId : string, query : string) : Promise<LogDialogIdList>
        {
            let apiPath = `app/${appId}/logdialog`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let logDialogsIds = new LogDialogIdList(body);
                            resolve(logDialogsIds);
                        }
                    });
                }
            )
        }

        /** Deletes a LogDialog */
        public DeleteLogDialog(appId : string, logDialogId : string) : Promise<string>
        {
            let apiPath = `app/${appId}/logdialog/${logDialogId}`;

            return new Promise(
                (resolve, reject) => {
                    let url = this.MakeURL(apiPath);
                    const requestData = {
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("DELETE",apiPath, requestData);
                    Request.delete(url, requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            resolve(body);
                        }
                    });
                }
            )
        }

        /** Runs entity extraction (prediction). */
        public LogDialogExtract(appId : string, logDialogId : string, turnIndex: string, userInput : UserInput) : Promise<ExtractResponse>
        {
            // TEMP - until supported by server
            return new Promise((resolve, reject) => {
                let extractResponse = new ExtractResponse({
                    text : userInput.text,
                    predictedEntities : []
                });
                resolve(extractResponse);
            });

            /*
            let apiPath = `app/${appId}/logdialog/${logDialogId}/extractor/${turnIndex}`;

            // Always retrieve entity list
            let query = "includeDefinitions=true";
            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: userInput,
                        json: true
                    }

                    BlisDebug.LogRequest("PUT",apiPath, requestData);
                    Request.put(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            var extractResponse = new ExtractResponse(body);
                            resolve(extractResponse);
                        }
                    });
                }
            )*/
        }

    
    //=============================================================================
    // Train Dialogs
    //=============================================================================
    
        /** Create a new TrainDialog */
        public AddTrainDialog(appId : string, trainDialog : TrainDialog) : Promise<TrainResponse>
        {
            let apiPath = `app/${appId}/traindialog`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: trainDialog,
                        json: true
                    }
                    BlisDebug.LogRequest("POST",apiPath, requestData);
                    Request.post(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let editResponse = new TrainResponse(body);
                            resolve(editResponse);
                        }
                    });
                }
            )
        }

        /** Updates a trainDialog, overwriting the content of its dialog */
        public EditTrainDialog(appId : string, trainDialog : TrainDialog) : Promise<TrainResponse>
        { 
            let apiPath = `app/${appId}/traindialog/${trainDialog.trainDialogId}`;

            // Clear old one from cache
            this.entityCache.del(trainDialog.trainDialogId);

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: trainDialog,
                        json: true
                    }

                    BlisDebug.LogRequest("PUT",apiPath, requestData);
                    Request.put(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let editResponse = new TrainResponse(body);
                            resolve(editResponse);
                        }
                    });
                }
            )
        }

        /** Retrieves information about a specific trainDialog in the current package 
         * (or the specified package, if provided) */
        public GetTrainDialog(appId : string, trainDialogId : string) : Promise<TrainDialog>
        {
                return new Promise(
                (resolve, reject) => {

                let apiPath = `app/${appId}/traindialog/${trainDialogId}`;
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let trainDialog = new TrainDialog(body);
                            trainDialog.trainDialogId = trainDialogId;
                            resolve(trainDialog);
                        }
                    });
                }
            )
        }

        /** Retrieves the contents of many/all train dialogs.  
         * To retrieve just a list of IDs of all trainDialogs, 
         * see the GetTrainDialogIds method */
        public GetTrainDialogs(appId : string, query : string) : Promise<TrainDialogList>
        {
            let apiPath = `app/${appId}/traindialogs`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let trainDialogList = new TrainDialogList(body);
                            resolve(trainDialogList);
                        }
                    });
                }
            )
        }

        /** Retrieves a list of trainDialog IDs. 
         * To retrieve the contents of multiple trainDialogs, 
         * see the GetTrainDialogs method */
        public GetTrainDialogIds(appId : string, query : string) : Promise<TrainDialogIdList>
        {
            let apiPath = `app/${appId}/traindialog`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let trainDialogsIds = new TrainDialogIdList(body);
                            resolve(trainDialogsIds);
                        }
                    });
                }
            )
        }

        /** Deletes a TrainDialog */
        public DeleteTrainDialog(appId : string, trainDialogId : string) : Promise<TrainResponse>
        {
            let apiPath = `app/${appId}/traindialog/${trainDialogId}`;

            return new Promise(
                (resolve, reject) => {
                    let url = this.MakeURL(apiPath);
                    const requestData = {
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("DELETE",apiPath, requestData);
                    Request.delete(url, requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let deleteResponse = new TrainResponse(body);
                            resolve(deleteResponse);
                        }
                    });
                }
            )
        }

        /** Runs entity extraction (prediction). */
        public TrainDialogExtract(appId : string, trainDialogId : string, turnIndex: string, userInput : UserInput) : Promise<ExtractResponse>
        {
            // TEMP - until supported by server
            return new Promise((resolve, reject) => {
                let extractResponse = new ExtractResponse({
                    text : userInput.text,
                    predictedEntities : []
                });
                resolve(extractResponse);
            });

            /*
            let apiPath = `app/${appId}/traindialog/${trainDialogId}/extractor/${turnIndex}`;

            // Always retrieve entity list
            let query = "includeDefinitions=true";
            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: userInput,
                        json: true
                    }

                    BlisDebug.LogRequest("PUT",apiPath, requestData);
                    Request.put(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            var extractResponse = new ExtractResponse(body);
                            resolve(extractResponse);
                        }
                    });
                }
            )*/
        }

    //=============================================================================
    // Session
    //=============================================================================

        /** Creates a new session and a corresponding logDialog */
        public StartSession(appId : string) : Promise<Session>
        {
            let apiPath = `app/${appId}/session`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: {},
                        json: true
                    }

                    BlisDebug.LogRequest("POST",apiPath, requestData);
                    Request.post(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let session = new Session(body);
                            resolve(session);
                        }
                    });
                }
            )
        }

        /** Retrieves information about the specified session */
        public GetSession(appId : string, sessionId : string) : Promise<Session>
        {
                return new Promise(
                (resolve, reject) => {

                let apiPath = `app/${appId}/session/${sessionId}`;
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let session = new Session(body);
                            session.sessionId = sessionId;
                            resolve(session);
                        }
                    });
                }
            )
        }

         /** Runs entity extraction (prediction). */
        public SessionExtract(appId : string, sessionId : string, userInput : UserInput) : Promise<ExtractResponse>
        {
            let apiPath = `app/${appId}/session/${sessionId}/extractor`;

            // Always retrieve entity list
            let query = "includeDefinitions=true";
            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: userInput,
                        json: true
                    }

                    BlisDebug.LogRequest("PUT",apiPath, requestData);
                    Request.put(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            var extractResponse = new ExtractResponse(body);
                            resolve(extractResponse);
                        }
                    });
                }
            )
        }

        /** Take a turn and returns chosen action */
        public SessionScore(appId : string, sessionId : string, scorerInput : ScoreInput) : Promise<ScoreResponse>
        {
            let apiPath = `app/${appId}/session/${sessionId}/scorer`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: scorerInput,
                        json: true
                    }

                    BlisDebug.LogRequest("PUT",apiPath, requestData);
                    Request.put(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            var score = new ScoreResponse(body);
                            resolve(score);
                        }
                    });
                }
            )
        }

        /** End a session. */
        public EndSession(appId : string, sessionId : string, query : string) : Promise<string>
        {
            let apiPath = `app/${appId}/session/${sessionId}`;

            return new Promise(
                (resolve, reject) => {
                    let url = this.MakeURL(apiPath, query);
                    const requestData = {
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("DELETE",apiPath, requestData);
                    Request.delete(url, requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            resolve(body);
                        }
                    });
                }
            )
        }

        /** Retrieves definitions of ALL open sessions 
         * To retrieve just the IDs, see the GetSessionIds method */
        public GetSessions(appId : string, query : string) : Promise<SessionList>
        {
            let apiPath = `app/${appId}/sessions`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let sessions = new SessionList(body);
                            resolve(sessions);
                        }
                    });
                }
            )
        }

        /** Retrieves a list of session IDs 
         * To retrieve the definitions, see the GetSessions method */
        public GetSessionIds(appId : string, query : string) : Promise<SessionIdList>
        {
            let apiPath = `app/${appId}/session`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath,query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let sessionIds = new SessionIdList(body);
                            resolve(sessionIds);
                        }
                    });
                }
            )
        }

    //=============================================================================
    // Teach
    //=============================================================================
        
        /** Creates a new teaching session and a corresponding trainDialog */
        public StartTeach(appId : string) : Promise<TeachResponse>
        {
            let apiPath = `app/${appId}/teach`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: {},
                        json: true
                    }

                    BlisDebug.LogRequest("POST",apiPath, requestData);
                    Request.post(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            var teachResponse = new TeachResponse(body);
                            resolve(teachResponse);
                        }
                    });
                }
            )
        }

        /** Retrieves information about the specified teach */
        public GetTeach(appId : string, teachId : string) : Promise<Teach>
        {
                return new Promise(
                (resolve, reject) => {

                let apiPath = `app/${appId}/teach/${teachId}`;
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let teach = new Teach(body);
                            teach.teachId = teachId;
                            resolve(teach);
                        }
                    });
                }
            )
        }

        /** Runs entity extraction (prediction). 
         * If a more recent version of the package is available on 
         * the server, the session will first migrate to that newer version.  This 
         * doesn't affect the trainDialog maintained.
         */
        public TeachExtract(appId : string, teachId : string, userInput : UserInput) : Promise<ExtractResponse>
        {
            let apiPath = `app/${appId}/teach/${teachId}/extractor`;

            // Always retrieve entity list
            let query = "includeDefinitions=true";
            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: { text : userInput.text },
                        json: true
                    }

                    BlisDebug.LogRequest("PUT",apiPath, requestData);
                    Request.put(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            var extractResponse = new ExtractResponse(body);
                            resolve(extractResponse);
                        }
                    });
                }
            )
        }

        /** Uploads a labeled entity extraction instance
         * ie "commits" an entity extraction label, appending it to the teach session's
         * trainDialog, and advancing the dialog. This may yield produce a new package.
         */
        public TeachExtractFeedback(appId : string, teachId : string, extractorStep : TrainExtractorStep) : Promise<TeachResponse>
        {
            let apiPath = `app/${appId}/teach/${teachId}/extractor`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: extractorStep,
                        json: true
                    }

                    BlisDebug.LogRequest("POST",apiPath, requestData);
                    Request.post(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            var teachResponse = new TeachResponse(body);
                            resolve(teachResponse);
                        }
                    });
                }
            )
        }

        /** Takes a turn and return distribution over actions.
         * If a more recent version of the package is 
         * available on the server, the session will first migrate to that newer version.  
         * This doesn't affect the trainDialog maintained by the teaching session.
         */
        public TeachScore(appId : string, teachId : string, scorerInput : ScoreInput) : Promise<ScoreResponse>
        {
            let apiPath = `app/${appId}/teach/${teachId}/scorer`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: scorerInput,
                        json: true
                    }

                    BlisDebug.LogRequest("PUT",apiPath, requestData);
                    Request.put(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            var scoreResponse = new ScoreResponse(body);
                            resolve(scoreResponse);
                        }
                    });
                }
            )
        }

        /** Uploads a labeled scorer step instance 
         * – ie "commits" a scorer label, appending it to the teach session's 
         * trainDialog, and advancing the dialog. This may yield produce a new package.
         */
        public TeachScoreFeedback(appId : string, teachId : string, scorerResponse : TrainScorerStep) : Promise<TeachResponse>
        {
            let apiPath = `app/${appId}/teach/${teachId}/scorer`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        body: scorerResponse,
                        json: true
                    }

                    BlisDebug.LogRequest("POST",apiPath, requestData);
                    Request.post(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            var teachResponse = new TeachResponse(body);
                            resolve(teachResponse);
                        }
                    });
                }
            )
        }

        /** Ends a teach.   
         * For Teach sessions, does NOT delete the associated trainDialog.
         * To delete the associated trainDialog, call DELETE on the trainDialog.
         */
        public EndTeach(appId : string, teachId : string, query : string) : Promise<TrainResponse>
        {
            let apiPath = `app/${appId}/teach/${teachId}`;

            return new Promise(
                (resolve, reject) => {
                    let url = this.MakeURL(apiPath, query);
                    const requestData = {
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("DELETE",apiPath, requestData);
                    Request.delete(url, requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            var trainResponse = new TrainResponse(body);
                            resolve(trainResponse);
                        }
                    });
                }
            )
        }

        /** Retrieves definitions of ALL teaching sessions 
         * To retrieve just the IDs, see the GetTeachIds method */
        public GetTeaches(appId : string, query : string) : Promise<TeachList>
        {
            let apiPath = `app/${appId}/teaches`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath, query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let teaches = new TeachList(body);
                            resolve(teaches);
                        }
                    });
                }
            )
        }

        /** Retrieves a list of teach session IDs 
         * To retrieve the definitions, see the GetTeaches method */
        public GetTeachIds(appId : string, query : string) : Promise<TeachIdList>
        {
            let apiPath = `app/${appId}/teach`;

            return new Promise(
                (resolve, reject) => {
                const requestData = {
                        url: this.MakeURL(apiPath,query),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                    BlisDebug.LogRequest("GET",apiPath, requestData);
                    Request.get(requestData, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode >= 300) {
                            reject(response);
                        }
                        else {
                            let teachIds = new TeachIdList(body);
                            resolve(teachIds);
                        }
                    });
                }
            )
        }
}

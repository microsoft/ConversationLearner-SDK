const request = require('request');
import { deserialize, serialize } from 'json-typescript-mapper';
import { Credentials } from './Http/Credentials';
import { Action, ActionMetaData, ActionList, ActionIdList, Action_v1, ActionMetaData_v1 } from './Model/Action'
import { Dialog_v1, TrainDialog_v1 } from './Model/TrainDialog'
import { BlisApp_v1, BlisApp, BlisAppList } from './Model/BlisApp'
import { BlisAppContent } from './Model/BlisAppContent'
import { Entity, EntityMetaData, EntityList, EntityIdList, Entity_v1, EntityMetaData_v1 } from './Model/Entity'
import { TakeTurnModes, ActionTypes_v1, APICalls } from './Model/Consts';
import { TakeTurnResponse } from './Model/TakeTurnResponse'
import { TakeTurnRequest } from './Model/TakeTurnRequest'
import { BlisMemory } from './BlisMemory';
import { BlisDebug } from './BlisDebug';
import * as NodeCache from 'node-cache';

export class BlisClient {

    public static client : BlisClient;

    // Create singleton
    public static Init(serviceUri : string, user : string, secret : string, azureFunctionsUrl : string, azureFunctionsKey : string)
    {
        this.client = new BlisClient(serviceUri, user, secret, azureFunctionsUrl, azureFunctionsKey);
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
            BlisDebug.Log("service URI is required");
        } 
        this.serviceUri = serviceUri;
        this.credentials = new Credentials(user, secret);
        this.azureFunctionsUrl = azureFunctionsUrl;
        this.azureFunctionsKey = azureFunctionsKey;
    }

    private MakeURL(apiPath : string) 
    {
        return this.serviceUri + apiPath + `?userId=${this.user}`;
    }
    public ClearExportCache(appId : string) : void
    {
        this.exportCache.del(appId);
    }

    public AddAction(appId : string, action : Action) : Promise<string>
    {
        let apiPath = `app/${appId}/action`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.MakeURL(apiPath),
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    body: serialize(action),
                    json: true
                }
                BlisDebug.LogRequest("POST",apiPath, requestData);
                request.post(requestData, (error, response, body) => {
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

    public AddApp(blisApp : BlisApp) : Promise<string>
    {
        var apiPath = `app`;


        return new Promise(
            (resolve, reject) => {
                const requestData = {
                    url: this.MakeURL(apiPath),
                    headers: {
                        'Cookie' : this.credentials.Cookiestring(),
                    },
                    body: serialize(blisApp),
                    json: true
                }
                BlisDebug.LogRequest("POST",apiPath, requestData);
                request.post(requestData, (error, response, body) => {
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

    public AddEntity(appId : string, entity : Entity) : Promise<string>
    {
        let apiPath = `app/${appId}/entity`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.MakeURL(apiPath),
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    body: serialize(entity),
                    json: true
                }
                BlisDebug.LogRequest("POST",apiPath, requestData);
                request.post(requestData, (error, response, body) => {
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
                request.delete(url, requestData, (error, response, body) => {
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

    public DeleteApp(appId : string) : Promise<string>
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
                request.delete(url, requestData, (error, response, body) => {
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
                request.delete(url, requestData, (error, response, body) => {
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

    public EditAction(appId : string, action : Action) : Promise<string>
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
                    body: serialize(action),
                    json: true
                }

                BlisDebug.LogRequest("PUT",apiPath, requestData);
                request.put(requestData, (error, response, body) => {
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

    public EditEntity(appId : string, entity : Entity) : Promise<string>
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
                    body: serialize(entity),
                    json: true
                }

                BlisDebug.LogRequest("PUT",apiPath, requestData);
                request.put(requestData, (error, response, body) => {
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

    public GetAction(appId : string, actionId : string) : Promise<Action>
    {
        return new Promise(
            (resolve, reject) => {
                // Check cache first
                let action = this.actionCache.get(actionId);
                if (action) {
                    resolve(action);
                    return;
                }

                // Call API
                let apiPath = `app/${appId}/action/${actionId}`;
                const requestData = {
                        url: this.MakeURL(apiPath),
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(response);
                    }
                    else {
                        var action = deserialize(Action, body);
                        action.actionId = actionId;
                        this.actionCache.set(actionId, action);
                        resolve(action);
                    }
                });
            }
        )
    }

    public GetActions(appId : string) : Promise<ActionList>
    {
        let apiPath = `app/${appId}/actions`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.MakeURL(apiPath),
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(response);
                    }
                    else {
                        let actions = deserialize(ActionList, body);
                        resolve(actions);
                    }
                });
            }
        )
    }

    public GetActionIds(appId : string) : Promise<ActionList>
    {
        let apiPath = `app/${appId}/action`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.MakeURL(apiPath),
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(response);
                    }
                    else {
                        let actions = deserialize(ActionIdList, body);
                        resolve(actions);
                    }
                });
            }
        )
    }

    public GetApp(appId : string) : Promise<BlisApp> 
    {
        let apiPath = `app/${appId}?userId=${this.user}`;

        return new Promise(
            (resolve, reject) => {
                let url = this.MakeURL(apiPath);
                const requestData = {
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(url, requestData, (error, response, body) => {
                    if (error) {
                         reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(response);
                    }
                    else {
                        var blisApp = deserialize(BlisApp, body);
                        blisApp.appId = appId;
                        resolve(blisApp);
                    }
                });
            }
        )
    }

    public GetApps() : Promise<BlisAppList>
    {
        let apiPath = `apps`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.MakeURL(apiPath),
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }

                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(response);
                    }
                    else {
                        let apps = deserialize(BlisAppList, body);
                        resolve(apps);
                    }
                });
            }
        )
    }

    public GetEntity(appId : string, entityId : string) : Promise<Entity>
    {
            return new Promise(
            (resolve, reject) => {
                // Check cache first
                let entity = this.entityCache.get(entityId);
                if (entity) {
                    resolve(entity);
                    return;
                }

               let apiPath = `app/${appId}/entity/${entityId}`;
               const requestData = {
                    url: this.MakeURL(apiPath),
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(response);
                    }
                    else {
                        let entity = deserialize(Entity, body);
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

    public GetEntities(appId : string) : Promise<EntityList>
    {
        let apiPath = `app/${appId}/entities`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.MakeURL(apiPath),
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(response);
                    }
                    else {
                        let entities = deserialize(EntityList, body);
                        resolve(entities);
                    }
                });
            }
        )
    }

    public GetEntityIds(appId : string) : Promise<EntityList>
    {
        let apiPath = `app/${appId}/entity`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.MakeURL(apiPath),
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(response);
                    }
                    else {
                        let entityIds = deserialize(EntityIdList, body);
                        resolve(entityIds);
                    }
                });
            }
        )
    }
}

export class BlisClient_v1 {

    public static client : BlisClient_v1;

    // Create singleton
    public static Init(serviceUri : string, user : string, secret : string, azureFunctionsUrl : string, azureFunctionsKey : string)
    {
        this.client = new BlisClient_v1(serviceUri, user, secret, azureFunctionsUrl, azureFunctionsKey);
    }

    private serviceUri : string;
    private credentials : Credentials;
    public azureFunctionsUrl : string;
    public azureFunctionsKey: string;

    private actionCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
    private entityCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
    private exportCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

    private constructor(serviceUri : string, user : string, secret : string, azureFunctionsUrl : string, azureFunctionsKey : string)
    { 
        if (!serviceUri) 
        {
            BlisDebug.Log("service URI is required");
        } 
        this.serviceUri = serviceUri;
        this.credentials = new Credentials(user, secret);
        this.azureFunctionsUrl = azureFunctionsUrl;
        this.azureFunctionsKey = azureFunctionsKey;
    }

    public ClearExportCache(appId : string) : void
    {
        this.exportCache.del(appId);
    }

    public AddEntity_v1(appId : string, entityName : string, entityType : string, prebuiltEntityName : string, metaData : EntityMetaData_v1) : Promise<string>
    {
        let apiPath = `app/${appId}/entity`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    body: {
                        name: entityName,
                        EntityType: entityType,
                        LUISPreName: prebuiltEntityName,
                        metadata : metaData
                    },
                    json: true
                }
                BlisDebug.LogRequest("POST",apiPath, requestData);
                request.post(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public CreateApp_v1(name : string, luisKey : string) : Promise<string>
    {
        var apiPath = "app";

        return new Promise(
            (resolve, reject) => {
                const requestData = {
                    url: this.serviceUri + apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring(),
                    },
                    body: {
                        name: name,
                        LuisAuthKey: luisKey
                    },
                    json: true
                }
                BlisDebug.LogRequest("POST",apiPath, requestData);
                request.post(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        var appId = body.id;
                        resolve(appId);
                    }
                });
            }
        )
    }

    public DeleteAction(appId : string, actionId : string) : Promise<string>
    {
        let apiPath = `app/${appId}/action/${actionId}`;

        return new Promise(
            (resolve, reject) => {
                let url = this.serviceUri+apiPath;
                const requestData = {
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    }
                }
                BlisDebug.LogRequest("DELETE",apiPath, requestData);
                request.delete(url, requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(JSON.parse(body).message);
                    }
                    else {
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public DeleteApp(activeAppId : string, appId : string) : Promise<string>
    {
        // If not appId sent use active app
        let activeApp = false;
        if (appId == activeAppId) {
            activeApp = true;
        }

        let apiPath = `app/${appId}`;

        return new Promise(
            (resolve, reject) => {
                let url = this.serviceUri+apiPath;
                const requestData = {
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    }
                }
                BlisDebug.LogRequest("DELETE",apiPath, requestData);
                request.delete(url, requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public DeleteEntity(appId : string, entityId : string) : Promise<string>
    {
        let apiPath = `app/${appId}/entity/${entityId}`;

        return new Promise(
            (resolve, reject) => {
                let url = this.serviceUri+apiPath;
                const requestData = {
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    }
                }
                BlisDebug.LogRequest("DELETE",apiPath, requestData);
                request.delete(url, requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(JSON.parse(body).message);
                    }
                    else {
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public DeleteTrainDialog(appId : string, dialogId : string) : Promise<string>
    {
        let apiPath = `app/${appId}/traindialog/${dialogId}`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }
                BlisDebug.LogRequest("DELETE",apiPath, requestData);
                request.delete(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        resolve(body);
                    }
                });
            }
        )
    }

    public EditAction_v1(appId : string, actionId : string, content : string, actionType : string, sequenceTerminal : boolean, requiredEntityList : string[] = [], negativeEntityList : string[] = [], prebuiltEntityName : string = null) : Promise<string>
    {
        let apiPath = `app/${appId}/action/${actionId}`;

       // Clear old one from cache
        this.actionCache.del(actionId);

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    body: {
                        content: content,
                        RequiredEntities: requiredEntityList,
                        NegativeEntities: negativeEntityList,
                        //action_type: actionType
                        sequence_terminal: sequenceTerminal,
                        //metadata: metaData
                    },
                    json: true
                }

                BlisDebug.LogRequest("PUT",apiPath, requestData);
                request.put(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        // Service returns a 204
                        resolve(body);
                    }
                });
            }
        )
    }

    public EditEntity_v1(appId : string, entityId: string, entityName : string, entityType : string, prebuiltEntityName : string, metaData : EntityMetaData_v1) : Promise<string>
    { 
        let apiPath = `app/${appId}/entity/${entityId}`;

        // Clear old one from cache
        this.entityCache.del(entityId);

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    body: {
                        name: entityName,
                  //    EntityType: entityType,   Immutable
                  //    LUISPreName: prebuiltEntityName,   Immutable
                        metadata: metaData
                    },
                    json: true
                }

                BlisDebug.LogRequest("PUT",apiPath, requestData);
                request.put(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        resolve(body);
                    }
                });
            }
        )
    }

    public EndSession(appId : string, sessionId : string) : Promise<string>
    {
        BlisDebug.Log(`Deleting existing session ${sessionId}`);
        let apiPath = `app/${appId}/session2/${sessionId}`;

        return new Promise(
            (resolve, reject) => {
                
                if (!sessionId)
                {
                    resolve("No Session");
                    return;
                }
                let url = this.serviceUri+apiPath;
                const requestData = {
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    }
                }
                BlisDebug.LogRequest("DELETE",apiPath, requestData);
                request.delete(url, requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(JSON.parse(body).message);
                    }
                    else {
                        resolve(body);
                    }
                });
            }
        )
    }

    public EditTrainDialog(appId : string, dialogId : string, trainDialog : TrainDialog_v1) : Promise<string>
    {
        let apiPath = `app/${appId}/traindialog/${dialogId}`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    body: serialize(trainDialog.dialog),
                    json: true
                }
                BlisDebug.LogRequest("PUT",apiPath, requestData);
                request.put(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        resolve(body);
                    }
                });
            }
        )
    }

    public ExportApp(appId : string) : Promise<BlisAppContent>
    {
        let apiPath = `app/${appId}/source`;

        return new Promise(
            (resolve, reject) => {

                // Check cache first
                let blisAppContent = this.exportCache.get(appId);
                if (blisAppContent) {
                    resolve(blisAppContent);
                    return;
                }
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        let blisAppContent = deserialize(BlisAppContent, body);
                        this.exportCache.set(appId, blisAppContent);
                        resolve(blisAppContent);
                    }
                });
            }
        )
    }

    public GetApp_v1(appId : string) : Promise<BlisApp_v1>
    {
        let apiPath = `app/${appId}`;

        return new Promise(
            (resolve, reject) => {
                let url = this.serviceUri+apiPath;
                const requestData = {
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(url, requestData, (error, response, body) => {
                    if (error) {
                         reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        var blisApp = deserialize(BlisApp_v1, body);
                        blisApp.id = appId;
                        resolve(blisApp);
                    }
                });
            }
        )
    }

    public GetAction_v1(appId : string, actionId : string) : Promise<Action_v1>
    {
        return new Promise(
            (resolve, reject) => {
                // Check cache first
                let action = this.actionCache.get(actionId);
                if (action) {
                    resolve(action);
                    return;
                }

                // Call API
                let apiPath = `app/${appId}/action/${actionId}`;
                const requestData = {
                        url: this.serviceUri+apiPath,
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        var action = deserialize(Action_v1, body);
                        action.id = actionId;
                        this.actionCache.set(actionId, action);
                        resolve(action);
                    }
                });
            }
        )
    }

    public GetActions_v1(appId : string, ) : Promise<string>
    {
        let apiPath = `app/${appId}/action`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    }
                }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(JSON.parse(body).message);
                    }
                    else {
                        resolve(body);
                    }
                });
            }
        )
    }

    public GetApps() : Promise<string>
    {
        let apiPath = `apps`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    }
                }

                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(JSON.parse(body).message);
                    }
                    else {
                        resolve(body);
                    }
                });
            }
        )
    }

    public GetEntity_v1(appId : string, entityId : string) : Promise<Entity_v1>
    {
        return new Promise(
            (resolve, reject) => {
                // Check cache first
                let entity = this.entityCache.get(entityId);
                if (entity) {
                    resolve(entity);
                    return;
                }

               let apiPath = `app/${appId}/entity/${entityId}`;
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        var entity = deserialize(Entity_v1, body);
                        entity.id = entityId;
                        if (!entity.metadata)
                        {
                            entity.metadata = new EntityMetaData_v1();
                        }
                        this.entityCache.set(entityId, entity);
                        resolve(entity);
                    }
                });
            }
        )
    }

    public GetEntities(appId : string) : Promise<string>
    {
        let apiPath = `app/${appId}/entity`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    }
                }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(JSON.parse(body).message);
                    }
                    else {
                        resolve(body);
                    }
                });
            }
        )
    }

    public GetModel(appId : string) : Promise<string>
    {  
        let apiPath = `app/${appId}/model`;
        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        let modelId = body.ids[0];
                        resolve(modelId);
                    }
                });
            }
        )
    }

    public GetTrainDialog(appId : string, dialogId : string) : Promise<TrainDialog_v1>
    {
        let apiPath = `app/${appId}/traindialog/${dialogId}`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        let dialog = deserialize(Dialog_v1, body);
                        let trainDialog = new TrainDialog_v1({dialog: dialog, id: dialogId});
                        resolve(trainDialog);
                    }
                });
            }
        )
    }

    public GetTrainDialogs(appId : string) : Promise<string>
    {
        let apiPath = `app/${appId}/traindialog`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    }
                }
                BlisDebug.LogRequest("GET",apiPath, requestData);
                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(JSON.parse(body).message);
                    }
                    else {
                        resolve(body);
                    }
                });
            }
        )
    }

    public ImportApp(appId : string, blisAppContent : BlisAppContent) : Promise<BlisAppContent>
    { 
        let apiPath = `app/${appId}/source`;
        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true,
                    body: serialize(blisAppContent)   
                }
                BlisDebug.LogRequest("POST",apiPath, requestData);
                request.post(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        var blisAppContent = deserialize(BlisAppContent, body);
                        resolve(blisAppContent);
                    }
                });
            }
        )
    }

    public Retrain(appId : string, sessionId : string) : Promise<TakeTurnResponse>
    {
        let apiPath = `app/${appId}/session2/${sessionId}/retrain`;
        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }
                BlisDebug.LogRequest("PUT",apiPath, requestData);
                request.put(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        if (typeof body === "string") {
                            body = JSON.parse(body);
                        }
                        var ttresponse = deserialize(TakeTurnResponse, body);
                        resolve(ttresponse);
                    }
                });
            }
        )
    }

    public StartSession(appId : string, inTeach = false, saveDialog = !inTeach) : Promise<string>
    {
        let apiPath = `app/${appId}/session2`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    body: {
                        Teach: inTeach,
                        Save_To_Log: saveDialog
                        // Note: Never need to send modelId as will use the latest
                    },
                    json: true
                }
                BlisDebug.LogRequest("POST",apiPath, requestData);
                request.post(requestData, (error, response, body) => {
                    if (error) {
                        reject(error.message);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        let sessionId = body.id;                      
                        resolve(sessionId);
                    }
                });
            }
        )
    }

    // TODO:  decice what to do with fromScratch
    public TrainModel(appId : string, fromScratch : boolean = false) : Promise<string>
    {
        let apiPath = `app/${appId}/model`;
        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    body: {
                        from_scratch : fromScratch
                    },
                    json: true
                }
                BlisDebug.LogRequest("POST",apiPath, requestData);
                request.post(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        let modelId = body.id;
                        resolve(modelId);
                    }
                });
            }
        )
    }

    public SendTurnRequest(appId :string, sessionId : string, body : {}) : Promise<TakeTurnResponse>
    {
        let apiPath = `app/${appId}/session2/${sessionId}`;
        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }
                requestData['body'] = body;

                BlisDebug.LogRequest("PUT",apiPath, requestData);
                request.put(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(`${response.statusMessage} : ${body}`);
                    }
                    else {
                        if (typeof body === "string") {
                           reject("Service returned invalid JSON\n\n" + body);
                        }
                        var ttresponse = deserialize(TakeTurnResponse, body);
                        resolve(ttresponse);
                    }
                });
            }
        )
    }
}

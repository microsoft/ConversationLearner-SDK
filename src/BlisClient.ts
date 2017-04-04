const request = require('request');
import { deserialize, serialize } from 'json-typescript-mapper';
import { Credentials } from './Http/Credentials';
import { LuisEntity } from './Model/LuisEntity';
import { Action } from './Model/Action'
import { BlisApp } from './Model/BlisApp'
import { Entity } from './Model/Entity'
import { TakeTurnModes, ActionTypes, UserStates, APICalls } from './Model/Consts';
import { TakeTurnResponse } from './Model/TakeTurnResponse'
import { TakeTurnRequest } from './Model/TakeTurnRequest'
import { BlisUserState } from './BlisUserState';
import { BlisMemory } from './BlisMemory';
import { BlisDebug } from './BlisDebug';
import * as NodeCache from 'node-cache';

export class BlisClient {

    private serviceUri : string;
    private credentials : Credentials;

    private actionCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
    private entityCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

    constructor(serviceUri : string, user : string, secret : string)
    {
        if (!serviceUri) 
        {
            BlisDebug.Log("service URI is required");
        } 
        this.serviceUri = serviceUri;
        this.credentials = new Credentials(user, secret);
    }

    // TODO: switch remaining to not userstate
    public AddAction(appId : string, content : string, actionType : string, requiredEntityList : string[] = [], negativeEntityList : string[] = [], prebuiltEntityName : string = null) : Promise<string>
    {
        let apiPath = `app/${appId}/action`;

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
                        action_type: actionType
                    },
                    json: true
                }

                request.post(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
                    }
                    else {
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public AddEntity(appId : string, entityName : string, entityType : string, prebuiltEntityName : string) : Promise<string>
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
                        LUISPreName: prebuiltEntityName
                    },
                    json: true
                }

                request.post(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
                    }
                    else {
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public CreateApp(name : string, luisKey : string) : Promise<string>
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
            
                request.post(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
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

    public DeleteApp(userState : BlisUserState, appId : string) : Promise<string>
    {
        // If not appId sent use active app
        let activeApp = false;
        if (appId == userState[UserStates.APP]) {
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
                request.delete(url, requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
                    }
                    else {
                        // Did I delete my active app?
                        if (activeApp)
                        {
                            userState[UserStates.APP] = null;
                            userState[UserStates.MODEL] = null;
                            userState[UserStates.SESSION] = null;
                        }
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

                request.delete(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
                    }
                    else {
                        resolve(body);
                    }
                });
            }
        )
    }

    public EditAction(appId : string, actionId : string, content : string, actionType : string, requiredEntityList : string[] = [], negativeEntityList : string[] = [], prebuiltEntityName : string = null) : Promise<string>
    {
        let apiPath = `app/${appId}/action/${actionId}`;

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
                    },
                    json: true
                }

                request.put(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
                    }
                    else {
                        // Service returns a 204
                        resolve(body);
                    }
                });
            }
        )
    }

    public EditEntity(appId : string, entityId: string, entityName : string, entityType : string, prebuiltEntityName : string) : Promise<string>
    { 
        let apiPath = `app/${appId}/entity/${entityId}`;

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
                        EntityType: entityType,
                        LUISPreName: prebuiltEntityName
                    },
                    json: true
                }

                request.put(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
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

    public ExportApp(appId : string) : Promise<BlisApp>
    {
        let apiPath = `app/${appId}/source`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }

                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
                    }
                    else {
                        var blisApp = deserialize(BlisApp, body);
                        resolve(blisApp);
                    }
                });
            }
        )
    }

    public GetApp(appId : string) : Promise<string>
    {
        let apiPath = `app/${appId}`;

        return new Promise(
            (resolve, reject) => {
                let url = this.serviceUri+apiPath;
                const requestData = {
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    }
                }
                request.get(url, requestData, (error, response, body) => {
                    let payload = JSON.parse(body);
                    if (error) {
                         reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(payload.message);
                    }
                    else {
                        resolve(payload);
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
                        url: this.serviceUri+apiPath,
                        headers: {
                            'Cookie' : this.credentials.Cookiestring()
                        },
                        json: true
                    }

                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
                    }
                    else {
                        var action = deserialize(Action, body);
                        this.actionCache.set(actionId, action);
                        resolve(action);
                    }
                });
            }
        )
    }

    public GetActions(appId : string, ) : Promise<string>
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
        let apiPath = `app`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    }
                }

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

                // Call API
               let apiPath = `app/${appId}/entity/${entityId}`;
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }

                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
                    }
                    else {
                        var entity = deserialize(Entity, body);
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

                request.get(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
                    }
                    else {
                        let modelId = body.ids[0];
                        resolve(modelId);
                    }
                });
            }
        )
    }

    public GetTrainDialog(appId : string, dialogId : string) : Promise<string>
    {
        let apiPath = `app/${appId}/traindialog/${dialogId}`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    }
                }

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

    public ImportApp(appId : string, blisApp : BlisApp) : Promise<BlisApp>
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
                    body: serialize(blisApp)   
                }

                request.post(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
                    }
                    else {
                        var blisApp = deserialize(BlisApp, body);
                        resolve(blisApp);
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

                request.put(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
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

    public StartSession(appId : string, inTeach = false, saveDialog = false) : Promise<string>
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
                request.post(requestData, (error, response, body) => {
                    if (error) {
                        reject(error.message);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
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
    public TrainModel(userState : BlisUserState, fromScratch : boolean = false) : Promise<string>
    {
        // Clear existing modelId TODO - depends on if fromScratch
        userState[UserStates.MODEL]  = null;
        
        let apiPath = `app/${userState[UserStates.APP]}/model`;
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

                request.post(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
                    }
                    else {
                        let modelId = body.id;
                        userState[UserStates.MODEL]  = modelId;
                        resolve(modelId);
                    }
                });
            }
        )
    }

    public SendTurnRequest(userState : BlisUserState, body : {}) : Promise<TakeTurnResponse>
    {
        let apiPath = `app/${userState[UserStates.APP]}/session2/${userState[UserStates.SESSION]}`;
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

                request.put(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
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
}

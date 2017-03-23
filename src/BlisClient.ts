const request = require('request');
import { deserialize } from 'json-typescript-mapper';
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

export class BlisClient {

    private serviceUri : string;
    private credentials : Credentials;

    constructor(serviceUri : string, user : string, secret : string)
    {
        if (!serviceUri) 
        {
            BlisDebug.Log("service URI is required");
        } 
        this.serviceUri = serviceUri;
        this.credentials = new Credentials(user, secret);
    }

    public AddAction(userState : BlisUserState, content : string, actionType : string, requiredEntityList : string[] = [], negativeEntityList : string[] = [], prebuiltEntityName : string = null) : Promise<string>
    {
        let apiPath = `app/${userState[UserStates.APP]}/action`;

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
                        reject(body.message);
                    }
                    else {
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public AddEntity(userState : BlisUserState, entityName : string, entityType : string, prebuiltEntityName : string) : Promise<string>
    {
        let apiPath = `app/${userState[UserStates.APP]}/entity`;

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
                        reject(body.message);
                    }
                    else {
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public CreateApp(userState : BlisUserState, name : string, luisKey : string) : Promise<string>
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
                        reject(body.message);
                    }
                    else {
                        var appId = body.id;
                        BlisUserState.InitState(appId, userState);
                        resolve(appId);
                    }
                });
            }
        )
    }

    public DeleteAction(userState : BlisUserState, actionId : string) : Promise<string>
    {
        let apiPath = `app/${userState[UserStates.APP]}/action/${actionId}`;

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

    public EndSession(userState : BlisUserState, ) : Promise<string>
    {
        BlisDebug.Log(`Deleting existing session ${userState[UserStates.SESSION]}`);
        let apiPath = `app/${userState[UserStates.APP]}/session2/${userState[UserStates.SESSION]}`;

        return new Promise(
            (resolve, reject) => {
                
                if (!userState[UserStates.SESSION])
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
                        new BlisMemory(userState).EndSession();
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public ExportApp(userState : BlisUserState) : Promise<BlisApp>
    {
        let apiPath = `app/${userState[UserStates.APP]}/source`;

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
                        reject(body.message);
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

    public GetAction(userState : BlisUserState, actionId : string) : Promise<Action>
    {
        let apiPath = `app/${userState[UserStates.APP]}/action/${actionId}`;

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
                        reject(JSON.parse(body).message);
                    }
                    else {
                        var action = deserialize(Action, body);
                        resolve(action);
                    }
                });
            }
        )
    }

    public GetActions(userState : BlisUserState, ) : Promise<string>
    {
        let apiPath = `app/${userState[UserStates.APP]}/action`;

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

    public GetEntity(userState : BlisUserState, entityId : string) : Promise<Entity>
    {
        let apiPath = `app/${userState[UserStates.APP]}/entity/${entityId}`;

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
                        reject(JSON.parse(body).message);
                    }
                    else {
                        var entity = deserialize(Entity, body);
                        resolve(entity);
                    }
                });
            }
        )
    }

    public GetEntities(userState : BlisUserState, ) : Promise<string>
    {
        let apiPath = `app/${userState[UserStates.APP]}/entity`;

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

    public GetModel(userState : BlisUserState) : Promise<string>
    {
        // Clear existing modelId
        userState[UserStates.MODEL]  = null;
        
        let apiPath = `app/${userState[UserStates.APP]}/model`;
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
                        reject(body.message);
                    }
                    else {
                        let modelId = body.ids[0];
                        userState[UserStates.MODEL]  = modelId;
                        resolve(modelId);
                    }
                });
            }
        )
    }

    public GetTrainDialog(userState : BlisUserState, dialogId : string) : Promise<string>
    {
        let apiPath = `app/${userState[UserStates.APP]}/traindialog/${dialogId}`;

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

    public GetTrainDialogs(userState : BlisUserState) : Promise<string>
    {
        let apiPath = `app/${userState[UserStates.APP]}/traindialog`;

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

    public ImportApp(userState : BlisUserState, blisApp : BlisApp) : Promise<BlisApp>
    { 
        let apiPath = `app/${userState[UserStates.APP]}/source`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true,
                    body: blisApp
                }

                request.post(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(JSON.parse(body).message);
                    }
                    else {
                        var blisApp = deserialize(BlisApp, body);
                        resolve(blisApp);
                    }
                });
            }
        )
    }

    public Retrain(userState : BlisUserState) : Promise<TakeTurnResponse>
    {
        let apiPath = `app/${userState[UserStates.APP]}/session2/${userState[UserStates.SESSION]}/retrain`;
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

    public StartSession(userState : BlisUserState, inTeach = false, saveDialog = false) : Promise<string>
    {
        let apiPath = `app/${userState[UserStates.APP]}/session2`;

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
                        reject(body.message);
                    }
                    else {
                        let sessionId = body.id;
                        new BlisMemory(userState).StartSession(sessionId, inTeach);                      
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
                        reject(JSON.parse(body).message);
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
                        reject(body.message);
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

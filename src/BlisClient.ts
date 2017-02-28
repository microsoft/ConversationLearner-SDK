const request = require('request');
import {deserialize} from 'json-typescript-mapper';
import { Credentials } from './Http/Credentials';
import { TrainDialogSNP } from './Model/TrainDialogSNP'; 
import { LuisEntity } from './Model/LuisEntity';
import { Action } from './Model/Action'
import { TakeTurnModes, ActionTypes, UserStates } from './Model/Consts';
import { TakeTurnResponse } from './Model/TakeTurnResponse'
import { TakeTurnRequest } from './Model/TakeTurnRequest'
import { BlisUserState } from './BlisUserState';
import { BlisMemory } from './BlisMemory';
import { BlisDebug } from './BlisDebug';

export class BlisClient {

    private serviceUri : string;
    private credentials : Credentials;
    
    // Optional callback than runs after LUIS but before BLIS.  Allows Bot to substitute entities
    private luisCallback? : (text: string, luisEntities : LuisEntity[], memory : BlisMemory) => TakeTurnRequest;

    // Mappting between API names and functions
    private apiCallbacks? : { string : () => TakeTurnRequest };

    constructor(serviceUri : string, user : string, secret : string,
        luisCallback : (text: string, luisEntities : LuisEntity[], memory : BlisMemory) => TakeTurnRequest,
        apiCallbacks : { string : () => TakeTurnRequest })
    {
        if (!serviceUri) 
        {
            BlisDebug.Log("service URI is required");
        } 
        this.serviceUri = serviceUri;
        this.credentials = new Credentials(user, secret);
        this.luisCallback = luisCallback,
        this.apiCallbacks = apiCallbacks
    }

    public AddAction(userState : BlisUserState, content : string, requiredEntityList : string[] = null, negativeEntityList : string[] = null, prebuiltEntityName : string = null) : Promise<string>
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
                        NegativeEntities: negativeEntityList
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

    public AddTrainDialog(userState : BlisUserState, traindialog : TrainDialogSNP) : Promise<string>
    {
        let apiPath = `app/${userState[UserStates.APP]}/traindialog`;
        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.Cookiestring()
                    },
                    json: true
                }
                requestData['body'] = traindialog;

                request.post(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(JSON.parse(body).message);
                    }
                    else {
                        let modelId = body.id;
                        userState[UserStates.MODEL] = modelId;
                        resolve(modelId);
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
                        userState[UserStates.APP] = appId;
                        userState[UserStates.SESSION] = null;
                        userState[UserStates.MODEL] = null;
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
                        userState[UserStates.SESSION] = null;
                        userState[UserStates.TEACH] = false;
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public GetApp(userState : BlisUserState, appId? : string) : Promise<string>
    {
        // If not appId sent use active app
        let activeApp = false;
        if (!appId) {
            appId = userState[UserStates.APP];
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
                request.get(url, requestData, (error, response, body) => {
                    let payload = JSON.parse(body);
                    if (error) {
                        if (activeApp) userState[UserStates.APP] = null;
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        if (activeApp) userState[UserStates.APP] = null;
                        reject(payload.message);
                    }
                    else {
                        resolve(payload);
                    }
                });
            }
        )
    }

    public GetAction(userState : BlisUserState, actionId : string) : Promise<string>
    {
        let apiPath = `app/${userState[UserStates.APP]}/action/${actionId}`;

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

    public GetEntity(userState : BlisUserState, entityId : string) : Promise<string>
    {
        let apiPath = `app/${userState[UserStates.APP]}/entity/${entityId}`;

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
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body.message);
                    }
                    else {
                        let sessionId = body.id;
                        userState[UserStates.SESSION]  = sessionId;
                        userState[UserStates.TEACH]  = inTeach;
                        userState[UserStates.MEMORY]  = {};
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

    private DefaultLUCallback(text: string, entities : LuisEntity[]) : TakeTurnRequest
    {
        return new TakeTurnRequest();  // TODO
    }

    public async TakeTurn(userState : BlisUserState, payload : string | TakeTurnRequest, cb: (response : TakeTurnResponse) => void) : Promise<void>
    {
        // Error checking
        if (userState[UserStates.APP]  == null)
        {
            let response = this.ErrorResponse("No Application has been loaded.\n\nTry _!createapp_, _!loadapp_ or _!help_ for more info.");
            cb(response);
            return;
        }
        else if (!userState[UserStates.MODEL]  && !userState[UserStates.TEACH] )
        {
            let response = this.ErrorResponse("This application needs to be trained first.\n\nTry _!teach, _!traindialogs_ or _!help_ for more info.");
            cb(response);
            return;
        }
        else if (!userState[UserStates.SESSION] )
        {
            let response = this.ErrorResponse("Start the bot first with _!start_ or train more with _!teach_.");
            cb(response);
            return;
        }

        let expectedNextModes;
        let requestBody : {};
        if (typeof payload == 'string') {
            expectedNextModes = [TakeTurnModes.CALLBACK, TakeTurnModes.ACTION, TakeTurnModes.TEACH];
            requestBody = { text : payload};
        }
        else {
            expectedNextModes = [TakeTurnModes.ACTION, TakeTurnModes.TEACH]
            requestBody = payload.ToJSON();
        }

        await this.SendTurnRequest(userState, requestBody)
        .then(async (takeTurnResponse) => {
            BlisDebug.LogObject(takeTurnResponse);

            // Check that expected mode matches
            if (!takeTurnResponse.mode || expectedNextModes.indexOf(takeTurnResponse.mode) < 0)
            {
                var response = new TakeTurnResponse({ mode : TakeTurnModes.ERROR, error: `Unexpected mode ${takeTurnResponse.mode}`} );
                cb(response);
            }

            // LUIS CALLBACK
            if (takeTurnResponse.mode == TakeTurnModes.CALLBACK)
            {
                let takeTurnRequest;
                let memory = new BlisMemory(userState);
                if (this.luisCallback)
                {
                    takeTurnRequest = this.luisCallback(takeTurnResponse.originalText, takeTurnResponse.entities, memory);
                }
                else
                {
                    takeTurnRequest = this.DefaultLUCallback(takeTurnResponse.originalText, takeTurnResponse.entities);
                }
                await this.TakeTurn(userState, takeTurnRequest, cb);
            }
            // TEACH
            else if (takeTurnResponse.mode == TakeTurnModes.TEACH)
            {
                cb(takeTurnResponse);
            }

            // ACTION
            else if (takeTurnResponse.mode == TakeTurnModes.ACTION)
            {
                if (takeTurnResponse.actions[0].actionType == ActionTypes.TEXT)
                {
                    cb(takeTurnResponse);
                }
                else if (takeTurnResponse.actions[0].actionType == ActionTypes.API)
                {
                    var apiName = takeTurnResponse.actions[0].content;
                    if (this.apiCallbacks && this.apiCallbacks[apiName])
                    {
                        let takeTurnRequest = this.apiCallbacks[apiName]();
                        expectedNextModes = [TakeTurnModes.ACTION, TakeTurnModes.TEACH];
                        await this.TakeTurn(userState, takeTurnRequest, cb);
                    }
                    else 
                    {
                        let response = this.ErrorResponse(`API ${apiName} not defined`);
                        cb(response);
                    }
                }
            }
        })
        .catch((text) => {
            var response = this.ErrorResponse(text);
            cb(response);
        });
    }

    private SendTurnRequest(userState : BlisUserState, body : {}) : Promise<TakeTurnResponse>
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
                        var ttresponse = deserialize(TakeTurnResponse, body);
                        resolve(ttresponse);
                    }
                });
            }
        )
    }
   
    private ErrorResponse(text : string) : TakeTurnResponse
    {
        return new TakeTurnResponse({ mode : TakeTurnModes.ERROR, error: text} );
    }
}

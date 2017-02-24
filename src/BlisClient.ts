const request = require('request');
import {deserialize} from 'json-typescript-mapper';
import { Credentials } from './Http/Credentials';
import { TrainDialog } from './Model/TrainDialog'; 
import { LuisEntity } from './Model/LuisEntity';
import { Action } from './Model/Action'
import { TakeTurnModes, ActionTypes } from './Model/Consts';
import { TakeTurnResponse } from './Model/TakeTurnResponse'
import { TakeTurnRequest } from './Model/TakeTurnRequest'
import { BlisDebug } from './BlisDebug';

export class BlisClientOptions {

    // Application Id
    appId : string;

    // Dialog session Id
    sessionId? : string;

    // Training model to use
    modelId? : string;

    // In teach Model
    inTeach? : boolean;

    // Optional callback than runs after LUIS but before BLIS.  Allows Bot to substitute entities
    luisCallback? : (text: string, luisEntities : LuisEntity[]) => TakeTurnRequest;

    // Mappting between API names and functions
    apiCallbacks? : { string : () => TakeTurnRequest };

    public constructor(init?:Partial<BlisClientOptions>)
    {
        (<any>Object).assign(this, init);
    }
}

export class BlisClient {

    private serviceUri : string;
    private credentials : Credentials;
    private options : BlisClientOptions = new BlisClientOptions();

    constructor(serviceUri : string, user : string, secret : string)
    {
        if (!serviceUri) 
        {
            BlisDebug.Log("service URI is required");
        } 
        this.serviceUri = serviceUri;

        this.credentials = new Credentials(user, secret);
    }

    public SetOptions(init?:Partial<BlisClientOptions>)
    {
        (<any>Object).assign(this.options, init);
    }

    public GetOption(key : string)
    {
        return this.options[key];
    }

    public AddAction(content : string, requiredEntityList : string[] = null, negativeEntityList : string[] = null, prebuiltEntityName : string = null) : Promise<string>
    {
        let apiPath = `app/${this.options.appId}/action`;

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
                        reject(JSON.parse(body).message);
                    }
                    else {
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public AddEntity(entityName : string, entityType : string, prebuiltEntityName : string) : Promise<string>
    {
        let apiPath = `app/${this.options.appId}/entity`;

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
                        reject(body.message);
                    }
                    else {
                        var appId = body.id;
                        this.options.appId = appId;
                        this.options.sessionId = null;
                        this.options.modelId = null;
                        resolve(appId);
                    }
                });
            }
        )
    }

    public DeleteAction(actionId : string) : Promise<string>
    {
        let apiPath = `app/${this.options.appId}/action/${actionId}`;

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

    public DeleteApp(appId : string) : Promise<string>
    {
        // If not appId sent use active app
        let activeApp = false;
        if (!appId) {
            appId = this.options.appId;
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
                            this.options.appId = null;
                            this.options.modelId = null;
                            this.options.sessionId = null;
                        }
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public EndSession() : Promise<string>
    {
        BlisDebug.Log(`Deleting existing session ${this.options.sessionId}`);
        let apiPath = `app/${this.options.appId}/session2/${this.options.sessionId}`;

        return new Promise(
            (resolve, reject) => {
                
                if (!this.options.sessionId)
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
                        this.options.sessionId = null;
                        this.options.inTeach = false;
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public GetApp(appId? : string) : Promise<string>
    {
        // If not appId sent use active app
        let activeApp = false;
        if (!appId) {
            appId = this.options.appId;
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
                        if (activeApp) this.options.appId = null;
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        if (activeApp) this.options.appId = null;
                        reject(payload.message);
                    }
                    else {
                        resolve(payload);
                    }
                });
            }
        )
    }

    public GetEntity(entityId : string) : Promise<string>
    {
        let apiPath = `app/${this.options.appId}/entity/${entityId}`;

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

    public GetEntities() : Promise<string>
    {
        let apiPath = `app/${this.options.appId}/entity`;

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

    public GetAction(actionId : string) : Promise<string>
    {
        let apiPath = `app/${this.options.appId}/action/${actionId}`;

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

    public GetActions() : Promise<string>
    {
        let apiPath = `app/${this.options.appId}/action`;

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

    public GetModel() : Promise<string>
    {
        // Clear existing modelId
        this.options.modelId = null;
        
        let apiPath = `app/${this.options.appId}/model`;
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
                        let modelId = body.ids[0];
                        this.options.modelId = modelId;
                        resolve(modelId);
                    }
                });
            }
        )
    }
    
    public StartSession(inTeach = false, saveDialog = false) : Promise<string>
    {
        let apiPath = `app/${this.options.appId}/session2`;

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
                        this.options.sessionId = sessionId;
                        this.options.inTeach = inTeach;
                        resolve(sessionId);
                    }
                });
            }
        )
    }

    public TrainDialog(traindialog : TrainDialog) : Promise<string>
    {
        let apiPath = `app/${this.options.appId}/traindialog`;
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
                        this.options.modelId = modelId;
                        resolve(modelId);
                    }
                });
            }
        )
    }

    // TODO:  decice what to do with fromScratch
    public TrainModel(fromScratch : boolean = false) : Promise<string>
    {
        // Clear existing modelId TODO - depends on if fromScratch
        this.options.modelId = null;
        
        let apiPath = `app/${this.options.appId}/model`;
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
                        this.options.modelId = modelId;
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

    public async TakeTurn(payload : string | TakeTurnRequest, cb: (response : TakeTurnResponse) => void) : Promise<void>
    {
        // Error checking
        if (this.options.appId == null)
        {
            let response = this.ErrorResponse("No Application has been loaded.\n\nTry _!createapp_, _!loadapp_ or _!help_ for more info.");
            cb(response);
            return;
        }
        else if (!this.options.modelId && !this.options.inTeach)
        {
            let response = this.ErrorResponse("This application needs to be trained first.\n\nTry _!train_, _!traindialogs_ or _!help_ for more info.");
            cb(response);
            return;
        }
        else if (!this.options.sessionId)
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

        await this.SendTurnRequest(requestBody)
        .then(async (takeTurnResponse) => {
            BlisDebug.Log(takeTurnResponse);

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
                if (this.options.luisCallback)
                {
                    takeTurnRequest = this.options.luisCallback(takeTurnResponse.originalText, takeTurnResponse.entities);
                }
                else
                {
                    takeTurnRequest = this.DefaultLUCallback(takeTurnResponse.originalText, takeTurnResponse.entities);
                }
                await this.TakeTurn(takeTurnRequest, cb);
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
                    if (this.options.apiCallbacks && this.options.apiCallbacks[apiName])
                    {
                        let takeTurnRequest = this.options.apiCallbacks[apiName]();
                        expectedNextModes = [TakeTurnModes.ACTION, TakeTurnModes.TEACH];
                        await this.TakeTurn(takeTurnRequest, cb);
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

    private SendTurnRequest(body : {}) : Promise<TakeTurnResponse>
    {
        let apiPath = `app/${this.options.appId}/session2/${this.options.sessionId}`;
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
                        reject(JSON.parse(body).message);
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

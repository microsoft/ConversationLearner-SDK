const request = require('request');
var util = require('util');
import {deserialize} from 'json-typescript-mapper';
import { Credentials } from './Http/Credentials';
import { SessionRequest } from './Model/SessionRequest';
import { AppRequest } from './Model/AppRequest';
import { Entity, Action, ActionTypes, TakeTurnModes, TakeTurnResponse } from './Model/TakeTurnResponse'
import { TakeTurnRequest } from './Model/TakeTurnRequest'
import { HandleError, Debug } from './Model/ErrorHandler';

export class BlisClient {

    private serviceUri : string;
    private credentials : Credentials;

    constructor(serviceUri : string, user : string, secret : string)
    {
        if (!serviceUri) HandleError("service Uri is required");
        this.serviceUri = serviceUri;

        this.credentials = new Credentials(user, secret);
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
                        resolve(body.id);
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
                        reject(body.message);
                    }
                    else {
                        resolve(body.id);
                    }
                });
            }
        )
    }


    public StartSession(appId : string, modelId : string, teach = false, saveDialog = false) : Promise<string>
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
                        Teach: teach,
                        Save_To_Log: saveDialog,
                        ModelID: modelId
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

    public EndSession(appId : string, sessionId : string) : Promise<string>
    {
        let apiPath = `app/${appId}/session2/${sessionId}`;

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
                        reject(body.message);
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
                        reject(body.message);
                    }
                    else {
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public AddAction(appId : string, content : string, requiredEntityList : string[], negativeEntityList : string[], prebuiltEntityName : string) : Promise<string>
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
                        reject(body.message);
                    }
                    else {
                        resolve(body.id);
                    }
                });
            }
        )
    }

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

    public async TakeTurn(appId : string, sessionId : string, text : string, 
                            luCallback : (text: string, entities : Entity[]) => TakeTurnRequest, 
                            apiCallbacks = {},
                            resultCallback: (response : TakeTurnResponse) => void,
                            takeTurnRequest = new TakeTurnRequest({text : text}),
                            expectedNextModes = [TakeTurnModes.Callback, TakeTurnModes.Action, TakeTurnModes.Teach]) : Promise<void>
    {
        await this.SendTurnRequest(appId, sessionId, takeTurnRequest)
        .then(async (takeTurnResponse) => {
            Debug(takeTurnResponse);

            if (expectedNextModes.indexOf(takeTurnResponse.mode) < 0)
            {
                var response = new TakeTurnResponse({ mode : TakeTurnModes.Error, error: `Unexpected mode ${takeTurnResponse.mode}`} );
                resultCallback(response);
            }
            if (takeTurnResponse.mode) {

                // LUIS CALLBACK
                if (takeTurnResponse.mode == TakeTurnModes.Callback)
                {
                    if (luCallback)
                    {
                        takeTurnRequest = luCallback(takeTurnResponse.originalText, takeTurnResponse.entities);
                    }
                    else
                    {
                        takeTurnRequest = new TakeTurnRequest();  // TODO
                    }
                    expectedNextModes = [TakeTurnModes.Action, TakeTurnModes.Teach];
                    await this.TakeTurn(appId, sessionId, text, luCallback, apiCallbacks, resultCallback,takeTurnRequest,expectedNextModes);
                }
                // TEACH
                else if (takeTurnResponse.mode == TakeTurnModes.Teach)
                {
                    resultCallback(takeTurnResponse);
                }

                // ACTION
                else if (takeTurnResponse.mode == TakeTurnModes.Action)
                {
                    if (takeTurnResponse.actions[0].actionType == ActionTypes.Text)
                    {
                        resultCallback(takeTurnResponse);
                    }
                    else if (takeTurnResponse.actions[0].actionType == ActionTypes.API)
                    {
                        var apiName = takeTurnResponse.actions[0].content;
                        if (apiCallbacks[apiName])
                        {
                            // TODO handle apli callback
                            /*
                            takeTurnResponse = apiCallbacks[apiName]();
                            req_json = {
                                'entities': entities,
                                'context': context,
                                'action_mask': action_mask,
                            }
                            expected_next_modes = ['teach','action']
                            */
                            expectedNextModes = [TakeTurnModes.Action, TakeTurnModes.Teach];
                            await this.TakeTurn(appId, sessionId, text, luCallback, apiCallbacks, resultCallback,takeTurnRequest,expectedNextModes);
                        }
                        else 
                        {
                            var response = new TakeTurnResponse({ mode : TakeTurnModes.Error, error: `API ${apiName} not defined`} );
                            resultCallback(response);
                        }
                    }
                }
            }
            else
            {
                var response = new TakeTurnResponse({ mode : TakeTurnModes.Error, error: `mode ${response.mode} not supported by the SDK`} );
                resultCallback(response);
            }
        })
        .catch((text) => {
            var response = new TakeTurnResponse({ mode : TakeTurnModes.Error, error: text} );
            resultCallback(response);
        });
    }

    private SendTurnRequest(appId : string, sessionId : string, takeTurnRequest : TakeTurnRequest) : Promise<TakeTurnResponse>
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
                requestData['body'] = takeTurnRequest.ToJSON();

                request.put(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body.message);
                    }
                    else {
                        // API hands back with one action or a list of actions
                      /*  if (body.action) {
                            body.actions = new Array<Action>(body.action);
                            body.action = null;
                        }*/
                        var ttresponse = deserialize(TakeTurnResponse, body);
                        //var ttresponse = new TakeTurnResponse(body['orig-text'], body.entities, body.mode, body.actions);
                        resolve(ttresponse);
                    }
                });
            }
        )
    }
}

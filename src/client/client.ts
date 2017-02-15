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

    private serviceUri : String;
    private credentials : Credentials;

    constructor(serviceUri : string, user : string, secret : string)
    {
        if (!serviceUri) HandleError("service Uri is required");
        this.serviceUri = serviceUri;

        this.credentials = new Credentials(user, secret);
    }

    public CreateApp(name : String, luisKey : String) : Promise<String>
    {
        var apiPath = "app";

        return new Promise(
            (resolve, reject) => {
                const requestData = {
                    url: this.serviceUri + apiPath,
                    headers: {
                        'Cookie' : this.credentials.CookieString(),
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
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public StartSession(appId : String, modelId : String, teach = false, saveDialog = false) : Promise<String>
    {
        let apiPath = `app/${appId}/session2`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.CookieString()
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
                        reject(body);
                    }
                    else {
                        resolve(body.id);
                    }

                });
            }
        )
    }

    public EndSession(appId : String, sessionId : String) : Promise<String>
    {
        let apiPath = `app/${appId}/session2/${sessionId}`;

        return new Promise(
            (resolve, reject) => {
                let url = this.serviceUri+apiPath;
                const requestData = {
                    headers: {
                        'Cookie' : this.credentials.CookieString()
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
                        resolve(body.id);
                    }

                });
            }
        )
    }

    public AddEntity(appId : String, entityName : String, entityType : String, prebuiltEntityName : String) : Promise<String>
    {
        let apiPath = `app/${appId}/entity`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.CookieString()
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

    public AddAction(appId : String, content : String, requiredEntityList : String[], negativeEntityList : String[], prebuiltEntityName : string) : Promise<String>
    {
        let apiPath = `app/${appId}/action`;

        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.CookieString()
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
                        reject(body);
                    }
                    else {
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public TrainModel(appId : String, fromScratch : boolean = false) : Promise<String>
    {
        let apiPath = `app/${appId}/model`;
        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.CookieString()
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
                        resolve(body.id);
                    }
                });
            }
        )
    }

    public async TakeTurn(appId : String, sessionId : String, text : String, 
                            luCallback : (text: String, entities : Entity[]) => TakeTurnRequest, 
                            apiCallbacks = {},
                            resultCallback: (response : TakeTurnResponse) => void) : Promise<void>
    {
        var takeTurnRequest = new TakeTurnRequest({text : text});
        var expectedNextModes = [TakeTurnModes.Callback, TakeTurnModes.Action, TakeTurnModes.Teach];

        while (true)
        {
            // Take a turn

            var takeTurnResponse = await this.TakeATurn(appId, sessionId, takeTurnRequest);

            Debug(takeTurnResponse);

            if (expectedNextModes.indexOf(takeTurnResponse.mode) < 0)
            {
                HandleError(`Unexpected mode ${takeTurnResponse.mode}`);
            }
            if (takeTurnResponse.mode) {

                // LU CALLBACK
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
                }
                // TEACH
                else if (takeTurnResponse.mode == TakeTurnModes.Teach)
                {
                    return resultCallback(takeTurnResponse);
                }

                // ACTION
                else if (takeTurnResponse.mode == TakeTurnModes.Action)
                {
                    if (takeTurnResponse.actions[0].actionType == ActionTypes.Text)
                    {
                        return resultCallback(takeTurnResponse);
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
                        }
                        else 
                        {
                            HandleError(`API ${apiName} not defined`);
                        }
                    }
                }
            }
            else
            {
                HandleError("mode ${response.mode} not supported by the SDK.");
            }
        }
    }

    private TakeATurn(appId : String, sessionId : String, takeTurnRequest : TakeTurnRequest) : Promise<TakeTurnResponse>
    {
        let apiPath = `app/${appId}/session2/${sessionId}`;
        return new Promise(
            (resolve, reject) => {
               const requestData = {
                    url: this.serviceUri+apiPath,
                    headers: {
                        'Cookie' : this.credentials.CookieString()
                    },
                    json: true
                }
                requestData['body'] = takeTurnRequest.ToJSON();

                request.put(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(body);
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

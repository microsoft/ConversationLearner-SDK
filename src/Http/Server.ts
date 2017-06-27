var restify = require('restify');
import { BlisDebug} from '../BlisDebug';
import { BlisClient} from '../BlisClient';
import { BlisApp } from '../Model/BlisApp';
import { Action } from '../Model/Action';
import { Entity } from '../Model/Entity';
import { ExtractorStep, ScorerResponse } from '../Model/TrainDialog'
import { deserialize, serialize } from 'json-typescript-mapper';

export class Server {
    private static server;

    // TEMP until we have an actual user
    private static InitClient() : void
    {
        let serviceUrl = "http://blis-service.azurewebsites.net/api/v1/";
        let user = "testuser";
        let secret = "none";
        let azureFunctionsUrl = "";
        let azureFunctionsKey = "";
        BlisClient.Init(serviceUrl, user, secret, azureFunctionsUrl, azureFunctionsKey);
    }

    // Parse error to return appropriate error message
    private static ErrorMessage(response) : Error
    {
        let msg : string;
        if (response.body)
        {
            return response.body;
        }
        else
        {
            return Error(response.statusMessage);  
        }  
    }

    public static Init() : void{
        this.server = restify.createServer();

        this.server.use(restify.bodyParser());

        this.server.listen(5000, (err) =>
        {
            if (err)
            {
                BlisDebug.Error(err);
            }
            else
            {
                BlisDebug.Log(`${this.server.name} listening to ${this.server.url}`);
            }
        });

        //========================================================
        // App
        //========================================================
            this.server.get("/app/:appId", async (req, res, next) =>
                {
                    let appId = req.params.appId;
                    if (!appId)
                    {
                        res.send(400, Error("Missing Application Id"));
                        return;
                    }
                    this.InitClient();  // TEMP

                    try
                    {
                        let app = await BlisClient.client.GetApp(appId);
                        res.send(serialize(app));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.post("/app", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

                        let app = deserialize(BlisApp, req.body);
                        let appId = await BlisClient.client.AddApp(app);
                        res.send(appId);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.put("/app/:appId", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

                        let app = deserialize(BlisApp, req.body);
                        let appId = await BlisClient.client.EditApp(app);
                        res.send(appId);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.del("/app/:appId", async (req, res, next) =>
            {
                    let appId = req.params.appId;
                    if (!appId)
                    {
                        res.send(400, Error("Missing Application Id"));
                        return;
                    }
                    this.InitClient();  // TEMP

                    try
                    {
                        await BlisClient.client.DeleteApp(appId);
                        res.send(200);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.get("/apps", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let apps = await BlisClient.client.GetApps();
                        res.send(serialize(apps));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

        //========================================================
        // Action
        //========================================================
            this.server.get("/app/:appId/action/:actionId", async (req, res, next) =>
                {
                    let appId = req.params.appId;
                    let actionId = req.params.actionId;
        
                    if (!actionId)
                    {
                        res.send(400, Error("Missing Action Id"));
                        return;
                    }
                    this.InitClient();  // TEMP

                    try
                    {
                        let action = await BlisClient.client.GetAction(appId, actionId);
                        res.send(serialize(action));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.post("/app/:appId/action", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

                        let appId = req.params.appId;
                        let action = deserialize(Action, req.body);
                        let actionId = await BlisClient.client.AddAction(appId, action);
                        res.send(actionId);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.put("/app/:appId/action/:actionId", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

                        let appId = req.params.appId;
                        let action = deserialize(Action, req.body);

                        if (req.params.actionId != action.actionId)
                        {
                            return next(new restify.InvalidArgumentError("ActionId of object does not match URI"));
                        }
                        // Do not send Id
                        delete action.actionId;
                        let actionId = await BlisClient.client.EditAction(appId, action);
                        res.send(actionId);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.del("/app/:appId/action/:actionId", async (req, res, next) =>
                {
                    let appId = req.params.appId;
                    let actionId = req.params.actionId;
    
                    if (!actionId)
                    {
                        res.send(400, Error("Missing Action Id"));
                        return;
                    }

                    this.InitClient();  // TEMP

                    try
                    {
                        await BlisClient.client.DeleteAction(appId, actionId);
                        res.send(200);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.get("/app/:appId/actions", async (req, res, next) =>
                {
                    let appId = req.params.appId;

                    this.InitClient();  // TEMP

                    try
                    {
                        let actions = await BlisClient.client.GetActions(appId);
                        res.send(serialize(actions));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.get("/app/:appId/actionIds", async (req, res, next) =>
                {
                    let appId = req.params.appId;

                    this.InitClient();  // TEMP

                    try
                    {
                        let actions = await BlisClient.client.GetActionIds(appId);
                        res.send(serialize(actions));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

        //========================================================
        // Entity
        //========================================================
            this.server.get("/app/:appId/entity/:entityId", async (req, res, next) =>
                {
                    let appId = req.params.appId;
                    let entityId = req.params.entityId;
        
                    if (!entityId)
                    {
                        res.send(400, Error("Missing Entity Id"));
                        return;
                    }
                    this.InitClient();  // TEMP

                    try
                    {
                        let entity = await BlisClient.client.GetEntity(appId, entityId);
                        res.send(serialize(entity));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.post("/app/:appId/entity", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

                        let appId = req.params.appId;
                        let entity = deserialize(Entity, req.body);
                        let entityId = await BlisClient.client.AddEntity(appId, entity);
                        res.send(entityId);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.put("/app/:appId/entity/:entityId", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

                        let appId = req.params.appId;
                        let entity = deserialize(Entity, req.body);
                        let entityId = await BlisClient.client.EditEntity(appId, entity);
                        res.send(entityId);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.del("/app/:appId/entity/:entityId", async (req, res, next) =>
                {
                    let appId = req.params.appId;
                    let entityId = req.params.entityId;
    
                    if (!entityId)
                    {
                        res.send(400, Error("Missing Entity Id"));
                        return;
                    }

                    this.InitClient();  // TEMP

                    try
                    {
                        await BlisClient.client.DeleteEntity(appId, entityId);
                        res.send(200);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.get("/app/:appId/entities", async (req, res, next) =>
                {
                    let appId = req.params.appId;

                    this.InitClient();  // TEMP

                    try
                    {
                        let entities = await BlisClient.client.GetEntities(appId);
                        res.send(serialize(entities));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.get("/app/:appId/entityIds", async (req, res, next) =>
                {
                    let appId = req.params.appId;

                    this.InitClient();  // TEMP

                    try
                    {
                        let actions = await BlisClient.client.GetEntityIds(appId);
                        res.send(serialize(actions));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

        //========================================================
        // Training
        //========================================================

            /** Uploads a labeled entity extraction instance
             * ie "commits" an entity extraction label, appending it to the teach session's
             * trainDialog, and advancing the dialog. This may yield produce a new package.
             */
            this.server.post("/app/:appId/teach/${sessionId}/extractor", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

                        let appId = req.params.appId;
                        let sessionId = req.params.sessionId;
                        let extractorStep = deserialize(ExtractorStep, req.body);
                        let response = await BlisClient.client.ExtractResponse(appId, sessionId, extractorStep);
                        res.send(response);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** Uploads a labeled scorer step instance 
             * – ie "commits" a scorer label, appending it to the teach session's 
             * trainDialog, and advancing the dialog. This may yield produce a new package.
             */
            this.server.post("/app/:appId/teach/${sessionId}/scorer", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

                        let appId = req.params.appId;
                        let sessionId = req.params.sessionId;
                        let scorerResponse = deserialize(ScorerResponse, req.body);
                        let response = await BlisClient.client.ScoreResponse(appId, sessionId, scorerResponse);
                        res.send(response);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );
    }
}
var restify = require('restify');
import { BlisDebug} from '../BlisDebug';
import { BlisClient} from '../BlisClient';
import { BlisApp } from '../Model/BlisApp';
import { Action } from '../Model/Action';
import { Entity } from '../Model/Entity';
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

        //-------------------------------------
        // App
        //-------------------------------------
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

        //-------------------------------------
        // Action
        //-------------------------------------
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

        //-------------------------------------
        // Entity
        //-------------------------------------
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
    }
}
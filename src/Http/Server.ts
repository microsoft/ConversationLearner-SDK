var restify = require('restify');
import { BlisDebug } from '../BlisDebug';
import { BlisClient } from '../BlisClient';
import { BlisDialog } from '../BlisDialog'
import { BlisMemory } from '../BlisMemory';
import { BlisApp } from '../Model/BlisApp';
import { Action } from '../Model/Action';
import { Entity } from '../Model/Entity';
import { TrainDialog, TrainExtractorStep, TrainScorerStep, ExtractResponse, UIScoreResponse  } from 'blis-models'

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
        this.server.use(restify.queryParser());

        //CORS
        this.server.use(restify.CORS({
            origins: ['*'],
            credentials: true,
            headers: ['*']
        }));

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
        // State
        //========================================================
            /** Sets the current active application */
            this.server.put("state/app/:appId", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId

                        let memory = BlisMemory.GetMemory(key);
                        await memory.BotState().SetAppId(appId);
                        res.send(200);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** Sets the current active session */
            this.server.put("state/session/:sessionId", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP
                        let query = req.getQuery();
                        let key = req.params.key;
                        let sessionId = req.params.sessionId;
                        
                        let memory = BlisMemory.GetMemory(key);
                        await memory.BotState().SetSessionId(sessionId);
                        res.send(200);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** Sets the current active teach session */
            this.server.put("state/teach/:teachId", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP
                        let query = req.getQuery();
                        let key = req.params.key;
                        let teachId = req.params.teachId

                        let memory = BlisMemory.GetMemory(key);
                        await memory.BotState().SetSessionId(teachId);
                        await memory.BotState().SetInTeach(true);
                        res.send(200);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

        //========================================================
        // App
        //========================================================
           
            /** Retrieves information about a specific application */
            this.server.get("/app/:appId", async (req, res, next) =>
                {
                    let query = req.getQuery();
                    let key = req.params.key;
                    let appId = req.params.appId;                   

                    this.InitClient();  // TEMP

                    try
                    {

                        let app = await BlisClient.client.GetApp(appId, query);
                        res.send(serialize(app));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** Create a new application */
            this.server.post("/app", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

                        let query = req.getQuery();
                        let key = req.params.key;
                        let app = deserialize(BlisApp, req.body);
                        let appId = await BlisClient.client.AddApp(app, query);
                        res.send(appId);

                        // Initialize memory
                        await BlisMemory.GetMemory(key).Init(appId);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** Renames an existing application or changes its LUIS key
             * Note: Renaming an application does not affect packages */
            this.server.put("/app/:appId", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP
                        let query = req.getQuery();
                        let key = req.params.key;
                        let app = deserialize(BlisApp, req.body);
                        
                        if (!app.appId)
                        {
                            app.appId = req.params.appId;
                        }
                        else if (req.params.appId != app.appId)
                        {
                            return next(new restify.InvalidArgumentError("AppId of object does not match URI"));
                        }

                        let appId = await BlisClient.client.EditApp(app, query);
                        res.send(appId);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** Archives an existing application */
            this.server.del("/app/:appId", async (req, res, next) =>
            {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        await BlisClient.client.ArchiveApp(appId);
                        res.send(200);

                        // Did I delete my loaded app, if so clear my state
                        let memory = BlisMemory.GetMemory(key);
                        let curAppId = await memory.BotState().AppId();
                        if (appId == curAppId)
                        {
                            await memory.BotState().SetAppId(null);
                            await memory.BotState().SetModelId(null);
                            await memory.BotState().SetSessionId(null);
                        }
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** Destroys an existing application, including all its models, sessions, and logged dialogs
             * Deleting an application from the archive really destroys it – no undo. */
            this.server.del("/archive/:appId", async (req, res, next) =>
            {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        await BlisClient.client.DeleteApp(appId);
                        res.send(200);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** GET APP STATUS : Retrieves details for a specific $appId */
            this.server.get("/archive/:appId", async (req, res, next) =>
            {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let blisApp = await BlisClient.client.GetAppStatus(appId);
                        res.send(blisApp);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** Retrieves a list of (active) applications */
            this.server.get("/apps", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let apps = await BlisClient.client.GetApps(query);
                        res.send(serialize(apps));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** Retrieves a list of application Ids in the archive for the given user */
            this.server.get("/archive", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let apps = await BlisClient.client.GetArchivedAppIds(query);
                        res.send(serialize(apps));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** Retrieves a list of full applications in the archive for the given user */
            this.server.get("/archives", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let apps = await BlisClient.client.GetArchivedApps(query);
                        res.send(serialize(apps));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** Moves an application from the archive to the set of active applications */
            this.server.put("/archive/:appId", async (req, res, next) =>
                {                                    
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId; 
                        let app = await BlisClient.client.RestoreApp(appId);
                        res.send(serialize(app));
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
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let actionId = req.params.actionId;
                        let action = await BlisClient.client.GetAction(appId, actionId, query);
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

                        let query = req.getQuery();
                        let key = req.params.key;
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

                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let action = deserialize(Action, req.body);

                        if (!action.actionId)
                        {
                            action.actionId = req.params.actionId;
                        }
                        else if (req.params.actionId != action.actionId)
                        {
                            return next(new restify.InvalidArgumentError("ActionId of object does not match URI"));
                        }
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
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let actionId = req.params.actionId;
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
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let actions = await BlisClient.client.GetActions(appId, query);
                        res.send(serialize(actions));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.get("/app/:appId/action", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let actions = await BlisClient.client.GetActionIds(appId, query);
                        res.send(serialize(actions));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

        
 

        //========================================================
        // Entities
        //========================================================

            this.server.get("/app/:appId/entityIds", async (req, res, next) =>
                {    
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let actions = await BlisClient.client.GetEntityIds(appId, query);
                        res.send(serialize(actions));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.get("/app/:appId/entity/:entityId", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let entityId = req.params.entityId;
                        let entity = await BlisClient.client.GetEntity(appId, entityId, query);
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
                        let query = req.getQuery();
                        let key = req.params.key;
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
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let entity = deserialize(Entity, req.body);    

                        if (!entity.entityId)
                        {
                            entity.entityId = req.params.entityId;
                        }
                        else if (req.params.entityId != entity.entityId)
                        {
                            return next(new restify.InvalidArgumentError("EntityId of object does not match URI"));
                        }

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
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let entityId = req.params.entityId;
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
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let entities = await BlisClient.client.GetEntities(appId, query);
                        res.send(serialize(entities));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.get("/app/:appId/entity", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let entityIds = await BlisClient.client.GetEntityIds(appId, query);
                        res.send(serialize(entityIds));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );
        
        //========================================================
        // LogDialogs
        //========================================================
            this.server.get("/app/:appId/logdialog/:logDialogId", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let logDialogId = req.params.logDialogId;
                        let logDialog = await BlisClient.client.GetLogDialog(appId, logDialogId);
                        res.send(serialize(logDialog));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.del("/app/:appId/logdialogs/:logDialogId", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let logDialogId = req.params.logDialogId;
                        await BlisClient.client.DeleteLogDialog(appId, logDialogId);
                        res.send(200);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.get("/app/:appId/logdialogs", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let logDialogs = await BlisClient.client.GetLogDialogs(appId, query);
                        res.send(serialize(logDialogs));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.get("/app/:appId/logDialogIds", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let logDialogIds = await BlisClient.client.GetLogDialogIds(appId, query);
                        res.send(serialize(logDialogIds));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

        //========================================================
        // TrainDialogs
        //========================================================
            
            this.server.post("/app/:appId/traindialog", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let trainDialog = deserialize(TrainDialog, req.body);
                        let trainDialogId = await BlisClient.client.AddTrainDialog(appId, trainDialog);
                        res.send(trainDialogId);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.put("/app/:appId/traindialog/:traindialogId", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let trainDialog = deserialize(TrainDialog, req.body);

                        if (!trainDialog.trainDialogId)
                        {
                            trainDialog.trainDialogId = req.params.trainDialogId;
                        }
                        else if (req.params.trainDialogId != trainDialog.trainDialogId)
                        {
                            return next(new restify.InvalidArgumentError("ActionId of object does not match URI"));
                        }
                        let trainDialogId = await BlisClient.client.EditTrainDialog(appId, trainDialog);
                        res.send(trainDialogId);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.get("/app/:appId/traindialog/:trainDialogId", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let trainDialogId = req.params.trainDialogId;
                        let trainDialog = await BlisClient.client.GetTrainDialog(appId, trainDialogId);
                        res.send(serialize(trainDialog));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.del("/app/:appId/traindialogs/:trainDialogId", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let trainDialogId = req.params.trainDialogId;
                        await BlisClient.client.DeleteTrainDialog(appId, trainDialogId);
                        res.send(200);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.get("/app/:appId/traindialogs", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let trainDialogs = await BlisClient.client.GetTrainDialogs(appId, query);
                        res.send(serialize(trainDialogs));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            this.server.get("/app/:appId/trainDialogIds", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let trainDialogIds = await BlisClient.client.GetTrainDialogIds(appId, query);
                        res.send(serialize(trainDialogIds));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

        //========================================================
        // Session
        //========================================================

            /** START SESSION : Creates a new session and a corresponding logDialog */
            this.server.post("/app/:appId/session", async (req, res, next) =>
            {
                try
                {
                    this.InitClient();  // TEMP

                    let query = req.getQuery();
                    let key = req.params.key;
                    let appId = req.params.appId;
                    let sessionResponse = await BlisClient.client.StartSession(appId);
                    res.send(sessionResponse);

                    // Update Memory
                    let memory = BlisMemory.GetMemory(key);
                    memory.StartSession(sessionResponse.sessionId, false);
                }
                catch (error)
                {
                    res.send(error.statusCode, Server.ErrorMessage(error));
                }
            }
            );

            /** GET SESSION : Retrieves information about the specified session */
            this.server.get("/app/:appId/session/:sessionId", async (req, res, next) =>
            {
                try
                {
                    this.InitClient();  // TEMP
                    let query = req.getQuery();
                    let key = req.params.key;
                    let appId = req.params.appId;
                    let sessionId = req.params.sessionId;
                    let response = await BlisClient.client.GetSession(appId, sessionId);
                    res.send(response); 
                }
                catch (error)
                {
                    res.send(error.statusCode, Server.ErrorMessage(error));
                }
            }
            );

            /** END SESSION : End a session. */
            this.server.del("/app/:appId/session/:sessionId", async (req, res, next) =>
            {
                this.InitClient();  // TEMP

                try
                {
                    let query = req.getQuery();
                    let key = req.params.key;
                    let appId = req.params.appId;
                    let sessionId = req.params.sessionId;
                    let response = await BlisClient.client.EndSession(appId, sessionId, query);
                    res.send(response);

                    // Update Memory
                    let memory = BlisMemory.GetMemory(key);
                    memory.EndSession()
                }
                catch (error)
                {
                    res.send(error.statusCode, Server.ErrorMessage(error));
                }
            }
            );

            /** GET SESSIONS : Retrieves definitions of ALL open sessions */
            this.server.get("/app/:appId/sessions", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let sessions = await BlisClient.client.GetSessions(appId, query);
                        res.send(serialize(sessions));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );
 
            /** GET SESSION IDS : Retrieves a list of session IDs */
            this.server.get("/app/:appId/session", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let sessionIds = await BlisClient.client.GetSessionIds(appId, query);
                        res.send(serialize(sessionIds));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

        //========================================================
        // Teach
        //========================================================
            
            /** START TEACH SESSION: Creates a new teaching session and a corresponding trainDialog */
            this.server.post("/app/:appId/teach", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let teachResponse = await BlisClient.client.StartTeach(appId);
                        res.send(teachResponse);

                        // Update Memory
                        let memory = BlisMemory.GetMemory(key);
                        memory.StartSession(teachResponse.teachId, true);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** GET TEACH: Retrieves information about the specified teach */
            this.server.get("/app/:appId/teach/:teachId", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let teachId = req.params.teachId;
                        let response = await BlisClient.client.GetTeach(appId, teachId);
                        res.send(response); 
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** RUN EXTRACTOR: Runs entity extraction (prediction). 
             * If a more recent version of the package is available on 
             * the server, the session will first migrate to that newer version.  This 
             * doesn't affect the trainDialog maintained.
             */
            this.server.put("/app/:appId/teach/:teachId/extractor", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let teachId = req.params.teachId;
                        let userInput = req.body;
                        let extractResponse = await BlisClient.client.TeachExtract(appId, teachId, userInput);
                        res.send(extractResponse);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** EXTRACTION FEEDBACK: Uploads a labeled entity extraction instance
             * ie "commits" an entity extraction label, appending it to the teach session's
             * trainDialog, and advancing the dialog. This may yield produce a new package.
             */
            this.server.post("/app/:appId/teach/:teachId/extractor", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let teachId = req.params.teachId;
                        let extractorStep = deserialize(TrainExtractorStep, req.body);
                        let teachResponse = await BlisClient.client.TeachExtractFeedback(appId, teachId, extractorStep);
                        res.send(teachResponse);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** RUN SCORER: Takes a turn and return distribution over actions.
             * If a more recent version of the package is 
             * available on the server, the session will first migrate to that newer version.  
             * This doesn't affect the trainDialog maintained by the teaching session.
             */
            this.server.put("/app/:appId/teach/:teachId/scorer", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let teachId = req.params.teachId;
                        let extractResponse = deserialize(ExtractResponse, req.body);

                        // Call LUIS callback to get scoreInput
                        let memory = BlisMemory.GetMemory(key);
                        let scoreInput = await BlisDialog.dialog.CallLuisCallback(extractResponse.text, extractResponse.predictedEntities, memory);
                        let scoreResponse = await BlisClient.client.TeachScore(appId, teachId, scoreInput);
                        let memories = memory.BotMemory().DumpEntities();
                        let uiScoreResponse = new UIScoreResponse({scoreResponse : scoreResponse, memories : memories});
                        res.send(scoreResponse);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** SCORE FEEDBACK: Uploads a labeled scorer step instance 
             * – ie "commits" a scorer label, appending it to the teach session's 
             * trainDialog, and advancing the dialog. This may yield produce a new package.
             */
            this.server.post("/app/:appId/teach/:teachId/scorer", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let teachId = req.params.teachId;
                        let trainScorerStep = deserialize(TrainScorerStep, req.body);
                        let teachResponse = await BlisClient.client.TeachScoreFeedback(appId, teachId, trainScorerStep);
                        res.send(teachResponse);

                        // Now take the trained action
                        let memory = BlisMemory.GetMemory(key);
                        BlisDialog.dialog.TakeAction(trainScorerStep.scoredAction, memory);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** END TEACH: Ends a teach.   
             * For Teach sessions, does NOT delete the associated trainDialog.
             * To delete the associated trainDialog, call DELETE on the trainDialog.
             */
            this.server.del("/app/:appId/teach/:teachId", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let teachId = req.params.teachId;
                        let response = await BlisClient.client.EndTeach(appId, teachId);
                        res.send(response);

                        // Update Memory
                        let memory = BlisMemory.GetMemory(key);
                        memory.EndSession()
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** GET TEACH SESSOINS: Retrieves definitions of ALL open teach sessions */
            this.server.get("/app/:appId/teaches", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let teaches = await BlisClient.client.GetTeaches(appId, query);
                        res.send(serialize(teaches));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );
 
            /** GET TEACH SESSION IDS: Retrieves a list of teach session IDs */
            this.server.get("/app/:appId/teach", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let key = req.params.key;
                        let appId = req.params.appId;
                        let teachIds = await BlisClient.client.GetTeachIds(appId, query);
                        res.send(serialize(teachIds));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );
    }
}
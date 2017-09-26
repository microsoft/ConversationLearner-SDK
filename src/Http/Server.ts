var restify = require('restify');
import { BlisDebug } from '../BlisDebug';
import { BlisClient } from '../BlisClient';
import { BlisDialog } from '../BlisDialog'
import { BlisMemory } from '../BlisMemory';
import { BlisApp } from '../Model/BlisApp';
import { Action } from '../Model/Action';
import { Entity } from '../Model/Entity';
import { Utils } from '../Utils';
import { TrainDialog, TrainExtractorStep, TrainScorerStep, ExtractResponse, BotInfo } from 'blis-models'
import { UIScoreInput, UIExtractResponse, UIScoreResponse } from 'blis-models'

import { deserialize, serialize } from 'json-typescript-mapper';

export class Server {
    private static server;

    // TEMP until we have an actual user
    private static InitClient() : void
    {
        let user = "testuser";
        let secret = "none";
        let azureFunctionsUrl = "";
        let azureFunctionsKey = "";
        BlisClient.Init(user, secret, azureFunctionsUrl, azureFunctionsKey);
    }

    // Parse error to return appropriate error message
    private static HandleError(response, err) : void
    {
        // Generate error message
        let error = null;
        if (err.body)
        {
            error = err.body;
        }
        else {
            let msg = ` ${err.statusMessage ? err.statusMessage + "\n\n" : ""}${err.message ? err.message + "\n\n" : ""}${err.stack ? err.stack : ""}`;           
            error = new Error(msg) ;
        }
        let statusCode = (error.statusCode ? error.statusCode : 500);
        response.send(statusCode, error);
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
        //=======================================================
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
                        Server.HandleError(res, error);
                    }
                }
            );

        //========================================================
        // Bot
        //========================================================

            /** Retrieves information about the running bot */
            this.server.get("/bot", async (req, res, next) =>
            {
                this.InitClient();  // TEMP

                try
                {
                    let callbacks = Object.keys(BlisDialog.Instance().apiCallbacks);
                    let botInfo = new BotInfo({callbacks: callbacks});
                    res.send(serialize(botInfo));
                }
                catch (error)
                {
                    Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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

                        // Did I delete my loaded app, if so clear my state
                        let memory = BlisMemory.GetMemory(key);
                        let curAppId = await memory.BotState().AppId();
                        if (appId == curAppId)
                        {
                            await memory.BotState().SetAppId(null);
                            await memory.BotState().SetSessionId(null);
                        }
                        res.send(200);
                    }
                    catch (error)
                    {
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
                    }
                }
            );

            this.server.del("/app/:appId/logdialog/:logDialogId", async (req, res, next) =>
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
                    }
                }
            );

            this.server.del("/app/:appId/traindialog/:trainDialogId", async (req, res, next) =>
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                    Server.HandleError(res, error);
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
                    Server.HandleError(res, error);
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
                    Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        let memory = BlisMemory.GetMemory(key);

                        // If no entities extracted, check for suggested entity
                        if (extractResponse.predictedEntities.length == 0) {
                            let suggestedEntity = await Utils.GetSuggestedEntity(userInput, memory);
                            if (suggestedEntity) {
                                extractResponse.predictedEntities = [suggestedEntity];
                            }
                        }

                        let memories = await memory.BotMemory().DumpMemory();
                        let uiExtractResponse = new UIExtractResponse({extractResponse : extractResponse, memories : memories});
                        res.send(uiExtractResponse);
                    }
                    catch (error)
                    {
                        Server.HandleError(res, error);
                    }
                }
            );

            /** EXTRACT FEEDBACK & RUN SCORER: 
             * 1) Uploads a labeled entity extraction instance
             * ie "commits" an entity extraction label, appending it to the teach session's
             * trainDialog, and advancing the dialog. This may yield produce a new package.
             * 2) Takes a turn and return distribution over actions.
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
                        let uiScoreInput = deserialize(UIScoreInput, req.body);

                        let memory = BlisMemory.GetMemory(key);

                        // There will be no extraction step if performing a 2nd scorer round after a non-termial action
                        if (uiScoreInput.trainExtractorStep) {
                            // Send teach feedback
                            let teachResponse = await BlisClient.client.TeachExtractFeedback(appId, teachId, uiScoreInput.trainExtractorStep);
                        }

                        // Call LUIS callback to get scoreInput
                        let extractResponse = uiScoreInput.extractResponse;      
                        let scoreInput = await BlisDialog.Instance().CallLuisCallback(extractResponse.text, extractResponse.predictedEntities, extractResponse.definitions.entities, memory);

                        // Get score response
                        let scoreResponse = await BlisClient.client.TeachScore(appId, teachId, scoreInput);
                        let memories = await memory.BotMemory().DumpMemory();
                        let uiScoreResponse = new UIScoreResponse({scoreInput : scoreInput, scoreResponse : scoreResponse, memories : memories});
                        res.send(uiScoreResponse);
                    }
                    catch (error)
                    {
                        Server.HandleError(res, error);
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

                        // Save scored action and remove from service call
                        let scoredAction = trainScorerStep.scoredAction;
                        delete trainScorerStep.scoredAction;

                        let teachResponse = await BlisClient.client.TeachScoreFeedback(appId, teachId, trainScorerStep);
                        res.send(teachResponse);

                        // Now take the trained action
                        let memory = BlisMemory.GetMemory(key);
                        BlisDialog.Instance().TakeAction(scoredAction, memory);
                    }
                    catch (error)
                    {
                        Server.HandleError(res, error);
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
                        let save = req.params.save ? `saveDialog=${req.params.save}` : null;
                        let response = await BlisClient.client.EndTeach(appId, teachId, save);
                        res.send(response);

                        // Update Memory
                        let memory = BlisMemory.GetMemory(key);
                        memory.EndSession()
                    }
                    catch (error)
                    {
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
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
                        Server.HandleError(res, error);
                    }
                }
            );
    }
}
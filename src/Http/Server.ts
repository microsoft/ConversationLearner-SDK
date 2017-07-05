var restify = require('restify');
import { BlisDebug} from '../BlisDebug';
import { BlisClient} from '../BlisClient';
import { BlisApp } from '../Model/BlisApp';
import { Action } from '../Model/Action';
import { Entity } from '../Model/Entity';
import { TrainDialog, TrainExtractorStep, TrainScorerStep  } from '../NPM/TrainDialog'

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
           
            /** Retrieves information about a specific application */
            this.server.get("/app/:appId", async (req, res, next) =>
                {
                    let appId = req.params.appId;
                    let query = req.getQuery();                    

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

            /** Renames an existing application or changes its LUIS key
             * Note: Renaming an application does not affect packages */
            this.server.put("/app/:appId", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

                        let app = deserialize(BlisApp, req.body);
                        
                        if (!app.appId)
                        {
                            app.appId = req.params.appId;
                        }
                        else if (req.params.appId != app.appId)
                        {
                            return next(new restify.InvalidArgumentError("AppId of object does not match URI"));
                        }

                        let query = req.getQuery();
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
                    let appId = req.params.appId;
                    if (!appId)
                    {
                        res.send(400, Error("Missing Application Id"));
                        return;
                    }
                    this.InitClient();  // TEMP

                    try
                    {
                        await BlisClient.client.ArchiveApp(appId);
                        res.send(200);
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

            /** Retrieves a list of (active) applications */
            this.server.get("/apps", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
                        let apps = await BlisClient.client.GetApps(query);
                        res.send(serialize(apps));
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** Retrieves a list of applications in the archive for the given user */
            this.server.get("/archive", async (req, res, next) =>
                {
                    this.InitClient();  // TEMP

                    try
                    {
                        let query = req.getQuery();
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
                    let appId = req.params.appId;                 

                    this.InitClient();  // TEMP

                    try
                    {
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
                    let appId = req.params.appId;
                    let actionId = req.params.actionId;
                    let query = req.getQuery();   
                    if (!actionId)
                    {
                        res.send(400, Error("Missing Action Id"));
                        return;
                    }
                    this.InitClient();  // TEMP

                    try
                    {
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
                    let query = req.getQuery();   
                    this.InitClient();  // TEMP

                    try
                    {
                        let actions = await BlisClient.client.GetActions(appId, query);
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
                    let query = req.getQuery();   

                    this.InitClient();  // TEMP

                    try
                    {
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
                    let appId = req.params.appId;
                    let query = req.getQuery();    
                    this.InitClient();  // TEMP

                    try
                    {
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
                    let appId = req.params.appId;
                    let entityId = req.params.entityId;
                    let query = req.getQuery();    

                    if (!entityId)
                    {
                        res.send(400, Error("Missing Entity Id"));
                        return;
                    }
                    this.InitClient();  // TEMP

                    try
                    {
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
                    let query = req.getQuery();    

                    this.InitClient();  // TEMP

                    try
                    {
                        let entities = await BlisClient.client.GetEntities(appId, query);
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
                    let query = req.getQuery();    

                    this.InitClient();  // TEMP

                    try
                    {
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
                    let appId = req.params.appId;
                    let logDialogId = req.params.logDialogId;
        
                    if (!logDialogId)
                    {
                        res.send(400, Error("Missing Log Dialog Id"));
                        return;
                    }
                    this.InitClient();  // TEMP

                    try
                    {
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
                    let appId = req.params.appId;
                    let logDialogId = req.params.logDialogId;
    
                    if (!logDialogId)
                    {
                        res.send(400, Error("Missing Log Dialog Id"));
                        return;
                    }

                    this.InitClient();  // TEMP

                    try
                    {
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
                    let appId = req.params.appId;
                    let query = req.getQuery();
                    this.InitClient();  // TEMP

                    try
                    {
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
                    let appId = req.params.appId;
                    let query = req.getQuery();
                    this.InitClient();  // TEMP

                    try
                    {
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
                    let appId = req.params.appId;
                    let trainDialogId = req.params.trainDialogId;
        
                    if (!trainDialogId)
                    {
                        res.send(400, Error("Missing TrainDialog Id"));
                        return;
                    }
                    this.InitClient();  // TEMP

                    try
                    {
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
                    let appId = req.params.appId;
                    let trainDialogId = req.params.trainDialogId;
    
                    if (!trainDialogId)
                    {
                        res.send(400, Error("Missing TrainDialog Id"));
                        return;
                    }

                    this.InitClient();  // TEMP

                    try
                    {
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
                    let appId = req.params.appId;
                    let query = req.getQuery();
                    this.InitClient();  // TEMP

                    try
                    {
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
                    let appId = req.params.appId;
                    let query = req.getQuery();
                    this.InitClient();  // TEMP

                    try
                    {
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

            /** Creates a new session and a corresponding logDialog */
            this.server.post("/app/:appId/session", async (req, res, next) =>
            {
                try
                {
                    this.InitClient();  // TEMP

                    let appId = req.params.appId;
                    let response = await BlisClient.client.StartSession(appId);
                    res.send(response);
                }
                catch (error)
                {
                    res.send(error.statusCode, Server.ErrorMessage(error));
                }
            }
            );

            /** Retrieves information about the specified session */
            this.server.get("/app/:appId/teach/:sessionId", async (req, res, next) =>
            {
                try
                {
                    this.InitClient();  // TEMP

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

            /** End a session. */
            this.server.del("/app/:appId/session/:sessionId", async (req, res, next) =>
            {
                let appId = req.params.appId;
                let sessionId = req.params.sessionId;
                let query = req.getQuery();    

                this.InitClient();  // TEMP

                try
                {
                    let response = await BlisClient.client.EndSession(appId, sessionId, query);
                    res.send(response);
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
            
            /** Creates a new teaching session and a corresponding trainDialog */
            this.server.post("/app/:appId/teach", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

                        let appId = req.params.appId;
                        let response = await BlisClient.client.StartTeach(appId);
                        res.send(response);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** Retrieves information about the specified teach */
            this.server.get("/app/:appId/teach/:teachId", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

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

            /** Uploads a labeled entity extraction instance
             * ie "commits" an entity extraction label, appending it to the teach session's
             * trainDialog, and advancing the dialog. This may yield produce a new package.
             */
            this.server.post("/app/:appId/teach/:teachId/extractor", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

                        let appId = req.params.appId;
                        let teachId = req.params.teachId;
                        let extractorStep = deserialize(TrainExtractorStep, req.body);
                        let response = await BlisClient.client.TeachExtractFeedback(appId, teachId, extractorStep);
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
            this.server.post("/app/:appId/teach/:teachId/scorer", async (req, res, next) =>
                {
                    try
                    {
                        this.InitClient();  // TEMP

                        let appId = req.params.appId;
                        let teachId = req.params.teachId;
                        let scorerResponse = deserialize(TrainScorerStep, req.body);
                        let response = await BlisClient.client.TeachScoreFeedback(appId, teachId, scorerResponse);
                        res.send(response);
                    }
                    catch (error)
                    {
                        res.send(error.statusCode, Server.ErrorMessage(error));
                    }
                }
            );

            /** Ends a teach.   
             * For Teach sessions, does NOT delete the associated trainDialog.
             * To delete the associated trainDialog, call DELETE on the trainDialog.
             */
            this.server.del("/app/:appId/teach/:teachId", async (req, res, next) =>
                {
                    let appId = req.params.appId;
                    let teachId = req.params.teachId;
    
                    if (!teachId)
                    {
                        res.send(400, Error("Missing Entity Id"));
                        return;
                    }

                    this.InitClient();  // TEMP

                    try
                    {
                        let response = await BlisClient.client.EndTeach(appId, teachId);
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
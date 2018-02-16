import * as Restify from 'restify'
import { BlisDebug } from '../BlisDebug'
import { BlisClient } from '../BlisClient'
import { Blis } from '../Blis'
import { BlisMemory } from '../BlisMemory'
import { BlisIntent } from '../BlisIntent'
import { TemplateProvider } from '../TemplateProvider'
import { Utils } from '../Utils'
import * as XMLDom from 'xmldom'
import * as models from 'blis-models'
import * as corsMiddleware from 'restify-cors-middleware'

const cors = corsMiddleware({
    origins: ['*'],
    allowHeaders: ['*'],
    exposeHeaders: []
})

// Extract error text from HTML error
export const HTML2Error = (htmlText: string): string => {
    try {
        // Parse html
        let parser = new XMLDom.DOMParser()
        let document = parser.parseFromString(htmlText)
        let errorTitle = document.getElementById('stackpage')
        if (errorTitle) {
            return errorTitle.textContent.slice(0, 1500)
        }
        return htmlText
    } catch (err) {
        return htmlText
    }
}

// Parse error to return appropriate error message
export const HandleError = (response: Restify.Response, err: any): void => {
    // Generate error message
    let error = ''
    if (typeof err == 'string') {
        error = err
    }
    if (err.message && typeof err.message == 'string') {
        error += `${err.message}\n`
    }
    if (err.stack && typeof err.stack == 'string') {
        error += `${err.stack}\n`
    }
    if (err.body && typeof err.body == 'string') {
        // Handle HTML error
        if (err.body.indexOf('!DOCTYPE html')) {
            error += HTML2Error(err.body)
        } else {
            error += `${err.body}\n`
        }
    }
    if (err.body && err.body.errorMessages && err.body.errorMessages.length > 0) {
        error += err.body.errorMessages.join()
    }
    let statusCode = err.statusCode ? err.statusCode : 500
    response.send(statusCode, error)

    let log = `${error}\n${err.request ? 'BODY:' + err.request.body : null}`
    BlisDebug.Error(log)
}

const defaultOptions: Restify.ServerOptions = {
    name: `SDK Service`
}

export const createSdkServer = (client: BlisClient, options: Restify.ServerOptions = {}): Restify.Server => {
    const server = Restify.createServer({
        ...defaultOptions,
        ...options
    })

    server.use(Restify.bodyParser())
    server.use(Restify.queryParser())

    //CORS
    server.pre(cors.preflight)
    server.use(cors.actual)

    server.on('restifyError', (req: any, res: any, err: any, cb: any) => {
        BlisDebug.Error(err, 'ResiftyError')
        req.log.error(err)
        return cb()
    })

    //========================================================
    // State
    //=======================================================
    /** Sets the current active application */
    server.put('state/app', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            let key = req.params.key
            let app: models.BlisAppBase = req.body

            let memory = BlisMemory.GetMemory(key)
            await memory.BotState.SetAppAsync(app)
            res.send(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Sets the current conversationId so bot can send initial pro-active message */
    server.put('state/conversationId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let key = req.params.key
            let conversationId = req.params.id
            let userName = req.params.username

            let memory = BlisMemory.GetMemory(key)
            await memory.BotState.CreateConversationReferenceAsync(userName, key, conversationId)
            res.send(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // Bot
    //========================================================

    /** Retrieves information about the running bot */
    server.get('/bot', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let botInfo: models.BotInfo = {
                callbacks: Blis.apiParams,
                templates: TemplateProvider.GetTemplates()
            }
            res.send(botInfo)
        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // App
    //========================================================

    /** Retrieves information about a specific application */
    server.get('/app/:appId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        let query = req.getQuery()
        //let key = req.params.key;
        let appId = req.params.appId
        try {
            let app = await client.GetApp(appId, query)
            res.send(app)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/source', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        const query = req.getQuery()
        const appId = req.params.appId
        try {
            const appDefinition = await client.GetAppSource(appId, query)
            res.send(appDefinition)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/trainingstatus', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        const query = req.getQuery()
        const appId = req.params.appId
        try {
            const trainingStatus = await client.GetAppTrainingStatus(appId, query)
            res.send(trainingStatus)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Create a new application */
    server.post('/app', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            let key = req.params.key
            let app: models.BlisAppBase = req.body

            app.appId = await client.AddApp(app, query)
            res.send(app.appId)

            // Initialize memory
            await BlisMemory.GetMemory(key).Init(app)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Renames an existing application or changes its LUIS key
     * Note: Renaming an application does not affect packages */
    server.put('/app/:appId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let app: models.BlisAppBase = req.body

            if (!app.appId) {
                app.appId = req.params.appId
            } else if (req.params.appId != app.appId) {
                return next(new Restify.InvalidArgumentError('AppId of object does not match URI'))
            }

            let appId = await client.EditApp(app, query)
            res.send(appId)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Archives an existing application */
    server.del('/app/:appId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            let key = req.params.key
            let appId = req.params.appId
            await client.ArchiveApp(appId)

            // Did I delete my loaded app, if so clear my state
            let memory = BlisMemory.GetMemory(key)
            let app = await memory.BotState.AppAsync()
            if (app && app.appId === appId) {
                await memory.BotState.SetAppAsync(null)
                await memory.BotState.SetSessionAsync(null, null, false)
            }
            res.send(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Destroys an existing application, including all its models, sessions, and logged dialogs
     * Deleting an application from the archive really destroys it – no undo. */
    server.del('/archive/:appId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            await client.DeleteApp(appId)
            res.send(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET APP STATUS : Retrieves details for a specific $appId */
    server.get('/archive/:appId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let blisApp = await client.GetAppStatus(appId)
            res.send(blisApp)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Retrieves a list of (active) applications */
    server.get('/apps', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let apps = await client.GetApps(query)
            res.send(apps)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Copy applications between accounts*/
    server.post('/apps/copy', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        let srcUserId = req.params.srcUserId
        let destUserId = req.params.destUserId
        let luisSubscriptionKey = req.params.luisSubscriptionKey
        try {
            let app = await client.CopyApps(srcUserId, destUserId, luisSubscriptionKey)
            res.send(app)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Retrieves a list of application Ids in the archive for the given user */
    server.get('/archive', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let apps = await client.GetArchivedAppIds(query)
            res.send(apps)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Retrieves a list of full applications in the archive for the given user */
    server.get('/archives', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let apps = await client.GetArchivedApps(query)
            res.send(apps)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Moves an application from the archive to the set of active applications */
    server.put('/archive/:appId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let app = await client.RestoreApp(appId)
            res.send(app)
        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // Action
    //========================================================
    server.get('/app/:appId/action/:actionId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let appId = req.params.appId
            let actionId = req.params.actionId
            let action = await client.GetAction(appId, actionId, query)
            res.send(action)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.post('/app/:appId/action', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let action: models.ActionBase = req.body
            let actionId = await client.AddAction(appId, action)
            res.send(actionId)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.put('/app/:appId/action/:actionId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let action: models.ActionBase = req.body

            if (!action.actionId) {
                action.actionId = req.params.actionId
            } else if (req.params.actionId != action.actionId) {
                return next(new Restify.InvalidArgumentError('ActionId of object does not match URI'))
            }
            let actionId = await client.EditAction(appId, action)
            res.send(actionId)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.del('/app/:appId/action/:actionId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let actionId = req.params.actionId
            await client.DeleteAction(appId, actionId)
            res.send(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/actions', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let appId = req.params.appId
            let actions = await client.GetActions(appId, query)
            res.send(actions)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/action', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let appId = req.params.appId
            let actions = await client.GetActionIds(appId, query)
            res.send(actions)
        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // Entities
    //========================================================

    server.get('/app/:appId/entityIds', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let appId = req.params.appId
            let actions = await client.GetEntityIds(appId, query)
            res.send(actions)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/entity/:entityId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let appId = req.params.appId
            let entityId = req.params.entityId
            let entity = await client.GetEntity(appId, entityId, query)
            res.send(entity)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.post('/app/:appId/entity', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let entity: models.EntityBase = req.body
            let entityId = await client.AddEntity(appId, entity)
            res.send(entityId)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.put('/app/:appId/entity/:entityId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let entity: models.EntityBase = req.body

            if (!entity.entityId) {
                entity.entityId = req.params.entityId
            } else if (req.params.entityId != entity.entityId) {
                return next(new Restify.InvalidArgumentError('EntityId of object does not match URI'))
            }

            let entityId = await client.EditEntity(appId, entity)
            res.send(entityId)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.del('/app/:appId/entity/:entityId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let entityId = req.params.entityId
            await client.DeleteEntity(appId, entityId)
            res.send(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/entities', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let appId = req.params.appId
            let entities = await client.GetEntities(appId, query)
            res.send(entities)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/entity', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let appId = req.params.appId
            let entityIds = await client.GetEntityIds(appId, query)
            res.send(entityIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // LogDialogs
    //========================================================
    server.get('/app/:appId/logdialog/:logDialogId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let logDialogId = req.params.logDialogId
            let logDialog = await client.GetLogDialog(appId, logDialogId)
            res.send(logDialog)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.del('/app/:appId/logdialog/:logDialogId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let logDialogId = req.params.logDialogId
            await client.DeleteLogDialog(appId, logDialogId)
            res.send(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/logdialogs', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let appId = req.params.appId
            let logDialogs = await client.GetLogDialogs(appId, query)
            res.send(logDialogs)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/logDialogIds', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let appId = req.params.appId
            let logDialogIds = await client.GetLogDialogIds(appId, query)
            res.send(logDialogIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // TrainDialogs
    //========================================================

    server.post('/app/:appId/traindialog', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let trainDialog: models.TrainDialog = req.body

            // TEMP: until object refactor
            let strippedTrainDialog = Utils.StripPrebuiltInfoFromTrain(trainDialog)

            let trainDialogId = await client.AddTrainDialog(appId, strippedTrainDialog)
            res.send(trainDialogId)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.put('/app/:appId/traindialog/:trainDialogId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let trainDialog: models.TrainDialog = req.body

            //TEMP: until object refactor
            let strippedTrainDialog = Utils.StripPrebuiltInfoFromTrain(trainDialog)

            let trainDialogId = await client.EditTrainDialog(appId, strippedTrainDialog)
            res.send(trainDialogId)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/traindialog/:trainDialogId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let trainDialogId = req.params.trainDialogId
            let trainDialog = await client.GetTrainDialog(appId, trainDialogId)
            res.send(trainDialog)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.del('/app/:appId/traindialog/:trainDialogId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let trainDialogId = req.params.trainDialogId
            await client.DeleteTrainDialog(appId, trainDialogId)
            res.send(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/traindialogs', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let appId = req.params.appId
            let trainDialogs = await client.GetTrainDialogs(appId, query)
            res.send(trainDialogs)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/trainDialogIds', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let appId = req.params.appId
            let trainDialogIds = await client.GetTrainDialogIds(appId, query)
            res.send(trainDialogIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** RUN EXTRACTOR: Runs entity extraction on a train dialog
     */
    server.put('/app/:appId/traindialog/:trainDialogId/extractor/:turnIndex', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            let key = req.params.key
            let appId = req.params.appId
            let trainDialogId = req.params.trainDialogId
            let turnIndex = req.params.turnIndex
            let userInput = req.body
            let extractResponse = await client.TrainDialogExtract(appId, trainDialogId, turnIndex, userInput)

            let memory = BlisMemory.GetMemory(key)
            let memories = await memory.BotMemory.DumpMemory()
            let uiExtractResponse: models.UIExtractResponse = { extractResponse, memories }
            res.send(uiExtractResponse)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Create a new teach session based on the current train dialog starting at round turnIndex */
    server.post('/app/:appId/traindialog/:trainDialogId/branch/:turnIndex', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            let key = req.params.key
            let appId = req.params.appId
            let userName = req.params.username
            let userId = req.params.userid
            let trainDialogId = req.params.trainDialogId
            let turnIndex = req.params.turnIndex

            // Retreive current train dialog
            let trainDialog = await client.GetTrainDialog(appId, trainDialogId, true)

            // Slice to length requested by user
            trainDialog.rounds = trainDialog.rounds.slice(0, turnIndex)

            // Get history and replay to put bot into last round
            let memory = BlisMemory.GetMemory(key)
            let teachWithHistory = await Blis.GetHistory(appId, trainDialog, userName, userId, memory, true)

            // Start teach session if replay of API was consistent
            if (teachWithHistory.discrepancies.length == 0) {
                // Start new teach session from the old train dialog
                let contextDialog = models.ModelUtils.ToContextDialog(trainDialog)
                let teachResponse = await client.StartTeach(appId, contextDialog)

                // Start Sesion - with "true" to save the memory from the History
                await memory.StartSessionAsync(teachResponse.teachId, null, { inTeach: true, saveMemory: true })
                teachWithHistory.teach = models.ModelUtils.ToTeach(teachResponse)
            }
            res.send(teachWithHistory)
        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // Session
    //========================================================

    /** START SESSION : Creates a new session and a corresponding logDialog */
    server.post('/app/:appId/session', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            let key = req.params.key
            let appId = req.params.appId
            let sessionResponse = await client.StartSession(appId)
            res.send(sessionResponse)

            // Update Memory
            let memory = BlisMemory.GetMemory(key)
            memory.StartSessionAsync(sessionResponse.sessionId, null, { inTeach: false, saveMemory: false })
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET SESSION : Retrieves information about the specified session */
    server.get('/app/:appId/session/:sessionId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let sessionId = req.params.sessionId
            let response = await client.GetSession(appId, sessionId)
            res.send(response)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** END SESSION : End a session. */
    server.del('/app/:appId/session/:sessionId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            let key = req.params.key
            let appId = req.params.appId
            let sessionId = req.params.sessionId
            let response = await client.EndSession(appId, sessionId, query)
            res.send(response)

            // Update Memory
            let memory = BlisMemory.GetMemory(key)
            memory.EndSession()
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET SESSIONS : Retrieves definitions of ALL open sessions */
    server.get('/app/:appId/sessions', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let appId = req.params.appId
            let sessions = await client.GetSessions(appId, query)
            res.send(sessions)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET SESSION IDS : Retrieves a list of session IDs */
    server.get('/app/:appId/session', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let appId = req.params.appId
            let sessionIds = await client.GetSessionIds(appId, query)
            res.send(sessionIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // Teach
    //========================================================

    /** START TEACH SESSION: Creates a new teaching session and a corresponding trainDialog */
    server.post('/app/:appId/teach', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            let key = req.params.key
            let appId = req.params.appId
            let teachResponse = await client.StartTeach(appId, null)
            res.send(teachResponse)

            // Update Memory
            let memory = BlisMemory.GetMemory(key)
            memory.StartSessionAsync(teachResponse.teachId, null, { inTeach: true, saveMemory: false })
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** START TEACH SESSION: Creates a new teaching session from existing train dialog */
    server.post('/app/:appId/teachwithhistory', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            let key = req.params.key
            let appId = req.params.appId
            let userName = req.params.username
            let userId = req.params.userid
            let ignoreLastExtract = req.params.ignoreLastExtract === 'true'
            let updateBotState = true
            let trainDialog: models.TrainDialog = req.body

            // Get history and replay to put bot into last round
            let memory = BlisMemory.GetMemory(key)
            let teachWithHistory = await Blis.GetHistory(appId, trainDialog, userName, userId, memory, updateBotState, ignoreLastExtract)

            // Start session if API returned consistent results during replay
            if (teachWithHistory.discrepancies.length == 0) {
                // Start new teach session from the old train dialog
                let contextDialog = models.ModelUtils.ToContextDialog(trainDialog)
                let teachResponse = await client.StartTeach(appId, contextDialog)

                // Start Sesion - with "true" to save the memory from the History
                await memory.StartSessionAsync(teachResponse.teachId, null, { inTeach: true, saveMemory: true })
                teachWithHistory.teach = models.ModelUtils.ToTeach(teachResponse)

                // If last action wasn't terminal need to score
                if (teachWithHistory.dialogMode === models.DialogMode.Scorer) {
                    // Call LUIS callback
                    teachWithHistory.scoreInput = await Blis.CallEntityDetectionCallback('', [], memory, trainDialog.definitions.entities)
                    teachWithHistory.scoreResponse = await client.TeachScore(
                        appId,
                        teachWithHistory.teach.teachId,
                        teachWithHistory.scoreInput
                    )
                }
            }
            res.send(teachWithHistory)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET TEACH: Retrieves information about the specified teach */
    server.get('/app/:appId/teach/:teachId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            //let key = req.params.key;
            let appId = req.params.appId
            let teachId = req.params.teachId
            let teach = await client.GetTeach(appId, teachId)
            res.send(teach)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** RUN EXTRACTOR: Runs entity extraction (prediction).
     * If a more recent version of the package is available on
     * the server, the session will first migrate to that newer version.  This
     * doesn't affect the trainDialog maintained.
     */
    server.put('/app/:appId/teach/:teachId/extractor', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            let key = req.params.key
            let appId = req.params.appId
            let teachId = req.params.teachId
            let userInput = req.body

            // If a form text could be null
            if (!userInput.text) {
                userInput.text = '  '
            }
            let extractResponse = await client.TeachExtract(appId, teachId, userInput)

            let memory = BlisMemory.GetMemory(key)
            let memories = await memory.BotMemory.DumpMemory()
            let uiExtractResponse: models.UIExtractResponse = { extractResponse, memories }
            res.send(uiExtractResponse)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** EXTRACT FEEDBACK & RUN SCORER:
     * 1) Uploads a labeled entity extraction instance
     * ie "commits" an entity extraction label, appending it to the teach session's
     * trainDialog, and advancing the dialog. This may yield produce a new package.
     * 2) Takes a turn and return distribution over actions.
     * If a more recent version of the package is
     * available on the server, the session will first migrate to that newer version.
     * This doesn't affect the trainDialog maintained by the teaching session.
     */
    server.put('/app/:appId/teach/:teachId/scorer', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            let key = req.params.key
            let appId = req.params.appId
            let teachId = req.params.teachId
            let uiScoreInput: models.UIScoreInput = req.body

            let memory = BlisMemory.GetMemory(key)

            // There will be no extraction step if performing a 2nd scorer round after a non-termial action
            if (uiScoreInput.trainExtractorStep) {
                // TEMP: until object scheme is revised, need to strip for server
                let trainExtractorStep = Utils.StripPrebuiltInfo(uiScoreInput.trainExtractorStep)

                // Send teach feedback;
                await client.TeachExtractFeedback(appId, teachId, trainExtractorStep)
            }

            // Call LUIS callback to get scoreInput
            let extractResponse = uiScoreInput.extractResponse
            let scoreInput = await Blis.CallEntityDetectionCallback(
                extractResponse.text,
                extractResponse.predictedEntities,
                memory,
                extractResponse.definitions.entities
            )

            // Get score response
            let scoreResponse = await client.TeachScore(appId, teachId, scoreInput)
            let memories = await memory.BotMemory.DumpMemory()
            let uiScoreResponse: models.UIScoreResponse = { scoreInput, scoreResponse, memories }
            res.send(uiScoreResponse)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /**
     * Re-run scorer given previous score input
     */
    server.put('/app/:appId/teach/:teachId/rescore', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            const { key, appId, teachId } = req.params
            const scoreInput: models.ScoreInput = req.body
            const memory = BlisMemory.GetMemory(key)

            // Get new score response re-using scoreInput from previous score request
            const scoreResponse = await client.TeachScore(appId, teachId, scoreInput)
            const memories = await memory.BotMemory.DumpMemory()
            const uiScoreResponse: models.UIScoreResponse = {
                scoreInput,
                scoreResponse,
                memories
            }

            res.send(uiScoreResponse)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** SCORE FEEDBACK: Uploads a labeled scorer step instance
     * – ie "commits" a scorer label, appending it to the teach session's
     * trainDialog, and advancing the dialog. This may yield produce a new package.
     */
    server.post('/app/:appId/teach/:teachId/scorer', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            let key = req.params.key
            let appId = req.params.appId
            let teachId = req.params.teachId
            let uiTrainScorerStep: models.UITrainScorerStep = req.body

            // Save scored action and remove from service call
            let scoredAction = uiTrainScorerStep.trainScorerStep.scoredAction
            delete uiTrainScorerStep.trainScorerStep.scoredAction

            let teachResponse = await client.TeachScoreFeedback(appId, teachId, uiTrainScorerStep.trainScorerStep)

            let memory = BlisMemory.GetMemory(key)

            // Now send the trained intent
            let intent = {
                name: scoredAction.actionId,
                score: 1.0,
                scoredAction: scoredAction,
                blisEntities: uiTrainScorerStep.entities,
                memory: memory,
                inTeach: true
            } as BlisIntent

            await Blis.SendIntent(memory, intent)

            let memories = await memory.BotMemory.DumpMemory()
            let uiTeachResponse: models.UITeachResponse = { teachResponse, memories }
            res.send(uiTeachResponse)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** END TEACH: Ends a teach.
     * For Teach sessions, does NOT delete the associated trainDialog.
     * To delete the associated trainDialog, call DELETE on the trainDialog.
     */
    server.del('/app/:appId/teach/:teachId', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            ///let query = req.getQuery();
            let key = req.params.key
            let appId = req.params.appId
            let teachId = req.params.teachId
            let save = req.params.save ? `saveDialog=${req.params.save}` : null
            let response = await client.EndTeach(appId, teachId, save)
            res.send(response)

            // Update Memory
            let memory = BlisMemory.GetMemory(key)
            memory.EndSession()
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET TEACH SESSOINS: Retrieves definitions of ALL open teach sessions */
    server.get('/app/:appId/teaches', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let appId = req.params.appId
            let teaches = await client.GetTeaches(appId, query)
            res.send(teaches)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET TEACH SESSION IDS: Retrieves a list of teach session IDs */
    server.get('/app/:appId/teach', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            let query = req.getQuery()
            //let key = req.params.key;
            let appId = req.params.appId
            let teachIds = await client.GetTeachIds(appId, query)
            res.send(teachIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // Replay
    //========================================================

    server.post('/app/:appId/history', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            let key = req.params.key
            let appId = req.params.appId
            let userName = req.params.username
            let userId = req.params.userid
            let trainDialog: models.TrainDialog = req.body

            let memory = BlisMemory.GetMemory(key)
            let teachWithHistory = await Blis.GetHistory(appId, trainDialog, userName, userId, memory)
            res.send(teachWithHistory.history)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.post('/app/:appId/teach/:teachId/undo', async (req, res, next) => {
        BlisClient.authorizationHeader = req.header('Authorization')
        try {
            //let query = req.getQuery();
            let key = req.params.key
            let appId = req.params.appId
            let userName = req.params.username
            let userId = req.params.userid
            let popRound = req.params.popround
            let teach: models.Teach = req.body

            // Retreive current train dialog
            let trainDialog = await client.GetTrainDialog(appId, teach.trainDialogId, true)

            // Remove last round
            if (popRound == 'true') {
                trainDialog.rounds.pop()
            }

            // Get memory and store a backup in case the undo fails
            let memory = BlisMemory.GetMemory(key)
            let memoryBackup = await memory.BotMemory.FilledEntityMap()

            // Get history and replay to put bot into last round
            let teachWithHistory = await Blis.GetHistory(appId, trainDialog, userName, userId, memory, true)

            // If APIs returned same values during replay
            if (teachWithHistory.discrepancies.length === 0) {
                // Delete existing train dialog (don't await)
                client.EndTeach(appId, teach.teachId, `saveDialog=false`)

                // Start new teach session from the previous trainDialog
                let contextDialog = models.ModelUtils.ToContextDialog(trainDialog)
                let teachResponse = await client.StartTeach(appId, contextDialog)

                // Start Sesion - with "true" to save the memory from the History
                await memory.StartSessionAsync(teachResponse.teachId, null, { inTeach: true, saveMemory: true })
                teachWithHistory.teach = models.ModelUtils.ToTeach(teachResponse)
            } else {
                // Failed, so restore the old memory
                await memory.BotMemory.RestoreFromMap(memoryBackup)
            }
            res.send(teachWithHistory)
        } catch (error) {
            HandleError(res, error)
        }
    })

    return server
}

export default createSdkServer

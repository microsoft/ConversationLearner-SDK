/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as restify from 'restify'
import * as errors from 'restify-errors'
import { CLDebug } from '../CLDebug'
import { CLClient } from '../CLClient'
import { CLRunner } from '../CLRunner'
import { ConversationLearner } from '../ConversationLearner'
import { CLMemory } from '../CLMemory'
import { CLRecognizerResult } from '../CLRecognizeResult'
import { TemplateProvider } from '../TemplateProvider'
import { Utils, replace, CL_DEVELOPER } from '../Utils'
import * as XMLDom from 'xmldom'
import * as models from 'conversationlearner-models'
import * as corsMiddleware from 'restify-cors-middleware'
import * as crypto from 'crypto'

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
        if (errorTitle && errorTitle.textContent) {
            return errorTitle.textContent.slice(0, 1500)
        }
        return htmlText
    } catch (err) {
        return htmlText
    }
}

// Parse error to return appropriate error message
export const HandleError = (response: restify.Response, err: any): void => {
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
    if (err.statusMessage && typeof err.statusMessage == 'string') {
        error += `${err.statusMessage}\n`
    }
    if (err.body && err.body.errorMessages && err.body.errorMessages.length > 0) {
        error += err.body.errorMessages.join()
    }
    let statusCode = err.statusCode ? err.statusCode : 500
    response.send(statusCode, error)

    let log = `${error}\n${err.request ? 'BODY:' + err.request.body : null}`
    CLDebug.Error(log)
}

const defaultOptions: restify.ServerOptions = {
    name: `SDK Service`
}

export const createSdkServer = (client: CLClient, options: restify.ServerOptions = {}): restify.Server => {
    const server = restify.createServer({
        ...defaultOptions,
        ...options
    })

    server.use(restify.plugins.bodyParser())
    server.use(restify.plugins.queryParser({
        mapParams: true
    }))

    //CORS
    server.pre(cors.preflight)
    server.use(cors.actual)

    server.on('restifyError', (req: any, res: any, err: any, cb: any) => {
        CLDebug.Error(err, 'ResiftyError')
        req.log.error(err)
        return cb()
    })

    //========================================================
    // State
    //=======================================================
    /** Sets the current active application */
    server.put('state/app', async (req, res, next) => {
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let app: models.AppBase = req.body

            let memory = CLMemory.GetMemory(key)
            await memory.SetAppAsync(app)
            res.send(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Sets the current conversationId so bot can send initial pro-active message */
    server.put('state/conversationId', async (req, res, next) => {
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let conversationId = req.params.id
            let userName = req.params.username

            let memory = CLMemory.GetMemory(key)
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
        try {
            let appId = req.params.appId
            let clRunner = CLRunner.Get(appId);
            let apiParams = clRunner.apiParams;

            let validationErrors = clRunner.clClient.ValidationErrors();

            const key = ConversationLearner.options!.LUIS_AUTHORING_KEY!
            const hashedKey = key ? crypto.createHash('sha256').update(key).digest('hex') : ""
            const botInfo: models.BotInfo = {
                user: {
                    // We keep track that the editing  UI is running by putting this as the name of the user
                    // Can't check localhost as can be running localhost and not UI
                    name: CL_DEVELOPER,
                    id: hashedKey
                },
                callbacks: apiParams,
                templates: TemplateProvider.GetTemplates(),
                validationErrors: validationErrors
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
        let appId = req.params.appId
        try {
            let app = await client.GetApp(appId)
            res.send(app)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/source', async (req, res, next) => {
        const appId = req.params.appId
        const packageId = req.params.packageId
        try {
            const appDefinition = await client.GetAppSource(appId, packageId)
            res.send(appDefinition)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/trainingstatus', async (req, res, next) => {
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
        try {
            let query = req.getQuery()
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let app: models.AppBase = req.body

            let appId = await client.AddApp(app, query)
            app = await client.GetApp(appId);
            res.send(app)

            // Initialize memory
            await CLMemory.GetMemory(key).SetAppAsync(app)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /**
     * Renames an existing application or changes its LUIS key
     * Note: Renaming an application does not affect packages
     */
    server.put('/app/:appId', async (req, res, next) => {
        try {
            let query = req.getQuery()
            let app: models.AppBase = req.body

            if (!app.appId) {
                app.appId = req.params.appId
            } else if (req.params.appId != app.appId) {
                return next(new errors.BadRequestError(`appId of object: ${app.appId} must match appId in url: ${req.params.appId}`))
            }

            let appId = await client.EditApp(app, query)
            res.send(appId)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Archives an existing application */
    server.del('/app/:appId', async (req, res, next) => {
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let appId = req.params.appId
            await client.ArchiveApp(appId)

            // Did I delete my loaded app, if so clear my state
            let memory = CLMemory.GetMemory(key)
            let app = await memory.BotState.AppAsync()
            if (app && app.appId === appId) {
                await memory.SetAppAsync(null)

                let clRunner = CLRunner.Get(appId);
                await clRunner.EndSessionAsync(key);
            }
            res.send(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /**
     * Destroys an existing application, including all its models, sessions, and logged dialogs
     * Deleting an application from the archive really destroys it – no undo.
     */
    server.del('/archive/:appId', async (req, res, next) => {
        try {
            let appId = req.params.appId
            await client.DeleteApp(appId)
            res.send(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET APP STATUS : Retrieves details for a specific $appId */
    server.get('/archive/:appId', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let app = await client.GetAppStatus(appId)
            res.send(app)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Retrieves a list of (active) applications */
    server.get('/apps', async (req, res, next) => {
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let query = req.getQuery()
            let apps = await client.GetApps(query)

            // Get lookup table for which apps packages are being edited
            let memory = CLMemory.GetMemory(key)
            let activeApps = await memory.BotState.EditingPackagesAsync();

            let uiAppList = { appList: apps, activeApps: activeApps } as models.UIAppList;
            res.send(uiAppList)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Copy applications between accounts */
    server.post('/apps/copy', async (req, res, next) => {
        let srcUserId = req.params.srcUserId
        let destUserId = req.params.destUserId
        let appId = req.params.appId

        let clRunner = CLRunner.Get(appId);
        let luisSubscriptionKey = clRunner.clClient.LuisAuthoringKey()

        if (luisSubscriptionKey == undefined) {
            throw new Error(`LUIS_AUTHORING_KEY undefined`);
        }

        try {
            let appIds = await client.CopyApps(srcUserId, destUserId, appId, luisSubscriptionKey)
            res.send(appIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Retrieves a list of application Ids in the archive for the given user */
    server.get('/archive', async (req, res, next) => {
        try {
            let query = req.getQuery()
            let apps = await client.GetArchivedAppIds(query)
            res.send(apps)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Retrieves a list of full applications in the archive for the given user */
    server.get('/archives', async (req, res, next) => {
        try {
            let query = req.getQuery()
            let apps = await client.GetArchivedApps(query)
            res.send(apps)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Moves an application from the archive to the set of active applications */
    server.put('/archive/:appId', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let app = await client.RestoreApp(appId)
            res.send(app)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Creates a new package tag for an app */
    server.put('/app/:appId/publish', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let tagName = req.params.version
            let makeLive = req.params.makeLive === "true";

            // Create tag, then load updated app
            let packageReference = await client.PublishApp(appId, tagName)

            // Make live app if requested
            if (makeLive) {
                await client.PublishProdPackage(appId, packageReference.packageId)
            }
            let app = await client.GetApp(appId);

            res.send(app)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Sets the live package tag for an app */
    server.post('/app/:appId/publish/:packageId', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let packageId = req.params.packageId

            await client.PublishProdPackage(appId, packageId)
            let app = await client.GetApp(appId);
            res.send(app)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Sets which app package is being edited */
    server.post('/app/:appId/edit/:packageId', async (req, res, next) => {
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let appId = req.params.appId
            let packageId = req.params.packageId

            let app = await client.GetApp(appId);
            if (packageId != app.devPackageId) {
                if (!app.packageVersions || !app.packageVersions.find(pv => pv.packageId == packageId)) {
                    throw new Error(`Attemped to edit package that doesn't exist: ${packageId}`)
                }
            }

            let memory = CLMemory.GetMemory(key)
            let updatedPackageVersions = await memory.BotState.SetEditingPackageAsync(appId, packageId);
            res.send(updatedPackageVersions)

        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // Action
    //========================================================
    server.get('/app/:appId/action/:actionId', async (req, res, next) => {
        try {
            let query = req.getQuery()
            let appId = req.params.appId
            let actionId = req.params.actionId
            let action = await client.GetAction(appId, actionId, query)
            res.send(action)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.post('/app/:appId/action', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let action: models.ActionBase = req.body
            let actionId = await client.AddAction(appId, action)
            res.send(actionId)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.put('/app/:appId/action/:actionId', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let action: models.ActionBase = req.body

            if (!action.actionId) {
                action.actionId = req.params.actionId
            } else if (req.params.actionId != action.actionId) {
                return next(new errors.BadRequestError('ActionId of object does not match URI'))
            }
            let deleteEditResponse = await client.EditAction(appId, action)
            res.send(deleteEditResponse)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Returns list of trainingDialogIds that are invalidated by the given changed action */
    server.post('/app/:appId/action/:actionId/editValidation', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let action: models.ActionBase = req.body
            const packageId = req.params.packageId

            if (!action.actionId) {
                action.actionId = req.params.actionId
            } else if (req.params.actionId != action.actionId) {
                return next(new errors.BadRequestError('ActionId of object does not match URI'))
            }

            const appDefinition = await client.GetAppSource(appId, packageId)

            // Replace the action with new one
            appDefinition.actions = replace(appDefinition.actions, action, a => a.actionId)

            let clRunner = CLRunner.Get(appId);
            let invalidTrainDialogIds = clRunner.validateTrainDialogs(appDefinition);

            res.send(invalidTrainDialogIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Delete action */
    server.del('/app/:appId/action/:actionId', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let actionId = req.params.actionId
            let deleteEditResponse = await client.DeleteAction(appId, actionId)
            res.send(deleteEditResponse)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Returns list of trainDialogs invalidated by deleting the given action */
    server.get('/app/:appId/action/:actionId/deleteValidation', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let actionId = req.params.actionId
            const packageId = req.params.packageId

            const appDefinition = await client.GetAppSource(appId, packageId)

            // Remove the action
            appDefinition.actions = appDefinition.actions.filter(a => a.actionId != actionId);

            let clRunner = CLRunner.Get(appId);
            let invalidTrainDialogIds = clRunner.validateTrainDialogs(appDefinition);
            res.send(invalidTrainDialogIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/actions', async (req, res, next) => {
        try {
            let query = req.getQuery()
            let appId = req.params.appId
            let actions = await client.GetActions(appId, query)
            res.send(actions)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/action', async (req, res, next) => {
        try {
            let query = req.getQuery()
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
        try {
            let query = req.getQuery()
            let appId = req.params.appId
            let actions = await client.GetEntityIds(appId, query)
            res.send(actions)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/entity/:entityId', async (req, res, next) => {
        try {
            let query = req.getQuery()
            let appId = req.params.appId
            let entityId = req.params.entityId
            let entity = await client.GetEntity(appId, entityId, query)
            res.send(entity)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.post('/app/:appId/entity', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let entity: models.EntityBase = req.body
            let entityId = await client.AddEntity(appId, entity)
            res.send(entityId)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.put('/app/:appId/entity/:entityId', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let entity: models.EntityBase = req.body

            if (!entity.entityId) {
                entity.entityId = req.params.entityId
            } else if (req.params.entityId != entity.entityId) {
                return next(new errors.BadRequestError('EntityId of object does not match URI'))
            }

            let entityId = await client.EditEntity(appId, entity)
            res.send(entityId)
        } catch (error) {
            HandleError(res, error)
        }
    })
    
    /** Returns list of trainingDialogIds that are invalidated by the given changed entity */
    server.post('/app/:appId/entity/:entityId/editValidation', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let entity: models.EntityBase = req.body
            const packageId = req.params.packageId

            if (!entity.entityId) {
                entity.entityId = req.params.entityId
            } else if (req.params.entityId != entity.entityId) {
                return next(new errors.BadRequestError('EntityId of object does not match URI'))
            }

            const appDefinition = await client.GetAppSource(appId, packageId)
            
            // Replace the entity with new one
            appDefinition.entities = replace(appDefinition.entities, entity, e => e.entityId)

            let clRunner = CLRunner.Get(appId);
            let invalidTrainDialogIds = clRunner.validateTrainDialogs(appDefinition);
            res.send(invalidTrainDialogIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.del('/app/:appId/entity/:entityId', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let entityId = req.params.entityId
            let deleteEditResponse = await client.DeleteEntity(appId, entityId)
            res.send(deleteEditResponse)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Returns list of trainDialogs invalidated by deleting the given entity */
    server.get('/app/:appId/entity/:entityId/deleteValidation', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let entityId = req.params.entityId
            const packageId = req.params.packageId

            const appDefinition = await client.GetAppSource(appId, packageId)

            // Remove the action
            appDefinition.entities = appDefinition.entities.filter(e => e.entityId != entityId);

            let clRunner = CLRunner.Get(appId);
            let invalidTrainDialogIds = clRunner.validateTrainDialogs(appDefinition);
            res.send(invalidTrainDialogIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/entities', async (req, res, next) => {
        try {
            let query = req.getQuery()
            let appId = req.params.appId
            let entities = await client.GetEntities(appId, query)
            res.send(entities)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/entity', async (req, res, next) => {
        try {
            let query = req.getQuery()
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
        try {
            let appId = req.params.appId
            let logDialogId = req.params.logDialogId
            let logDialog = await client.GetLogDialog(appId, logDialogId)
            res.send(logDialog)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.del('/app/:appId/logdialog/:logDialogId', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let logDialogId = req.params.logDialogId
            await client.DeleteLogDialog(appId, logDialogId)
            res.send(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/logdialogs', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let packageId = req.params.packageId
            let logDialogs = await client.GetLogDialogs(appId, packageId)
            res.send(logDialogs)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/logDialogIds', async (req, res, next) => {
        try {
            let query = req.getQuery()
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
        try {
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
        try {
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
        try {
            let appId = req.params.appId
            let trainDialogId = req.params.trainDialogId
            let trainDialog = await client.GetTrainDialog(appId, trainDialogId)
            res.send(trainDialog)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.del('/app/:appId/traindialog/:trainDialogId', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let trainDialogId = req.params.trainDialogId
            await client.DeleteTrainDialog(appId, trainDialogId)
            res.send(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/traindialogs', async (req, res, next) => {
        try {
            let query = req.getQuery()
            let appId = req.params.appId
            let trainDialogs = await client.GetTrainDialogs(appId, query)
            res.send(trainDialogs)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/trainDialogIds', async (req, res, next) => {
        try {
            let query = req.getQuery()
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
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let appId = req.params.appId
            let trainDialogId = req.params.trainDialogId
            let turnIndex = req.params.turnIndex
            let userInput = req.body
            let extractResponse = await client.TrainDialogExtract(appId, trainDialogId, turnIndex, userInput)

            let memory = CLMemory.GetMemory(key)
            let memories = await memory.BotMemory.DumpMemory()
            let uiExtractResponse: models.UIExtractResponse = { extractResponse, memories }
            res.send(uiExtractResponse)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Create a new teach session based on the current train dialog starting at round turnIndex */
    server.post('/app/:appId/traindialog/:trainDialogId/branch/:turnIndex', async (req, res, next) => {
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
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
            let memory = CLMemory.GetMemory(key)

            let clRunner = CLRunner.Get(appId);
            let teachWithHistory = await clRunner.GetHistory(appId, trainDialog, userName, userId, memory)
            if (!teachWithHistory) {
                res.send(500, new Error(`Could not find teach session history for given train dialog`))
                return
            }

            // Start teach session if replay of API was consistent
            if (teachWithHistory.replayErrors.length === 0) {
                // Start new teach session from the old train dialog
                let createTeachParams = models.ModelUtils.ToCreateTeachParams(trainDialog)
                let teachResponse = await client.StartTeach(appId, createTeachParams)

                // Start Sesion - with "true" to save the memory from the History
                await clRunner.InitSessionAsync(memory, teachResponse.teachId, null, { inTeach: true, isContinued: true })
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
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let appId = req.params.appId
            let sessionCreateParams: models.SessionCreateParams = req.body
            let sessionResponse = await client.StartSession(appId, sessionCreateParams)
            res.send(sessionResponse)

            let clRunner = CLRunner.Get(appId);
            let memory = CLMemory.GetMemory(key)
            clRunner.InitSessionAsync(memory, sessionResponse.sessionId, null, { inTeach: false, isContinued: false })
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET SESSION : Retrieves information about the specified session */
    server.get('/app/:appId/session/:sessionId', async (req, res, next) => {
        try {
            let appId = req.params.appId
            let sessionId = req.params.sessionId
            let response = await client.GetSession(appId, sessionId)
            res.send(response)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** EXPIRE SESSION : Expires the current session (timeout) */
    server.put('/app/:appId/session/:sessionId', async (req, res, next) => {
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)

            let memory = CLMemory.GetMemory(key)
            let conversationId = await memory.BotState.ConversationIdAsync();
            if (!conversationId) {
                // If conversation is empty
                return;
            }

            let sessionId = await memory.BotState.SessionIdAsync(conversationId);
            if (sessionId != req.params.sessionId) {
                throw new Error("Attempting to expire sessionId not in use")
            }

            // Force sesion to expire
            await memory.BotState.SetLastActiveAsync(0);
            res.send(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** END SESSION : End a session. */
    server.del('/app/:appId/session/:sessionId', async (req, res, next) => {
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let appId = req.params.appId
            let sessionId = req.params.sessionId


            // Session may be a replacement for an expired one
            let memory = CLMemory.GetMemory(key)
            sessionId = await memory.BotState.OrgSessionIdAsync(sessionId)

            let response = await client.EndSession(appId, sessionId)
            res.send(response)

            let clRunner = CLRunner.Get(appId);
            clRunner.EndSessionAsync(key)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET SESSIONS : Retrieves definitions of ALL open sessions */
    server.get('/app/:appId/sessions', async (req, res, next) => {
        try {
            let query = req.getQuery()
            let appId = req.params.appId
            let sessions = await client.GetSessions(appId, query)
            res.send(sessions)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET SESSION IDS : Retrieves a list of session IDs */
    server.get('/app/:appId/session', async (req, res, next) => {
        try {
            let query = req.getQuery()
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
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let appId = req.params.appId
            let teachResponse = await client.StartTeach(appId, null)

            let clRunner = CLRunner.Get(appId);
            let memory = CLMemory.GetMemory(key)
            clRunner.InitSessionAsync(memory, teachResponse.teachId, null, { inTeach: true, isContinued: false })

            // Include and persistent memories in the response
            let memories = await memory.BotMemory.DumpMemory()
            let uiTeachResponse: models.UITeachResponse = { teachResponse, memories }
            res.send(uiTeachResponse)

        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Clear the bot's memory */
    server.del('/app/:appId/botmemory', async (req, res, next) => {
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)

            // Update Memory
            let memory = CLMemory.GetMemory(key)
            await memory.BotMemory.ClearAsync();
            res.send(200)

        } catch (error) {
            HandleError(res, error)
        }
    })

    /** START TEACH SESSION: Creates a new teaching session from existing train dialog */
    server.post('/app/:appId/teachwithhistory', async (req, res, next) => {
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let appId = req.params.appId
            let userName = req.params.username
            let userId = req.params.userid
            let ignoreLastExtract = req.params.ignoreLastExtract === 'true'
            let trainDialog: models.TrainDialog = req.body

            // Get history and replay to put bot into last round
            let memory = CLMemory.GetMemory(key)

            let clRunner = CLRunner.Get(appId);
            let teachWithHistory = await clRunner.GetHistory(appId, trainDialog, userName, userId, memory, ignoreLastExtract)
            if (!teachWithHistory) {
                res.send(500, new Error(`Could not find teach session history for given train dialog`))
                return
            }

            // Start session if API returned consistent results during replay
            if (teachWithHistory.replayErrors.length === 0) {
                // Start new teach session from the old train dialog
                let createTeachParams = models.ModelUtils.ToCreateTeachParams(trainDialog)
                let teachResponse = await client.StartTeach(appId, createTeachParams)

                // Start Sesion - with "true" to save the memory from the History
                await clRunner.InitSessionAsync(memory, teachResponse.teachId, null, { inTeach: true, isContinued: true })
                teachWithHistory.teach = models.ModelUtils.ToTeach(teachResponse)

                // If last action wasn't terminal need to score
                if (teachWithHistory.dialogMode === models.DialogMode.Scorer) {

                    // Get entities from my memory
                    const filledEntities = await memory.BotMemory.FilledEntitiesAsync()
                    let scoreInput: models.ScoreInput = {
                        filledEntities,
                        context: {},
                        maskedActions: []
                    }
                    teachWithHistory.scoreInput = scoreInput;
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
        try {
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
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let appId = req.params.appId
            let teachId = req.params.teachId
            let userInput = req.body

            // If a form text could be null
            if (!userInput.text) {
                userInput.text = '  '
            }
            let extractResponse = await client.TeachExtract(appId, teachId, userInput)

            let memory = CLMemory.GetMemory(key)
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
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let appId = req.params.appId
            let teachId = req.params.teachId
            let uiScoreInput: models.UIScoreInput = req.body

            let memory = CLMemory.GetMemory(key)

            // There will be no extraction step if performing a 2nd scorer round after a non-termial action
            if (uiScoreInput.trainExtractorStep) {
                // TEMP: until object scheme is revised, need to strip for server
                let trainExtractorStep = Utils.StripPrebuiltInfo(uiScoreInput.trainExtractorStep)

                // Send teach feedback;
                await client.TeachExtractFeedback(appId, teachId, trainExtractorStep)
            }

            // Call LUIS callback to get scoreInput
            let extractResponse = uiScoreInput.extractResponse
            let clRunner = CLRunner.Get(appId);
            let scoreInput = await clRunner.CallEntityDetectionCallback(
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
        try {
            const { key, appId, teachId } = req.params
            const scoreInput: models.ScoreInput = req.body
            const memory = CLMemory.GetMemory(key)

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
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let appId = req.params.appId
            let teachId = req.params.teachId
            let uiTrainScorerStep: models.UITrainScorerStep = req.body

            // Save scored action and remove from service call
            let scoredAction = uiTrainScorerStep.trainScorerStep.scoredAction
            if (!scoredAction) {
                throw new Error(`trainScorerStep.scoredAction must be defined.`)
            }
            delete uiTrainScorerStep.trainScorerStep.scoredAction

            let teachResponse = await client.TeachScoreFeedback(appId, teachId, uiTrainScorerStep.trainScorerStep)

            let memory = CLMemory.GetMemory(key)

            // Now send the trained intent
            let intent = {
                scoredAction: scoredAction,
                clEntities: uiTrainScorerStep.entities,
                memory: memory,
                inTeach: true
            } as CLRecognizerResult

            let clRunner = CLRunner.Get(appId);
            await clRunner.SendIntent(intent)

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
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let appId = req.params.appId
            let teachId = req.params.teachId
            let save = req.params.save ? `saveDialog=${req.params.save}` : ''
            let response = await client.EndTeach(appId, teachId, save)
            res.send(response)

            let clRunner = CLRunner.Get(appId);
            clRunner.EndSessionAsync(key)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET TEACH SESSOINS: Retrieves definitions of ALL open teach sessions */
    server.get('/app/:appId/teaches', async (req, res, next) => {
        try {
            let query = req.getQuery()
            let appId = req.params.appId
            let teaches = await client.GetTeaches(appId, query)
            res.send(teaches)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET TEACH SESSION IDS: Retrieves a list of teach session IDs */
    server.get('/app/:appId/teach', async (req, res, next) => {
        try {
            let query = req.getQuery()
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
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
            let appId = req.params.appId
            let userName = req.params.username
            let userId = req.params.userid
            let trainDialog: models.TrainDialog = req.body

            let memory = CLMemory.GetMemory(key)
            let clRunner = CLRunner.Get(appId);
            let teachWithHistory = await clRunner.GetHistory(appId, trainDialog, userName, userId, memory)

            // Clear bot memory geneated with his
            memory.BotMemory.ClearAsync();
            
            if (teachWithHistory) {
                res.send(teachWithHistory)
            }
            else {
                res.send(204)
            }
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.post('/app/:appId/teach/:teachId/undo', async (req, res, next) => {
        try {
            const key = req.header(models.MEMORY_KEY_HEADER_NAME)
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
            let memory = CLMemory.GetMemory(key)
            let memoryBackup = await memory.BotMemory.FilledEntityMap()

            // Get history and replay to put bot into last round
            let clRunner = CLRunner.Get(appId);
            let teachWithHistory = await clRunner.GetHistory(appId, trainDialog, userName, userId, memory)
            if (!teachWithHistory) {
                throw new Error(`Attempted to undo last action of teach session, but could not get session history`)
            }

            // If APIs returned same values during replay
            if (teachWithHistory.replayErrors.length === 0) {
                // Delete existing train dialog (don't await)
                client.EndTeach(appId, teach.teachId, `saveDialog=false`)

                // Start new teach session from the previous trainDialog
                let createTeachParams = models.ModelUtils.ToCreateTeachParams(trainDialog)
                let teachResponse = await client.StartTeach(appId, createTeachParams)

                // Start Sesion - with "true" to save the memory from the History
                await clRunner.InitSessionAsync(memory, teachResponse.teachId, null, { inTeach: true, isContinued: true })
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

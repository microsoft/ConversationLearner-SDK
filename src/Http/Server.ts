/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as express from 'express'
import * as url from 'url'
import { CLDebug } from '../CLDebug'
import { CLClient } from '../CLClient'
import { CLRunner } from '../CLRunner'
import { ConversationLearner } from '../ConversationLearner'
import { CLMemory } from '../CLMemory'
import { CLRecognizerResult } from '../CLRecognizeResult'
import { TemplateProvider } from '../TemplateProvider'
import { replace, CL_DEVELOPER } from '../Utils'
import { BrowserSlot } from '../Memory/BrowserSlot'
import * as Request from 'request'
import * as XMLDom from 'xmldom'
import * as models from '@conversationlearner/models'
import * as crypto from 'crypto'

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
export const HandleError = (response: express.Response, err: any): void => {
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
        error += err.body.errorMessages.map((em: any) => JSON.stringify(em)).join()
    }
    let statusCode = err.statusCode ? err.statusCode : 500

    response.status(statusCode)
    response.send(error)

    let log = `${error}\n${err.request ? 'BODY:' + err.request.body : null}`
    CLDebug.Error(log)
}

const bannerEndpoint = "https://blisstorage.blob.core.windows.net/status/status.json";

const getBanner = () : Promise<models.Banner | null> => {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            uri: bannerEndpoint,
            json: true 
        }
        ​
        // Never fail this request
        Request(options, (error, response, banner) => {
            if (error) {
                CLDebug.Error(error, `Unable to retrieve Banner message`)
                resolve(null)
            } else if (response.statusCode && response.statusCode >= 300) {
                CLDebug.Error(`Unable to retrieve Banner message.  Status Code: ${response.statusCode}`)
                resolve(null)
            } else {
                try {
                    if (banner.message === "") {
                        banner = null;
                    }
                    resolve(banner)
                }
                catch (err) {
                    CLDebug.Error("Malformed Banner message")
                    resolve(null)
                }
            }
        })
    })
  }

export const addSdkRoutes = (server: express.Express, client: CLClient): express.Express => {
    //========================================================
    // State
    //=======================================================
    /** Sets the current active application */
    server.put('/state/app', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const app: models.AppBase = req.body

            const memory = CLMemory.GetMemory(key)
            await memory.SetAppAsync(app)
            res.sendStatus(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Sets the current conversationId so bot can send initial pro-active message */
    server.put('/state/conversationId', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const { conversationId, userName } = getQuery(req)
            const memory = CLMemory.GetMemory(key)
            await memory.BotState.CreateConversationReference(userName, key, conversationId)
            res.sendStatus(200)
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
            const { browserId } = getQuery(req)
            const clRunner = CLRunner.Get()
            const apiParams = clRunner.apiParams
            const validationErrors = clRunner.clClient.ValidationErrors();

            // Generate id
            const browserSlot = await BrowserSlot.GetSlot(browserId);
            const key = ConversationLearner.options!.LUIS_AUTHORING_KEY!
            const hashedKey = key ? crypto.createHash('sha256').update(key).digest('hex') : ""
            const id = `${browserSlot}-${hashedKey}`

            // Retrieve any banner info
            const banner = await getBanner();

            const botInfo: models.BotInfo = {
                user: {
                    // We keep track that the editing  UI is running by putting this as the name of the user
                    // Can't check localhost as can be running localhost and not UI
                    name: CL_DEVELOPER,
                    id: id
                },
                callbacks: apiParams,
                templates: TemplateProvider.GetTemplates(),
                validationErrors: validationErrors,
                banner: banner
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
        const { appId } = req.params
        try {
            const app = await client.GetApp(appId)
            res.send(app)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/source', async (req, res, next) => {
        const { appId } = req.params
        const { packageId } = getQuery(req)
        try {
            const appDefinition = await client.GetAppSource(appId, packageId)
            res.send(appDefinition)
        } catch (error) {
            HandleError(res, error)
        }
    })

    
    server.post('/app/:appId/source', async (req, res, next) => {
        const { appId } = req.params
        const source: models.AppDefinition = req.body
        try {
            await client.SetAppSource(appId, source)
            res.sendStatus(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/trainingstatus', async (req, res, next) => {
        const { appId } = req.params
        const query = url.parse(req.url).query || ''
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
            const query = url.parse(req.url).query || ''
            const key = getMemoryKey(req)
            const newApp: models.AppBase = req.body
            const appId = await client.AddApp(newApp, query)
            const app = await client.GetApp(appId)
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
            const query = url.parse(req.url).query || ''
            const app: models.AppBase = req.body
            const appId = await client.EditApp(app, query)
            res.send(appId)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Archives an existing application */
    server.delete('/app/:appId', async (req, res, next) => {
        const { appId } = req.params

        try {
            const key = getMemoryKey(req)
            await client.ArchiveApp(appId)

            // Did I delete my loaded app, if so clear my state
            const memory = CLMemory.GetMemory(key)
            const app = await memory.BotState.GetApp()
            if (app && app.appId === appId) {
                await memory.SetAppAsync(null)

                const clRunner = CLRunner.Get(appId);
                await clRunner.EndSessionAsync(key, models.SessionEndState.OPEN);
            }
            res.sendStatus(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /**
     * Destroys an existing application, including all its models, sessions, and logged dialogs
     * Deleting an application from the archive really destroys it – no undo.
     */
    server.delete('/archive/:appId', async (req, res, next) => {
        const { appId } = req.params
        
        try {
            await client.DeleteApp(appId)
            res.sendStatus(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET APP STATUS : Retrieves details for a specific $appId */
    server.get('/archive/:appId', async (req, res, next) => {
        const { appId } = req.params

        try {
            const app = await client.GetArchivedApp(appId)
            res.send(app)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Retrieves a list of (active) applications */
    server.get('/apps', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const query = url.parse(req.url).query || ''
            const apps = await client.GetApps(query)

            // Get lookup table for which apps packages are being edited
            const memory = CLMemory.GetMemory(key)
            const activeApps = await memory.BotState.GetEditingPackages();

            const uiAppList = { appList: apps, activeApps: activeApps } as models.UIAppList;
            res.send(uiAppList)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Copy applications between accounts */
    server.post('/apps/copy', async (req, res, next) => {
        const { srcUserId, destUserId, appId } = getQuery(req)
        const clRunner = CLRunner.Get(appId)
        const luisSubscriptionKey = clRunner.clClient.LuisAuthoringKey()

        if (luisSubscriptionKey == undefined) {
            throw new Error(`LUIS_AUTHORING_KEY undefined`);
        }

        try {
            const appIds = await client.CopyApps(srcUserId, destUserId, appId, luisSubscriptionKey)
            res.send(appIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Retrieves a list of application Ids in the archive for the given user */
    server.get('/archive', async (req, res, next) => {
        try {
            const query = url.parse(req.url).query || ''
            const apps = await client.GetArchivedAppIds(query)
            res.send(apps)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Retrieves a list of full applications in the archive for the given user */
    server.get('/archives', async (req, res, next) => {
        try {
            const query = url.parse(req.url).query || ''
            const apps = await client.GetArchivedApps(query)
            res.send(apps)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Moves an application from the archive to the set of active applications */
    server.put('/archive/:appId', async (req, res, next) => {
        const { appId } = req.params

        try {
            let app = await client.RestoreApp(appId)
            res.send(app)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Creates a new package tag for an app */
    server.put('/app/:appId/publish', async (req, res, next) => {
        const { appId } = req.params

        try {
            const { version: tagName, makeLive } = getQuery(req)
            const setLive = makeLive === "true";

            // Create tag, then load updated app
            const packageReference = await client.PublishApp(appId, tagName)

            // Make live app if requested
            if (setLive) {
                await client.PublishProdPackage(appId, packageReference.packageId)
            }
            const app = await client.GetApp(appId);

            res.send(app)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Sets the live package tag for an app */
    server.post('/app/:appId/publish/:packageId', async (req, res, next) => {
        const { appId, packageId } = req.params

        try {
            await client.PublishProdPackage(appId, packageId)
            const app = await client.GetApp(appId);
            res.send(app)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Sets which app package is being edited */
    server.post('/app/:appId/edit/:packageId', async (req, res, next) => {
        const { appId, packageId } = req.params

        try {
            const key = getMemoryKey(req)
            const app = await client.GetApp(appId);
            if (packageId != app.devPackageId) {
                if (!app.packageVersions || !app.packageVersions.find(pv => pv.packageId == packageId)) {
                    throw new Error(`Attempted to edit package that doesn't exist: ${packageId}`)
                }
            }

            const memory = CLMemory.GetMemory(key)
            const updatedPackageVersions = await memory.BotState.SetEditingPackage(appId, packageId);
            res.send(updatedPackageVersions)

        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // Action
    //========================================================
    server.get('/app/:appId/action/:actionId', async (req, res, next) => {
        const { appId, actionId } = req.params
        const query = url.parse(req.url).query || ''

        try {
            const action = await client.GetAction(appId, actionId, query)
            res.send(action)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.post('/app/:appId/action', async (req, res, next) => {
        const { appId } = req.params

        try {
            const action: models.ActionBase = req.body
            const actionId = await client.AddAction(appId, action)
            res.send(actionId)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.put('/app/:appId/action/:actionId', async (req, res, next) => {
        const { appId } = req.params

        try {
            const action: models.ActionBase = req.body
            const deleteEditResponse = await client.EditAction(appId, action)
            res.send(deleteEditResponse)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Returns list of trainingDialogIds that are invalidated by the given changed action */
    server.post('/app/:appId/action/:actionId/editValidation', async (req, res, next) => {
        const { appId } = req.params

        try {
            const action: models.ActionBase = req.body
            const { packageId } = getQuery(req)
            if (!packageId) {
                res.status(400)
                res.send({ error: 'packageId query parameter must be provided' })
                return
            }

            const appDefinition = await client.GetAppSource(appId, packageId)

            // Replace the action with new one
            appDefinition.actions = replace(appDefinition.actions, action, a => a.actionId)

            const clRunner = CLRunner.Get(appId);
            const invalidTrainDialogIds = clRunner.validateTrainDialogs(appDefinition);

            res.send(invalidTrainDialogIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Delete action */
    server.delete('/app/:appId/action/:actionId', async (req, res, next) => {
        const { appId, actionId } = req.params

        try {
            const deleteEditResponse = await client.DeleteAction(appId, actionId)
            res.send(deleteEditResponse)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Returns list of trainDialogs invalidated by deleting the given action */
    server.get('/app/:appId/action/:actionId/deleteValidation', async (req, res, next) => {
        const { appId, actionId } = req.params

        try {
            const { packageId } = getQuery(req)
            const appDefinition = await client.GetAppSource(appId, packageId)

            // Remove the action
            appDefinition.actions = appDefinition.actions.filter(a => a.actionId != actionId)

            const clRunner = CLRunner.Get(appId)
            const invalidTrainDialogIds = clRunner.validateTrainDialogs(appDefinition)
            res.send(invalidTrainDialogIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/actions', async (req, res, next) => {
        const { appId } = req.params
        const query = url.parse(req.url).query || ''

        try {
            const actions = await client.GetActions(appId, query)
            res.send(actions)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/action', async (req, res, next) => {
        const { appId } = req.params
        const query = url.parse(req.url).query || ''

        try {
            const actions = await client.GetActionIds(appId, query)
            res.send(actions)
        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // Entities
    //========================================================

    server.get('/app/:appId/entityIds', async (req, res, next) => {
        const { appId } = req.params
        const query = url.parse(req.url).query || ''

        try {
            const actions = await client.GetEntityIds(appId, query)
            res.send(actions)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/entity/:entityId', async (req, res, next) => {
        const { appId, entityId } = req.params
        const query = url.parse(req.url).query || ''

        try {
            const entity = await client.GetEntity(appId, entityId, query)
            res.send(entity)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.post('/app/:appId/entity', async (req, res, next) => {
        const { appId } = req.params

        try {
            const entity: models.EntityBase = req.body
            const entityId = await client.AddEntity(appId, entity)
            res.send(entityId)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.put('/app/:appId/entity/:entityId', async (req, res, next) => {
        const { appId } = req.params

        try {
            const entity: models.EntityBase = req.body
            const entityId = await client.EditEntity(appId, entity)
            res.send(entityId)
        } catch (error) {
            HandleError(res, error)
        }
    })
    
    /** Returns list of trainingDialogIds that are invalidated by the given changed entity */
    server.post('/app/:appId/entity/:entityId/editValidation', async (req, res, next) => {
        const { appId } = req.params

        try {
            const entity: models.EntityBase = req.body
            const { packageId } = getQuery(req)
            const appDefinition = await client.GetAppSource(appId, packageId)
            
            // Replace the entity with new one
            appDefinition.entities = replace(appDefinition.entities, entity, e => e.entityId)

            const clRunner = CLRunner.Get(appId);
            const invalidTrainDialogIds = clRunner.validateTrainDialogs(appDefinition);
            res.send(invalidTrainDialogIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.delete('/app/:appId/entity/:entityId', async (req, res, next) => {
        const { appId, entityId } = req.params

        try {
            const deleteEditResponse = await client.DeleteEntity(appId, entityId)
            res.send(deleteEditResponse)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Returns list of trainDialogs invalidated by deleting the given entity */
    server.get('/app/:appId/entity/:entityId/deleteValidation', async (req, res, next) => {
        const { appId, entityId } = req.params

        try {
            const { packageId } = getQuery(req)
            const appDefinition = await client.GetAppSource(appId, packageId)

            // Remove the action
            appDefinition.entities = appDefinition.entities.filter(e => e.entityId != entityId)

            const clRunner = CLRunner.Get(appId)
            const invalidTrainDialogIds = clRunner.validateTrainDialogs(appDefinition)
            res.send(invalidTrainDialogIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/entities', async (req, res, next) => {
        const { appId } = req.params
        const query = url.parse(req.url).query || ''

        try {
            const entities = await client.GetEntities(appId, query)
            res.send(entities)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/entity', async (req, res, next) => {
        const { appId } = req.params
        const query = url.parse(req.url).query || ''

        try {
            const entityIds = await client.GetEntityIds(appId, query)
            res.send(entityIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // LogDialogs
    //========================================================
    server.get('/app/:appId/logdialog/:logDialogId', async (req, res, next) => {
        const { appId, logDialogId } = req.params

        try {
            const logDialog = await client.GetLogDialog(appId, logDialogId)
            res.send(logDialog)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.delete('/app/:appId/logdialog/:logDialogId', async (req, res, next) => {
        const { appId, logDialogId } = req.params

        try {
            await client.DeleteLogDialog(appId, logDialogId)
            res.sendStatus(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/logdialogs', async (req, res, next) => {
        const { appId } = req.params

        try {
            const { packageId } = getQuery(req)
            const packageIds = packageId.split(",")
            const logDialogs = await client.GetLogDialogs(appId, packageIds)
            res.send(logDialogs)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/logDialogIds', async (req, res, next) => {
        const { appId } = req.params

        try {
            const query = url.parse(req.url).query || ''
            const logDialogIds = await client.GetLogDialogIds(appId, query)
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
            const appId = req.params.appId
            const trainDialog: models.TrainDialog = req.body
            const trainDialogId = await client.AddTrainDialog(appId, trainDialog)
            res.send(trainDialogId)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.put('/app/:appId/traindialog/:trainDialogId', async (req, res, next) => {
        try {
            const { appId } = req.params
            const trainDialog: models.TrainDialog = req.body
            const trainDialogId = await client.EditTrainDialog(appId, trainDialog)
            res.send(trainDialogId)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/traindialog/:trainDialogId', async (req, res, next) => {
        try {
            const { appId, trainDialogId } = req.params
            const trainDialog = await client.GetTrainDialog(appId, trainDialogId)
            res.send(trainDialog)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.delete('/app/:appId/traindialog/:trainDialogId', async (req, res, next) => {
        try {
            const { appId, trainDialogId } = req.params
            await client.DeleteTrainDialog(appId, trainDialogId)
            res.sendStatus(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/traindialogs', async (req, res, next) => {
        const { appId } = req.params
        const query = url.parse(req.url).query || ''

        try {
            const trainDialogs = await client.GetTrainDialogs(appId, query)
            res.send(trainDialogs)
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.get('/app/:appId/trainDialogIds', async (req, res, next) => {
        const { appId } = req.params
        const query = url.parse(req.url).query || ''

        try {
            const trainDialogIds = await client.GetTrainDialogIds(appId, query)
            res.send(trainDialogIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** RUN EXTRACTOR: Runs entity extraction on a train dialog
     */
    server.put('/app/:appId/traindialog/:trainDialogId/extractor/:turnIndex', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const { appId, trainDialogId, turnIndex } = req.params
            const userInput: models.UserInput = req.body
            const extractResponse = await client.TrainDialogExtract(appId, trainDialogId, turnIndex, userInput)

            const memory = CLMemory.GetMemory(key)
            const memories = await memory.BotMemory.DumpMemory()
            const uiExtractResponse: models.UIExtractResponse = { extractResponse, memories }
            res.send(uiExtractResponse)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Create a new teach session based on the current train dialog starting at round turnIndex */
    server.post('/app/:appId/traindialog/:trainDialogId/branch/:turnIndex', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const query = getQuery(req)
            const { username, userid } = query
            console.warn(`CHECK query params for case sensitivity: `, query, username, userid)
            const { appId, trainDialogId, turnIndex } = req.params

            // Retrieve current train dialog
            const trainDialog = await client.GetTrainDialog(appId, trainDialogId, true)

            // Slice to length requested by user
            trainDialog.rounds = trainDialog.rounds.slice(0, turnIndex)

            // Get history and replay to put bot into last round
            const memory = CLMemory.GetMemory(key)

            const clRunner = CLRunner.Get(appId);
            const teachWithHistory = await clRunner.GetHistory(appId, trainDialog, username, userid, memory)
            if (!teachWithHistory) {
                res.status(500)
                res.send(new Error(`Could not find teach session history for given train dialog`))
                return
            }

            // Start teach session if replay of API was consistent
            if (teachWithHistory.replayErrors.length === 0) {
                // Start new teach session from the old train dialog
                const createTeachParams = models.ModelUtils.ToCreateTeachParams(trainDialog)
                const teachResponse = await client.StartTeach(appId, createTeachParams)

                // Start Session - with "true" to save the memory from the History
                await clRunner.InitSessionAsync(memory, teachResponse.teachId, null, null, { inTeach: true, isContinued: true })
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
            const key = getMemoryKey(req)
            const { appId } = req.params
            const sessionCreateParams: models.SessionCreateParams = req.body
            const sessionResponse = await client.StartSession(appId, sessionCreateParams)
            res.send(sessionResponse)

            const clRunner = CLRunner.Get(appId);
            const memory = CLMemory.GetMemory(key)
            memory.BotMemory.ClearAsync()
            
            clRunner.InitSessionAsync(memory, sessionResponse.sessionId, sessionResponse.logDialogId, null, { inTeach: false, isContinued: false })
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET SESSION : Retrieves information about the specified session */
    server.get('/app/:appId/session/:sessionId', async (req, res, next) => {
        try {
            const { appId, sessionId } = req.params
            const response = await client.GetSession(appId, sessionId)
            res.send(response)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** EXPIRE SESSION : Expires the current session (timeout) */
    server.put('/app/:appId/session/:sessionId', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const memory = CLMemory.GetMemory(key)
            const conversationId = await memory.BotState.GetConversationId();
            if (!conversationId) {
                // If conversation is empty
                return;
            }

            const curSessionId = await memory.BotState.GetSessionIdAndSetConversationId(conversationId);

            // Session may be a replacement for an expired one
            const uiSessionId = await memory.BotState.OrgSessionIdAsync(req.params.sessionId)

            if (curSessionId != uiSessionId) {
                throw new Error("Attempting to expire sessionId not in use")
            }

            // Force sesion to expire
            await memory.BotState.SetLastActive(0);
            res.sendStatus(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** END SESSION : End a session. */
    server.delete('/app/:appId/session/:sessionId', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const { appId, sessionId } = req.params

            // Session may be a replacement for an expired one
            const memory = CLMemory.GetMemory(key)
            const originalSessionId = await memory.BotState.OrgSessionIdAsync(sessionId)
            if (!originalSessionId) {
                throw new Error(`original session id not found for session id: ${sessionId}`)
            }
            const response = await client.EndSession(appId, originalSessionId)
            res.send(response)

            const clRunner = CLRunner.Get(appId);
            clRunner.EndSessionAsync(key, models.SessionEndState.OPEN)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET SESSIONS : Retrieves definitions of ALL open sessions */
    server.get('/app/:appId/sessions', async (req, res, next) => {
        try {
            const query = url.parse(req.url).query || ''
            const { appId } = req.params
            const sessions = await client.GetSessions(appId, query)
            res.send(sessions)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET SESSION IDS : Retrieves a list of session IDs */
    server.get('/app/:appId/session', async (req, res, next) => {
        try {
            const query = url.parse(req.url).query || ''
            const { appId } = req.params
            const sessionIds = await client.GetSessionIds(appId, query)
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
            const key = getMemoryKey(req)
            const { appId } = req.params
            const teachResponse = await client.StartTeach(appId, null)

            const clRunner = CLRunner.Get(appId);
            const memory = CLMemory.GetMemory(key)
            clRunner.InitSessionAsync(memory, teachResponse.teachId, null, null, { inTeach: true, isContinued: false })

            // Clear the memory
            await memory.BotMemory.ClearAsync()
            res.send(teachResponse)

        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Clear the bot's memory */
    server.delete('/app/:appId/botmemory', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            // Update Memory
            const memory = CLMemory.GetMemory(key)
            await memory.BotMemory.ClearAsync();
            res.sendStatus(200)

        } catch (error) {
            HandleError(res, error)
        }
    })

    /** START TEACH SESSION: Creates a new teaching session from existing train dialog */
    server.post('/app/:appId/teachwithhistory', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const appId = req.params.appId
            const { username: userName, userid: userId, ignoreLastExtract } = getQuery(req)
            const ignoreLastExtractBoolean = ignoreLastExtract === 'true'
            const trainDialog: models.TrainDialog = req.body

            // Get history and replay to put bot into last round
            const memory = CLMemory.GetMemory(key)

            const clRunner = CLRunner.Get(appId);
            const teachWithHistory = await clRunner.GetHistory(appId, trainDialog, userName, userId, memory, ignoreLastExtractBoolean)
            if (!teachWithHistory) {
                res.status(500)
                res.send(new Error(`Could not find teach session history for given train dialog`))
                return
            }

            // Start session if API returned consistent results during replay
            if (teachWithHistory.replayErrors.length === 0) {
                // Start new teach session from the old train dialog
                const createTeachParams = models.ModelUtils.ToCreateTeachParams(trainDialog)
                const teachResponse = await client.StartTeach(appId, createTeachParams)

                // Start Session - with "true" to save the memory from the History
                await clRunner.InitSessionAsync(memory, teachResponse.teachId, null, null, { inTeach: true, isContinued: true })
                teachWithHistory.teach = models.ModelUtils.ToTeach(teachResponse)

                // If last action wasn't terminal need to score
                if (teachWithHistory.dialogMode === models.DialogMode.Scorer) {

                    // Get entities from my memory
                    const filledEntities = await memory.BotMemory.FilledEntitiesAsync()
                    const scoreInput: models.ScoreInput = {
                        filledEntities,
                        context: {},
                        maskedActions: []
                    }
                    teachWithHistory.scoreInput = scoreInput
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
            const { appId, teachId } = req.params
            const teach = await client.GetTeach(appId, teachId)
            res.send(teach)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** INIT MEMORY: Sets initial value for BotMemory at start of Teach Session */
    server.put('/app/:appId/teach/:teachId/initmemory', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const filledEntityMap = req.body as models.FilledEntityMap
            const botMemory = CLMemory.GetMemory(key).BotMemory

            await botMemory.RestoreFromMapAsync(filledEntityMap)

            const memories = await botMemory.DumpMemory();
            res.send(memories)
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
            const key = getMemoryKey(req)
            const { appId, teachId } = req.params
            const userInput: models.UserInput = req.body

            // If a form text could be null
            if (!userInput.text) {
                userInput.text = '  '
            }
            const extractResponse = await client.TeachExtract(appId, teachId, userInput)

            const memory = CLMemory.GetMemory(key)
            const memories = await memory.BotMemory.DumpMemory()
            const uiExtractResponse: models.UIExtractResponse = { extractResponse, memories }
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
            const key = getMemoryKey(req)
            const { appId, teachId } = req.params
            const uiScoreInput: models.UIScoreInput = req.body
            const memory = CLMemory.GetMemory(key)

            // There will be no extraction step if performing a 2nd scorer round after a non-termial action
            if (uiScoreInput.trainExtractorStep) {
                // Send teach feedback;
                await client.TeachExtractFeedback(appId, teachId, uiScoreInput.trainExtractorStep)
            }

            // Call LUIS callback to get scoreInput
            const extractResponse = uiScoreInput.extractResponse
            const clRunner = CLRunner.Get(appId);
            const scoreInput = await clRunner.CallEntityDetectionCallback(
                extractResponse.text,
                extractResponse.predictedEntities,
                memory,
                extractResponse.definitions.entities
            )

            // Get score response
            const scoreResponse = await client.TeachScore(appId, teachId, scoreInput)
            const memories = await memory.BotMemory.DumpMemory()
            const uiScoreResponse: models.UIScoreResponse = { scoreInput, scoreResponse, memories }
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
            const key = getMemoryKey(req)
            const { appId, teachId } = req.params
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
            const key = getMemoryKey(req)
            const { appId, teachId } = req.params
            const uiTrainScorerStep: models.UITrainScorerStep = req.body

            // Save scored action and remove from service call
            const scoredAction = uiTrainScorerStep.trainScorerStep.scoredAction
            if (!scoredAction) {
                throw new Error(`trainScorerStep.scoredAction must be defined.`)
            }
            delete uiTrainScorerStep.trainScorerStep.scoredAction

            const teachResponse = await client.TeachScoreFeedback(appId, teachId, uiTrainScorerStep.trainScorerStep)

            const memory = CLMemory.GetMemory(key)

            // Now send the trained intent
            const intent = {
                scoredAction: scoredAction,
                clEntities: uiTrainScorerStep.entities,
                memory: memory,
                inTeach: true
            } as CLRecognizerResult

            const clRunner = CLRunner.Get(appId);
            await clRunner.SendIntent(intent, true)

            const memories = await memory.BotMemory.DumpMemory()
            const isEndTask = scoredAction.actionType === models.ActionTypes.END_SESSION
            const uiPostScoreResponse: models.UIPostScoreResponse = { teachResponse, memories, isEndTask }
            res.send(uiPostScoreResponse)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /**
     * END TEACH: Ends a teach.
     * For Teach sessions, does NOT delete the associated trainDialog.
     * To delete the associated trainDialog, call DELETE on the trainDialog.
     */
    server.delete('/app/:appId/teach/:teachId', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const { appId, teachId } = req.params
            const { save } = getQuery(req)
            const saveQuery = save ? `saveDialog=${save}` : ''
            const response = await client.EndTeach(appId, teachId, saveQuery)
            res.send(response)

            const clRunner = CLRunner.Get(appId);
            clRunner.EndSessionAsync(key, models.SessionEndState.OPEN)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET TEACH SESSIONS: Retrieves definitions of ALL open teach sessions */
    server.get('/app/:appId/teaches', async (req, res, next) => {
        try {
            const query = url.parse(req.url).query || ''
            const { appId } = req.params
            const teaches = await client.GetTeaches(appId, query)
            res.send(teaches)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** GET TEACH SESSION IDS: Retrieves a list of teach session IDs */
    server.get('/app/:appId/teach', async (req, res, next) => {
        try {
            const query = url.parse(req.url).query || ''
            const appId = req.params.appId
            const teachIds = await client.GetTeachIds(appId, query)
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
            const key = getMemoryKey(req)
            const appId = req.params.appId
            const { username: userName, userid: userId } = getQuery(req)
            const trainDialog: models.TrainDialog = req.body

            const memory = CLMemory.GetMemory(key)
            const clRunner = CLRunner.Get(appId);
            const teachWithHistory = await clRunner.GetHistory(appId, trainDialog, userName, userId, memory)

            // Clear bot memory generated with this
            memory.BotMemory.ClearAsync();
            
            if (teachWithHistory) {
                res.send(teachWithHistory)
            }
            else {
                res.sendStatus(204)
            }
        } catch (error) {
            HandleError(res, error)
        }
    })

    server.post('/app/:appId/teach/:teachId/undo', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const appId = req.params.appId
            const { username: userName, userid: userId, popround: popRound } = getQuery(req)
            const teach: models.Teach = req.body

            // Retrieve current train dialog
            const trainDialog = await client.GetTrainDialog(appId, teach.trainDialogId, true)

            // Remove last round
            if (popRound == 'true') {
                trainDialog.rounds.pop()
            }

            // Get memory and store a backup in case the undo fails
            const memory = CLMemory.GetMemory(key)
            const memoryBackup = await memory.BotMemory.FilledEntityMap()

            // Get history and replay to put bot into last round
            const clRunner = CLRunner.Get(appId);
            const teachWithHistory = await clRunner.GetHistory(appId, trainDialog, userName, userId, memory)
            if (!teachWithHistory) {
                throw new Error(`Attempted to undo last action of teach session, but could not get session history`)
            }

            // If APIs returned same values during replay
            if (teachWithHistory.replayErrors.length === 0) {
                // Delete existing train dialog (don't await)
                client.EndTeach(appId, teach.teachId, `saveDialog=false`)

                // Start new teach session from the previous trainDialog
                const createTeachParams = models.ModelUtils.ToCreateTeachParams(trainDialog)
                const teachResponse = await client.StartTeach(appId, createTeachParams)

                // Start Sesion - with "true" to save the memory from the History
                await clRunner.InitSessionAsync(memory, teachResponse.teachId, null, null, { inTeach: true, isContinued: true })
                 teachWithHistory.teach = models.ModelUtils.ToTeach(teachResponse)
            } else {
                // Failed, so restore the old memory
                await memory.BotMemory.RestoreFromMapAsync(memoryBackup)
            }
            res.send(teachWithHistory)
        } catch (error) {
            HandleError(res, error)
        }
    })

    return server
}

function getMemoryKey (req: express.Request): string {
    const key = req.header(models.MEMORY_KEY_HEADER_NAME)
    if (!key) {
        throw new Error(`Header ${models.MEMORY_KEY_HEADER_NAME} must be provided. Url: ${req.url}`)
    }

    return key
}

function getQuery (req: express.Request): any {
    return url.parse(req.url, true).query || {}
}

export default addSdkRoutes

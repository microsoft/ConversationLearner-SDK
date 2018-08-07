/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as express from 'express'
import * as url from 'url'
import { CLDebug } from '../CLDebug'
import { CLClient, ICLClientOptions } from '../CLClient'
import { CLRunner, SessionStartFlags, InternalCallback } from '../CLRunner'
import { ConversationLearner } from '../ConversationLearner'
import { CLMemory } from '../CLMemory'
import { CLRecognizerResult } from '../CLRecognizeResult'
import { TemplateProvider } from '../TemplateProvider'
import { replace, isSDKOld, CL_DEVELOPER } from '../Utils'
import { BrowserSlot } from '../Memory/BrowserSlot'
import * as Request from 'request'
import * as XMLDom from 'xmldom'
import * as models from '@conversationlearner/models'
import * as crypto from 'crypto'
import * as proxy from 'http-proxy-middleware'
import * as constants from '../constants'
import * as bodyParser from 'body-parser'
import * as cors from 'cors'

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

const statusEndpoint = "https://blisstorage.blob.core.windows.net/status/status.json";
const versionEndpoint = "https://blisstorage.blob.core.windows.net/version/version.json";

const getBanner = (source: string) : Promise<models.Banner | null> => {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            uri: source,
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

export const getRouter = (client: CLClient, options: ICLClientOptions): express.Router => {
    const router = express.Router({ caseSensitive: false })
    router.use(cors())
    router.use(bodyParser.json())

    router.get('/', (req, res, next) => {
        res.status(200).send({
            message: `Conversation Learner SDK: ${new Date().toJSON()}`
        })
    })

    //========================================================
    // State
    //=======================================================
    /** Sets the current active application */
    router.put('/state/app', async (req, res, next) => {
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
    router.put('/state/conversationId', async (req, res, next) => {
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
    router.get('/bot', async (req, res, next) => {
        try {
            const { browserId, appId } = getQuery(req)
            const clRunner = CLRunner.GetRunnerForUI(appId)
            const validationErrors = clRunner.clClient.ValidationErrors();

            // Generate id
            const browserSlot = await BrowserSlot.GetSlot(browserId);
            const key = ConversationLearner.options!.LUIS_AUTHORING_KEY!
            const hashedKey = key ? crypto.createHash('sha256').update(key).digest('hex') : ""
            const id = `${browserSlot}-${hashedKey}`

            // Retrieve any status message
            let banner = await getBanner(statusEndpoint);
            
            // If no status message, check if version update message is needed
            if (!banner) {
                // Display version banner if SDK is obsolete
                let versionBanner = await getBanner(versionEndpoint)
                if (versionBanner && versionBanner.sdkversion) {
                    const isOld = await isSDKOld(versionBanner.sdkversion)
                    if (isOld) {
                        banner = versionBanner
                    }
                }
            }

            const convertInternalCallbackToCallback = <T>(c: InternalCallback<T>): models.Callback => {
                const { logic, render, ...callback } = c
                return callback
            }
            const botInfo: models.BotInfo = {
                user: {
                    // We keep track that the editing  UI is running by putting this as the name of the user
                    // Can't check localhost as can be running localhost and not UI
                    name: CL_DEVELOPER,
                    id: id
                },
                callbacks: Object.values(clRunner.callbacks).map(convertInternalCallbackToCallback),
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
    /** Create a new application */
    router.post('/app', async (req, res, next) => {
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

    /** Archives an existing application */
    router.delete('/app/:appId', async (req, res, next) => {
        const { appId } = req.params

        try {
            const key = getMemoryKey(req)
            await client.ArchiveApp(appId)

            // Did I delete my loaded app, if so clear my state
            const memory = CLMemory.GetMemory(key)
            const app = await memory.BotState.GetApp()
            if (app && app.appId === appId) {
                await memory.SetAppAsync(null)

                const clRunner = CLRunner.GetRunnerForUI(appId);
                await clRunner.EndSessionAsync(key, models.SessionEndState.OPEN);
            }
            res.sendStatus(200)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Retrieves a list of (active) applications */
    router.get('/apps', async (req, res, next) => {
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
    router.post('/apps/copy', async (req, res, next) => {
        const { srcUserId, destUserId, appId } = getQuery(req)
        const clRunner = CLRunner.GetRunnerForUI(appId)
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

    /** Creates a new package tag for an app */
    router.put('/app/:appId/publish', async (req, res, next) => {
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

    /** Sets which app package is being edited */
    router.post('/app/:appId/edit/:packageId', async (req, res, next) => {
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
    /** Returns list of trainingDialogIds that are invalidated by the given changed action */
    router.post('/app/:appId/action/:actionId/editValidation', async (req, res, next) => {
        const { appId, actionId } = req.params

        try {
            const action: models.ActionBase = req.body
            const { packageId } = getQuery(req)
            if (!packageId) {
                res.status(400)
                res.send({ error: 'packageId query parameter must be provided' })
                return
            }

            if (actionId !== action.actionId) {
                res.status(400)
                res.send(new Error(`ActionId in body: ${action.actionId} does not match id from URI: ${actionId}`))
                return
            }

            const appDefinition = await client.GetAppSource(appId, packageId)

            // Replace the action with new one
            appDefinition.actions = replace(appDefinition.actions, action, a => a.actionId)

            const clRunner = CLRunner.GetRunnerForUI(appId);
            const invalidTrainDialogIds = clRunner.validateTrainDialogs(appDefinition);

            res.send(invalidTrainDialogIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Returns list of trainDialogs invalidated by deleting the given action */
    router.get('/app/:appId/action/:actionId/deleteValidation', async (req, res, next) => {
        const { appId, actionId } = req.params

        try {
            const { packageId } = getQuery(req)
            const appDefinition = await client.GetAppSource(appId, packageId)

            // Remove the action
            appDefinition.actions = appDefinition.actions.filter(a => a.actionId != actionId)

            const clRunner = CLRunner.GetRunnerForUI(appId)
            const invalidTrainDialogIds = clRunner.validateTrainDialogs(appDefinition)
            res.send(invalidTrainDialogIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // Entities
    //========================================================
    /** Returns list of trainingDialogIds that are invalidated by the given changed entity */
    router.post('/app/:appId/entity/:entityId/editValidation', async (req, res, next) => {
        const { appId } = req.params

        try {
            const entity: models.EntityBase = req.body
            const { packageId } = getQuery(req)
            const appDefinition = await client.GetAppSource(appId, packageId)
            
            // Replace the entity with new one
            appDefinition.entities = replace(appDefinition.entities, entity, e => e.entityId)

            const clRunner = CLRunner.GetRunnerForUI(appId);
            const invalidTrainDialogIds = clRunner.validateTrainDialogs(appDefinition);
            res.send(invalidTrainDialogIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Returns list of trainDialogs invalidated by deleting the given entity */
    router.get('/app/:appId/entity/:entityId/deleteValidation', async (req, res, next) => {
        const { appId, entityId } = req.params

        try {
            const { packageId } = getQuery(req)
            const appDefinition = await client.GetAppSource(appId, packageId)

            // Remove the action
            appDefinition.entities = appDefinition.entities.filter(e => e.entityId != entityId)

            const clRunner = CLRunner.GetRunnerForUI(appId)
            const invalidTrainDialogIds = clRunner.validateTrainDialogs(appDefinition)
            res.send(invalidTrainDialogIds)
        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // LogDialogs
    //========================================================
    router.get('/app/:appId/logdialogs', async (req, res, next) => {
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

    //========================================================
    // TrainDialogs
    //========================================================
    /** 
     * RUN EXTRACTOR: Runs entity extraction on a train dialog
     */
    router.put('/app/:appId/traindialog/:trainDialogId/extractor/:turnIndex', async (req, res, next) => {
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
    router.post('/app/:appId/traindialog/:trainDialogId/branch/:turnIndex', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const { username: userName, userid: userId } = getQuery(req)
            const { appId, trainDialogId, turnIndex } = req.params
            const trainDialog = await client.GetTrainDialog(appId, trainDialogId, true)

            // Slice to length requested by user
            trainDialog.rounds = trainDialog.rounds.slice(0, turnIndex)

            // Get history and replay to put bot into last round
            const memory = CLMemory.GetMemory(key)
            const clRunner = CLRunner.GetRunnerForUI(appId);
            const teachWithHistory = await clRunner.GetHistory(appId, trainDialog, userName, userId, memory)
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
                await clRunner.InitSessionAsync(memory, teachResponse.teachId, null, null, SessionStartFlags.IN_TEACH | SessionStartFlags.IS_EDIT_CONTINUE)
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
    router.post('/app/:appId/session', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const { appId } = req.params
            const sessionCreateParams: models.SessionCreateParams = req.body
            const sessionResponse = await client.StartSession(appId, sessionCreateParams)
            res.send(sessionResponse)

            const clRunner = CLRunner.GetRunnerForUI(appId);
            const memory = CLMemory.GetMemory(key)
            memory.BotMemory.ClearAsync()
            
            clRunner.InitSessionAsync(memory, sessionResponse.sessionId, sessionResponse.logDialogId, null, SessionStartFlags.NONE)
        } catch (error) {
            HandleError(res, error)
        }
    })

    /** EXPIRE SESSION : Expires the current session (timeout) */
    router.put('/app/:appId/session/:sessionId', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const memory = CLMemory.GetMemory(key)
            const conversationId = await memory.BotState.GetConversationId();
            if (!conversationId) {
                // If conversation is empty
                return
            }

            // Check that sessions match
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
    router.delete('/app/:appId/session/:sessionId', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const { appId, sessionId } = req.params

            // Session may be a replacement for an expired one
            const memory = CLMemory.GetMemory(key)
            const originalSessionId = await memory.BotState.OrgSessionIdAsync(sessionId)

            let response : string
            if (!originalSessionId) {
                // This can happen when a LogDialog End_Session Action is called and the 
                // user subsequently presses the DONE button
                response = await client.EndSession(appId, sessionId)

                // TODO: Once log dialog interface goes away, throw error here instead
                //throw new Error(`original session id not found for session id: ${sessionId}`)
            } else {
                 response = await client.EndSession(appId, originalSessionId)
            }

            res.send(response)

            const clRunner = CLRunner.GetRunnerForUI(appId);
            clRunner.EndSessionAsync(key, models.SessionEndState.OPEN)
        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // Teach
    //========================================================

    /** START TEACH SESSION: Creates a new teaching session and a corresponding trainDialog */
    router.post('/app/:appId/teach', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const { appId } = req.params
            const teachResponse = await client.StartTeach(appId, null)

            const clRunner = CLRunner.GetRunnerForUI(appId);
            const memory = CLMemory.GetMemory(key)
            clRunner.InitSessionAsync(memory, teachResponse.teachId, null, null, SessionStartFlags.IN_TEACH)

            // Clear the memory
            await memory.BotMemory.ClearAsync()
            res.send(teachResponse)

        } catch (error) {
            HandleError(res, error)
        }
    })

    /** Clear the bot's memory */
    router.delete('/app/:appId/botmemory', async (req, res, next) => {
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
    router.post('/app/:appId/teachwithhistory', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const appId = req.params.appId
            const { username: userName, userid: userId, ignoreLastExtract } = getQuery(req)
            const ignoreLastExtractBoolean = ignoreLastExtract === 'true'
            const trainDialog: models.TrainDialog = req.body

            // Get history and replay to put bot into last round
            const memory = CLMemory.GetMemory(key)

            const clRunner = CLRunner.GetRunnerForUI(appId);
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
                await clRunner.InitSessionAsync(memory, teachResponse.teachId, null, null, SessionStartFlags.IN_TEACH | SessionStartFlags.IS_EDIT_CONTINUE)
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

    /** INIT MEMORY: Sets initial value for BotMemory at start of Teach Session */
    router.put('/app/:appId/teach/:teachId/initmemory', async (req, res, next) => {
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
    router.put('/app/:appId/teach/:teachId/extractor', async (req, res, next) => {
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
    router.put('/app/:appId/teach/:teachId/scorer', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const { appId, teachId } = req.params
            const uiScoreInput: models.UIScoreInput = req.body
            const memory = CLMemory.GetMemory(key)

            // There will be no extraction step if performing a 2nd scorer round after a non-terminal action
            if (uiScoreInput.trainExtractorStep) {
                // Send teach feedback;
                await client.TeachExtractFeedback(appId, teachId, uiScoreInput.trainExtractorStep)
            }

            // Call LUIS callback to get scoreInput
            const extractResponse = uiScoreInput.extractResponse
            const clRunner = CLRunner.GetRunnerForUI(appId);
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
    router.put('/app/:appId/teach/:teachId/rescore', async (req, res, next) => {
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
    router.post('/app/:appId/teach/:teachId/scorer', async (req, res, next) => {
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

            const memory = CLMemory.GetMemory(key)

            // Now send the trained intent
            const intent = {
                scoredAction: scoredAction,
                clEntities: uiTrainScorerStep.entities,
                memory: memory,
                inTeach: true
            } as CLRecognizerResult

            const clRunner = CLRunner.GetRunnerForUI(appId);
            const actionResult = await clRunner.SendIntent(intent, true)

            // Set logicResult on scorer step
            if (actionResult) {
                uiTrainScorerStep.trainScorerStep.logicResult = actionResult.logicResult
            }
            const teachResponse = await client.TeachScoreFeedback(appId, teachId, uiTrainScorerStep.trainScorerStep)

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
    router.delete('/app/:appId/teach/:teachId', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const { appId, teachId } = req.params
            const { save } = getQuery(req)
            const saveQuery = save ? `saveDialog=${save}` : ''
            const response = await client.EndTeach(appId, teachId, saveQuery)
            res.send(response)

            const clRunner = CLRunner.GetRunnerForUI(appId);
            clRunner.EndSessionAsync(key, models.SessionEndState.OPEN)
        } catch (error) {
            HandleError(res, error)
        }
    })

    //========================================================
    // Replay
    //========================================================

    router.post('/app/:appId/history', async (req, res, next) => {
        try {
            const key = getMemoryKey(req)
            const appId = req.params.appId
            const { username: userName, userid: userId } = getQuery(req)
            const trainDialog: models.TrainDialog = req.body

            const memory = CLMemory.GetMemory(key)
            const clRunner = CLRunner.GetRunnerForUI(appId);
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

    router.post('/app/:appId/teach/:teachId/undo', async (req, res, next) => {
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
            const clRunner = CLRunner.GetRunnerForUI(appId);
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
                await clRunner.InitSessionAsync(memory, teachResponse.teachId, null, null, SessionStartFlags.IN_TEACH | SessionStartFlags.IS_EDIT_CONTINUE)
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

    const httpProxy = proxy({
        target: options.CONVERSATION_LEARNER_SERVICE_URI,
        changeOrigin: true,
        logLevel: 'info',
        pathRewrite: {
            '^/sdk': '/'
        },
        onProxyReq: (proxyReq, req, res) => {
            proxyReq.setHeader(constants.luisAuthoringKeyHeader, options.LUIS_AUTHORING_KEY || '')
            proxyReq.setHeader(constants.luisSubscriptionKeyHeader, options.LUIS_SUBSCRIPTION_KEY || '')
            proxyReq.setHeader(constants.apimSubscriptionIdHeader, options.LUIS_AUTHORING_KEY || '')
            proxyReq.setHeader(constants.apimSubscriptionKeyHeader, options.APIM_SUBSCRIPTION_KEY || '')

            /**
             * TODO: Find more elegant solution with middleware ordering.
             * Currently there is conflict of interest.  For the custom routes we define, we want the body parsed
             * so we need bodyParser.json() middleware above it in the pipeline; however, when bodyParser is above/before
             * the http-proxy-middleware then it can't properly stream the body through.
             * 
             * This code explicitly re-streams the data by calling .write()
             * 
             * Ideally we could find a way to only use bodyParser.json() on our custom routes so it's no in the pipeline above
             * the proxy
             */
            const anyReq: any = req
            if (anyReq.body) {
                let bodyData = JSON.stringify(anyReq.body)
                // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
                proxyReq.setHeader('Content-Type','application/json')
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))
                // stream the content
                proxyReq.write(bodyData)
            }
        }
    })

    router.use(httpProxy)

    return router
}

function getMemoryKey (req: express.Request, throwError: boolean = true): string {
    const key = req.header(models.MEMORY_KEY_HEADER_NAME)
    if (!key) {
        throw new Error(`Header ${models.MEMORY_KEY_HEADER_NAME} must be provided. Url: ${req.url}`)
    }

    return key
}

function getQuery (req: express.Request): any {
    return url.parse(req.url, true).query || {}
}

export default getRouter

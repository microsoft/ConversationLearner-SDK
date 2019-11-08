/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/**
 * This is just a convenience for @conversationlearner/sdk developers to test the UI
 */
import uiRouter from './uiRouter'
import * as express from 'express'

const app = express()
app.use(uiRouter)

const port = 5053
const listener = app.listen(port, () => {
    const addressInfo = listener.address()
    console.log(`Navigate to http://localhost:${typeof addressInfo === 'string' ? addressInfo : addressInfo?.port}/ui to view Conversation Learner administration application.`)
}).on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
        console.log(`ERROR: The UI is already running or the port (${port}) is in use by another process`)
        return
    }

    throw error
});
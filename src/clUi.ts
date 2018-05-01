/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as express from 'express'
import * as http from 'http'
import * as clUI from '@conversationlearner/ui'

export default function(port: number = 5050): { app: express.Express; listener: http.Server } {
    console.log(`@conversationlearner/ui directory path: `, clUI.directoryPath)
    console.log(`@conversationlearner/ui default file path: `, clUI.defaultFilePath)

    const app = express()
    app.use(express.static(clUI.directoryPath)).use((req, res) => res.sendFile(clUI.defaultFilePath))

    const listener = app.listen(port, () =>
        console.log(`Navigate to http://localhost:${listener.address().port} to view Conversation Learner administration application.`)
    )

    return {
        app,
        listener
    }
}

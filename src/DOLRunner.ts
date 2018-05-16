/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as directline from 'offline-directline'
import * as express from 'express'
export function startDirectOffLineServer(serviceUrl: string, botUrl: string) {
    console.log(`Starting DOL (Direct Offline):`)
    console.log(`- serviceUrl: ${serviceUrl}`)
    console.log(`- botUrl: ${botUrl}`)

    const app = express()
    
    // Don't require converation initialization.  This allows
    // UI to continue conversation even after bot restart
    let requireConversationInit = false
    directline.initializeRoutes(app, serviceUrl, botUrl, requireConversationInit)
}

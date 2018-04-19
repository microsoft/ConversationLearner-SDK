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
    directline.initializeRoutes(app, serviceUrl, botUrl)
}

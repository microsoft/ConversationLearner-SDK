import * as directline from 'offline-directline'
import * as express from 'express'
export function startDirectOffLineServer(serviceUrl: string, botUrl: string) {
    console.log(`Starting DOL (Direct Offline):`)
    console.log(`- serviceUrl: ${serviceUrl}`)
    console.log(`- botUrl: ${botUrl}`)

    const app = express()
    directline.initializeRoutes(app, serviceUrl, botUrl)
}

import * as directline from "offline-directline";
import * as express from 'express';
 
export function InitDOLRunner() {
    const serviceUrl = process.env.DOL_SERVICE_URL || "http://127.0.0.1:3000"
    const botUrl = process.env.DOL_BOT_URL || "http://127.0.0.1:3978/api/messages"
    console.log(`Starting DOL (Direct Offline):`)
    console.log(`- serviceUrl: ${serviceUrl}`)
    console.log(`- botUrl: ${botUrl}`)

    const app = express()
    directline.initializeRoutes(app, serviceUrl, botUrl)
}
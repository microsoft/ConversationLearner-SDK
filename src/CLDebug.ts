/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import { Utils } from './Utils'
import * as BB from 'botbuilder'

export class CLDebug {
    public static adapter: BB.BotAdapter
    public static conversationReference: Partial<BB.ConversationReference>
    public static cache: string = ''
    public static enabled: boolean
    public static verbose: boolean = true
    public static logging: string = '' // OPTIONS: "messagequeue client flow memory memverbose";

    public static InitLogger(adapter: BB.BotAdapter, conversationReference: Partial<BB.ConversationReference>) {
        CLDebug.adapter = adapter
        CLDebug.conversationReference = conversationReference;
    }

    private static async SendCache() {
        if (CLDebug.adapter && CLDebug.cache) {

            await CLDebug.adapter.continueConversation(CLDebug.conversationReference, async (context) => {
                await context.sendActivity(this.cache)
            });
            CLDebug.cache = '';
        }
    }

    public static Log(text: string, filter?: string) {
        if (!filter || CLDebug.logging.indexOf(filter) >= 0) {
            console.log(text)

            if (CLDebug.enabled) {
                CLDebug.cache += (CLDebug.cache ? '\n\n' : '') + text
            }
            CLDebug.SendCache()
        }
    }

    public static LogRequest(method: string, path: string, payload: any) {
        if (CLDebug.logging.includes('client')) {
            let message = `${method} //${path}`
            const formattedBody = payload.body ? JSON.stringify(payload.body, null, '  ') : ''
            if (formattedBody.length > 0) {
                message = `${message}
                    
${formattedBody}
                `
            }

            console.log(message)

            if (CLDebug.enabled) {
                CLDebug.cache += (CLDebug.cache ? '\n\n' : '') + message
            }
            CLDebug.SendCache()
        }
    }

    public static Error(error: any, context: string = ''): string {
        let text = `ERROR: ${error ? Utils.ErrorString(error, context) : 'No details'}`
        CLDebug.Log(text)
        return text
    }

    public static Verbose(text: string) {
        if (CLDebug.verbose) {
            CLDebug.Log(`${text}`)
        }
    }

    public static LogObject(obj: any) {
        CLDebug.Log(JSON.stringify(obj))
    }
}

/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import { Utils } from './Utils'
import * as BB from 'botbuilder'

export enum DebugType {
    Client = 1 << 0,
    ClientBody = 1 << 1,
    MessageQueue = 1 << 2,
    Memory = 1 << 3,
    MemVerbose = 1 << 4
}

export class CLDebug {
    public static adapter: BB.BotAdapter
    public static conversationReference: Partial<BB.ConversationReference>
    public static cache: string = ''
    public static enabled: boolean
    public static verbose: boolean = true
    public static debugType: DebugType = DebugType.Client | DebugType.ClientBody

    public static InitLogger(adapter: BB.BotAdapter, conversationReference: Partial<BB.ConversationReference>) {
        CLDebug.adapter = adapter
        CLDebug.conversationReference = conversationReference;
    }

    private static HasDebugType(debugType: DebugType) : boolean {
        return (debugType & this.debugType) === debugType
    }
    private static async SendCache() {
        if (CLDebug.adapter && CLDebug.cache) {

            await CLDebug.adapter.continueConversation(CLDebug.conversationReference, async (context) => {
                await context.sendActivity(this.cache)
            });
            CLDebug.cache = '';
        }
    }

    public static Log(text: string, filter?: DebugType) {
        if (!filter || this.HasDebugType(filter)) {
            console.log(text)

            if (CLDebug.enabled) {
                CLDebug.cache += (CLDebug.cache ? '\n\n' : '') + text
            }
            CLDebug.SendCache()
        }
    }

    public static LogRequest(method: string, path: string, payload: any) {
        if (this.HasDebugType(DebugType.Client)) {

            // Ignore training status messages
            if (path.indexOf('trainingstatus') > 0) {
                return
            }

            let message = `${method} //${path}`

            if (this.HasDebugType(DebugType.ClientBody)) {
                const formattedBody = payload.body ? JSON.stringify(payload.body, null, '  ') : ''
                if (formattedBody.length > 0) {
                    message = `${message}\n\n${formattedBody}`
                }
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

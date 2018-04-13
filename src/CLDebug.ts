import { Utils } from './Utils'

export class CLDebug {
    public static botContext: BotContext
    public static cache: string = ''
    public static enabled: boolean
    public static verbose: boolean = true
    public static logging: string = 'client' // OPTIONS: "messagequeue client flow memory memverbose";

    public static InitLogger(botContext: BotContext) {
        CLDebug.botContext = botContext
    }

    private static SendCache() {
        if (CLDebug.botContext && CLDebug.cache) {
            CLDebug.botContext.bot.createContext(CLDebug.botContext.conversationReference, context => {
                context.reply(this.cache)
            })
            CLDebug.cache = ''
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

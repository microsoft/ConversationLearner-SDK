import { Utils } from './Utils'

export class BlisDebug {
    public static botContext: BotContext
    public static cache: string = ''
    public static enabled: boolean
    public static verbose: boolean = true
    public static logging: string = '' // OPTIONS: "client flow memory memverbose";

    public static InitLogger(botContext: BotContext) {
        this.botContext = botContext
    }

    private static SendCache() {
        if (this.botContext && this.cache) {
            this.botContext.bot.createContext(this.botContext.conversationReference, context => {
                context.reply(this.cache)
            })
            this.cache = ''
        }
    }

    public static Log(text: string, filter?: string) {
        if (!filter || this.logging.indexOf(filter) >= 0) {
            console.log(text)

            if (this.enabled) {
                this.cache += (this.cache ? '\n\n' : '') + text
            }
            this.SendCache()
        }
    }

    public static LogRequest(method: string, path: string, payload: any) {
        if (this.logging.includes('client')) {
            let message = `${method} //${path}`
            const formattedBody = payload.body ? JSON.stringify(payload.body, null, '  ') : ''
            if (formattedBody.length > 0) {
                message = `${message}
                    
${formattedBody}
                `
            }

            console.log(message)

            if (this.enabled) {
                this.cache += (this.cache ? '\n\n' : '') + message
            }
            this.SendCache()
        }
    }

    public static Error(error: any, context: string = ''): string {
        let text = `ERROR: ${error ? Utils.ErrorString(error, context) : 'No details'}`
        BlisDebug.Log(text)
        return text
    }

    public static Verbose(text: string) {
        if (this.verbose) {
            BlisDebug.Log(`${text}`)
        }
    }

    public static LogObject(obj: any) {
        this.Log(JSON.stringify(obj))
    }
}

import * as BB from 'botbuilder-core';
import { Utils } from './Utils';

export class BlisDebug {

    public static bot : BB.Bot;
    public static address : any;
    public static cache : string = "";
    public static enabled : boolean;
    public static verbose : boolean = true;
    public static logging : string = "memory client"; // OPTIONS: "client flow memory memverbose";

    public static InitLogger(bot : BB.Bot)
    {
        this.bot = bot;
    }
    
    public static SetAddress(address : any)
    {
        this.address = address;
        this.SendCache();
    }  
 
    private static SendCache() {
        if (this.bot && this.address && this.cache)
        {/*LARSTODO
            var msg = new builder.Message().address(this.address);
            msg.text(this.cache);
            this.cache = "";
            this.bot.post(msg);*/
        }
    }

     public static Log(text : string, filter? : string) {

        if (!filter || this.logging.indexOf(filter) >=0)
        {
            console.log(text);
            
            if (this.enabled)
            {
                this.cache += (this.cache ? "\n\n" : "") + text;
            }
            this.SendCache();
        }
    }

    public static LogRequest(method: string, path: string, payload: any) {
        if (this.logging.includes("client")) {
            let message = `${method} //${path}`
            const formattedBody = payload.body ? JSON.stringify(payload.body, null, '  ') : ''
            if (formattedBody.length > 0) {
                message = `${message}
                    
${formattedBody}
                `
            }

            console.log(message)

            if (this.enabled) {
                this.cache += (this.cache ? "\n\n" : "") + message
            }
            this.SendCache()
        }
    }

    public static Error(error: any, context: string = "") : string {
        let text = `ERROR: ${error ? Utils.ErrorString(error, context) : "No details"}`;
        BlisDebug.Log(text);
        return text;
    }

    public static Verbose(text : string) {
        if (this.verbose)
        {
            BlisDebug.Log(`${text}`);
        }
    }

    public static LogObject(obj : any) {
        this.Log(JSON.stringify(obj));
    }
}

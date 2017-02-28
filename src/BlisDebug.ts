import * as builder from 'botbuilder';

export class BlisDebug {

    public static bot : any;
    public static address : any;
    public static cache : string = "";
    public static enabled : boolean;

    public static InitLogger(bot : builder.UniversalBot)
    {
        this.bot = bot;
    }
    
    public static SetAddress(address : any)
    {
        this.address = address;
        this.SendCache();
    }

    public static Toggle() : boolean
    {
        this.enabled = !this.enabled;
        if (!this.enabled)
        {
            this.cache = "";
        }
        return this.enabled;
    }    
 
    private static SendCache() {
        if (this.bot && this.address && this.cache)
        {
            var msg = new builder.Message().address(this.address);
            msg.text(this.cache);
            this.cache = "";
            this.bot.send(msg);
        }
    }

     public static Log(text : string) {
        if (this.enabled)
        {
            this.cache += (this.cache ? "\n\n" : ">> ") + text;
        }
        this.SendCache();

        console.log(text);
    }

    public static LogObject(obj : any) {
        this.Log(JSON.stringify(obj));
    }
}

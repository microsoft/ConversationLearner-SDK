import * as builder from 'botbuilder';

export class BlisDebug {

    public static bot : any;
    public static address : any;

    public static InitLogger(bot : builder.UniversalBot)
    {
        this.bot = bot;
    }
    
    public static SetAddress(address : any)
    {
        this.address = address;
    }

    public static Log(text) {
        if (this.bot && this.address) {
            var msg = new builder.Message().address(this.address);
            msg.text(text);
            this.bot.send(msg);
        }
        else {
            console.log(text);
        }
    }
}

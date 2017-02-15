export class BlisDebug {

    public static logFunction : (string) => void;   
    public static logger : any;

    public static setLogger(logger: any,logFunction : (string) => void )
    {
        this.logFunction = logFunction;
        this.logger = logger;
    }
    

    public static Log(text) {
        if (this.logFunction) {
            this.logger.Send(text);
        }
        else {
            console.log(text);
        }
    }
}
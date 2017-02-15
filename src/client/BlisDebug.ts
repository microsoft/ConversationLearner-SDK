export class BlisDebug {
    
    public static logFunction : (string) => void;

    public static Log(text) {
        if (this.logFunction) {
            this.logFunction(text);
        }
        else {
            console.log(text);
        }
    }
}
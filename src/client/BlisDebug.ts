export class BlisDebug {

    public static logFunction : (string) => void;

    public static Log(text) {
        if (this.logFunction) {
            let that = this;
            that.logFunction(text);
        }
        else {
            console.log(text);
        }
    }
}
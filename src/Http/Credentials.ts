export class Credentials {
    public User: string
    public Secret: string

    constructor(user: string, secret: string) {
        // TEMP: Credentials currently not used.
        this.User = 'anything'
        this.Secret = 'anything'
    }

    public Cookiestring(): string {
        return 'username=' + this.User + ';password=' + this.Secret
    }
}

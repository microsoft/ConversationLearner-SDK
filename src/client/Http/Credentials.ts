    export class Credentials
    {
        public User : String;
        public Secret : String;

        constructor(user : String, secret : String)
        {
            if (!user) throw new Error("user is required");
            if (!secret) throw new Error("secret is required");

            this.User = user;
            this.Secret = secret;
        }

        public CookieString() : string 
        {
            return "username=" + this.User + ";password="+ this.Secret;
        }
    }
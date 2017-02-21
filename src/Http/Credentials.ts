    export class Credentials
    {
        public User : string;
        public Secret : string;

        constructor(user : string, secret : string)
        {
            if (!user) throw new Error("user is required");
            if (!secret) throw new Error("secret is required");

            this.User = user;
            this.Secret = secret;
        }

        public Cookiestring() : string 
        {
            return "username=" + this.User + ";password="+ this.Secret;
        }
    }
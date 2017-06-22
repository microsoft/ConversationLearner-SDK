var restify = require('restify');
import { BlisDebug} from '../BlisDebug';
import { BlisApp} from '../Model/BlisApp';

export class Server {
    private static server;

    public static Init() : void{
        this.server = restify.createServer();

        this.server.listen(5000, (err) =>
        {
            if (err)
            {
                BlisDebug.Error(err);
            }
            else
            {
                BlisDebug.Log(`${this.server.name} listening to ${this.server.url}`);
            }
        });

        this.server.get("/apps", BlisApp.GetAll);
    }
}
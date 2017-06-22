var restify = require('restify');
import { BlisDebug} from '../BlisDebug';
import { BlisClient} from '../BlisClient';
import { BlisApp} from '../Model/BlisApp';
import { deserialize, serialize } from 'json-typescript-mapper';

export class Server {
    private static server;

    // TEMP until we have an actual user
    private static InitClient() : void
    {
        let serviceUrl = "http://blis-service.azurewebsites.net/api/v1/";
        let user = "testuser";
        let secret = "none";
        let azureFunctionsUrl = "";
        let azureFunctionsKey = "";
        BlisClient.Init(serviceUrl, user, secret, azureFunctionsUrl, azureFunctionsKey);
    }

    public static Init() : void{
        this.server = restify.createServer();

        this.server.use(restify.bodyParser());

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


        this.server.get("/app/:appId", async (req, res, next) =>
            {
                let appId = req.params.appId;
                if (!appId)
                {
                    res.send(400, Error("Missing Application Id"));
                    return;
                }
                this.InitClient();  // TEMP

                try
                {
                    let app = await BlisClient.client.GetApp(appId);
                    res.send(serialize(app));
                }
                catch (error)
                {
                    res.send(error.statusCode, Error(error.body));
                }
            }
        );

        this.server.post("/app", async (req, res, next) =>
            {
                try
                {
                    this.InitClient();  // TEMP

                    let app = deserialize(BlisApp, req.body);
                    let appId = await BlisClient.client.AddApp(app);
                    res.send(appId);
                }
                catch (error)
                {
                    res.send(error.statusCode, Error(error.body));
                }
            }
        );

        this.server.del("/app/:appId", async (req, res, next) =>
        {
                let appId = req.params.appId;
                if (!appId)
                {
                    res.send(400, Error("Missing Application Id"));
                    return;
                }
                this.InitClient();  // TEMP

                try
                {
                    await BlisClient.client.DeleteApp(appId);
                    res.send(200);
                }
                catch (error)
                {
                    res.send(error.statusCode, Error(error.body));
                }
            }
        );
    }
}
import * as Swagger from 'swagger-client';
import * as Promise from 'bluebird';
import * as url from 'url';
import * as util from 'util';
import * as builder from 'botbuilder';
import { BlisDebug} from './BlisDebug';

export class BlisUploader
{
    private static connectorApiClient = new Swagger(
        {
            url: 'https://raw.githubusercontent.com/Microsoft/BotBuilder/master/CSharp/Library/Microsoft.Bot.Connector.Shared/Swagger/ConnectorAPI.json',
            usePromise: true
        });

    public static SendAsFile(bot : builder.UniversalBot, fileData : string, connector: builder.ChatConnector, address : builder.IAddress)
    {
        let contentType = "text/plain";
        let fileName = "traindialogs.json";
        this.UploadAttachment(fileData, contentType, fileName, connector, address)
            .then((attachmentUrl) =>
            {
                BlisDebug.Log(`Attachment Url: ${attachmentUrl}`);
                var msg = new builder.Message()
                .addAttachment({
                    contentUrl: attachmentUrl,
                    contentType: contentType,
           // TODO         name: fileName
                });
                BlisDebug.Log(`Sending ${attachmentUrl}`)
                bot.send(msg);
            })
            .catch (
                error => BlisDebug.Log(error)
             );
    } 
    // Uploads file to Connector API and returns Attachment URLs
    private static UploadAttachment(fileData : string, contentType : string, fileName : string, 
                        connector : builder.ChatConnector, address : builder.IAddress) {

        var base64 = Buffer.from(fileData).toString('base64');

        // Inject the conenctor's JWT token into to the Swagger client
        function AddTokenToClient(connector, clientPromise) {
            // ask the connector for the token. If it expired, a new token will be requested to the API
            var obtainToken = Promise.promisify(connector.addAccessToken.bind(connector));
            var options = {};
            return Promise.all([clientPromise, obtainToken(options)]).then(function (values) {
                var client = values[0];
                var hasToken = !!((<any>options).headers.Authorization);
                if (hasToken) {
                    var authHeader = (<any>options).headers.Authorization;
                    (<any>client).clientAuthorizations.add('AuthorizationBearer', new Swagger.ApiKeyAuthorization('Authorization', authHeader, 'header'));
                }

                BlisDebug.Log("Got client");
                return client;
            });
        }

        // 1. inject the JWT from the connector to the client on every call
        return AddTokenToClient(connector, this.connectorApiClient).then(function (client) {
            // 2. override API client host (api.botframework.com) with channel's serviceHost (e.g.: slack.botframework.com)
            var serviceUrl = url.parse((<any>address).serviceUrl);
            var serviceHost = serviceUrl.host;
            client.setHost(serviceHost);

            // 3. POST /v3/conversations/{conversationId}/attachments
            var uploadParameters = {
                conversationId: address.conversation.id,
                attachmentUpload: {
                    type: contentType,
                    name: fileName,
                    originalBase64: base64
                }
            };

            BlisDebug.Log(`Uploading: ${JSON.stringify(uploadParameters)}`);
            return client.Conversations.Conversations_UploadAttachment(uploadParameters)
                .then(function (res) {
                    var attachmentId = res.obj.id;
                    var attachmentUrl = serviceUrl;

                    BlisDebug.Log(`Got ${attachmentUrl}`);
                    attachmentUrl.pathname = util.format('/v3/attachments/%s/views/%s', attachmentId, 'original');
                    return (<any>attachmentUrl).format();
                })            
                .catch (
                    error => BlisDebug.Log(error)
                );
        })
        .catch (
            error => BlisDebug.Log(error)
        );
    }
}
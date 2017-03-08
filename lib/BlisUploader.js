"use strict";
var Swagger = require("swagger-client");
var Promise = require("bluebird");
var url = require("url");
var util = require("util");
var builder = require("botbuilder");
var BlisDebug_1 = require("./BlisDebug");
var BlisUploader = (function () {
    function BlisUploader() {
    }
    BlisUploader.SendAsFile = function (bot, fileData, connector, address) {
        var contentType = "text/plain";
        var fileName = "traindialogs.json";
        this.UploadAttachment(fileData, contentType, fileName, connector, address)
            .then(function (attachmentUrl) {
            BlisDebug_1.BlisDebug.Log("Attachment Url: " + attachmentUrl);
            var msg = new builder.Message()
                .addAttachment({
                contentUrl: attachmentUrl,
                contentType: contentType,
            });
            BlisDebug_1.BlisDebug.Log("Sending " + attachmentUrl);
            bot.send(msg);
        })
            .catch(function (error) { return BlisDebug_1.BlisDebug.Log(error); });
    };
    // Uploads file to Connector API and returns Attachment URLs
    BlisUploader.UploadAttachment = function (fileData, contentType, fileName, connector, address) {
        var base64 = Buffer.from(fileData).toString('base64');
        // Inject the conenctor's JWT token into to the Swagger client
        function AddTokenToClient(connector, clientPromise) {
            // ask the connector for the token. If it expired, a new token will be requested to the API
            var obtainToken = Promise.promisify(connector.addAccessToken.bind(connector));
            var options = {};
            return Promise.all([clientPromise, obtainToken(options)]).then(function (values) {
                var client = values[0];
                var hasToken = !!(options.headers.Authorization);
                if (hasToken) {
                    var authHeader = options.headers.Authorization;
                    client.clientAuthorizations.add('AuthorizationBearer', new Swagger.ApiKeyAuthorization('Authorization', authHeader, 'header'));
                }
                BlisDebug_1.BlisDebug.Log("Got client");
                return client;
            });
        }
        // 1. inject the JWT from the connector to the client on every call
        return AddTokenToClient(connector, this.connectorApiClient).then(function (client) {
            // 2. override API client host (api.botframework.com) with channel's serviceHost (e.g.: slack.botframework.com)
            var serviceUrl = url.parse(address.serviceUrl);
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
            BlisDebug_1.BlisDebug.Log("Uploading: " + JSON.stringify(uploadParameters));
            return client.Conversations.Conversations_UploadAttachment(uploadParameters)
                .then(function (res) {
                var attachmentId = res.obj.id;
                var attachmentUrl = serviceUrl;
                BlisDebug_1.BlisDebug.Log("Got " + attachmentUrl);
                attachmentUrl.pathname = util.format('/v3/attachments/%s/views/%s', attachmentId, 'original');
                return attachmentUrl.format();
            })
                .catch(function (error) { return BlisDebug_1.BlisDebug.Log(error); });
        })
            .catch(function (error) { return BlisDebug_1.BlisDebug.Log(error); });
    };
    return BlisUploader;
}());
BlisUploader.connectorApiClient = new Swagger({
    url: 'https://raw.githubusercontent.com/Microsoft/BotBuilder/master/CSharp/Library/Microsoft.Bot.Connector.Shared/Swagger/ConnectorAPI.json',
    usePromise: true
});
exports.BlisUploader = BlisUploader;
//# sourceMappingURL=BlisUploader.js.map
"use strict";
var request = require('request');
var BlisDebug_1 = require("./BlisDebug");
var AzureFunctions = (function () {
    function AzureFunctions() {
    }
    AzureFunctions.Call = function (funcName, args) {
        var _this = this;
        var apiPath = "app";
        return new Promise(function (resolve, reject) {
            var requestData = {
                url: _this.AFURI + funcName + "/" + args,
                /*          TODO - auth
                headers: {
                    'Cookie' : this.credentials.Cookiestring(),
                },*/
                /* TODO - params
                body: {
                    name: name,
                    LuisAuthKey: luisKey
                },
                */
                json: true
            };
            BlisDebug_1.BlisDebug.LogRequest("GET", apiPath, requestData);
            request.get(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode >= 300) {
                    reject(body);
                }
                else {
                    resolve(body.Result);
                }
            });
        });
    };
    return AzureFunctions;
}());
AzureFunctions.AFURI = "https://getstockvalue.azurewebsites.net/api/";
exports.AzureFunctions = AzureFunctions;
//# sourceMappingURL=AzureFunctions.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AdminResponse = (function () {
    function AdminResponse(result, error) {
        this.result = result;
        this.error = error;
    }
    AdminResponse.Error = function (err) {
        return new AdminResponse(err, null);
    };
    AdminResponse.Result = function (result) {
        return new AdminResponse(null, result);
    };
    return AdminResponse;
}());
exports.AdminResponse = AdminResponse;
//# sourceMappingURL=AdminResponse.js.map
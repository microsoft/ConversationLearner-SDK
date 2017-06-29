"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
exports.SessionType = {
    Teach: "Teach",
    Run: "Run"
};
var Session = (function () {
    function Session(init) {
        this.sessionId = undefined;
        this.sessionType = undefined;
        Object.assign(this, init);
    }
    return Session;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("sessionId"),
    tslib_1.__metadata("design:type", String)
], Session.prototype, "sessionId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("sessionType"),
    tslib_1.__metadata("design:type", String)
], Session.prototype, "sessionType", void 0);
exports.Session = Session;
//# sourceMappingURL=Session.1.js.map
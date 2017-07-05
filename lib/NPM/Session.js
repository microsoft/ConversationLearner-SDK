"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Session = (function () {
    function Session(init) {
        this.sessionId = undefined;
        this.createdDatetime = undefined;
        this.lastQueryDatetime = undefined;
        this.packageId = undefined;
        this.saveToLog = undefined;
        Object.assign(this, init);
    }
    return Session;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("sessionId"),
    tslib_1.__metadata("design:type", String)
], Session.prototype, "sessionId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("createdDatetime"),
    tslib_1.__metadata("design:type", String)
], Session.prototype, "createdDatetime", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("lastQueryDatetime"),
    tslib_1.__metadata("design:type", String)
], Session.prototype, "lastQueryDatetime", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("lastQueryDatetime"),
    tslib_1.__metadata("design:type", Number)
], Session.prototype, "packageId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("saveToLog"),
    tslib_1.__metadata("design:type", Boolean)
], Session.prototype, "saveToLog", void 0);
exports.Session = Session;
//# sourceMappingURL=Session.js.map
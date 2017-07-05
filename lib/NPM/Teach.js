"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Teach = (function () {
    function Teach(init) {
        this.teachId = undefined;
        this.createdDatetime = undefined;
        this.lastQueryDatetime = undefined;
        this.packageId = undefined;
        Object.assign(this, init);
    }
    return Teach;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("teachId"),
    tslib_1.__metadata("design:type", String)
], Teach.prototype, "teachId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("createdDatetime"),
    tslib_1.__metadata("design:type", String)
], Teach.prototype, "createdDatetime", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("lastQueryDatetime"),
    tslib_1.__metadata("design:type", String)
], Teach.prototype, "lastQueryDatetime", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("lastQueryDatetime"),
    tslib_1.__metadata("design:type", Number)
], Teach.prototype, "packageId", void 0);
exports.Teach = Teach;
var TeachResponse = (function () {
    function TeachResponse(init) {
        this.packageId = undefined;
        this.teachId = undefined;
        this.trainDialogId = undefined;
        Object.assign(this, init);
    }
    return TeachResponse;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("packageId"),
    tslib_1.__metadata("design:type", Number)
], TeachResponse.prototype, "packageId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("teachId"),
    tslib_1.__metadata("design:type", String)
], TeachResponse.prototype, "teachId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("trainDialogId"),
    tslib_1.__metadata("design:type", String)
], TeachResponse.prototype, "trainDialogId", void 0);
exports.TeachResponse = TeachResponse;
//# sourceMappingURL=Teach.js.map
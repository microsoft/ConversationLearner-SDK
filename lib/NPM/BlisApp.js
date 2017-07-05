"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var BlisAppMetaData = (function () {
    function BlisAppMetaData(init) {
        this.botFrameworkApps = undefined;
        Object.assign(this, init);
    }
    return BlisAppMetaData;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('botFrameworkApps'),
    tslib_1.__metadata("design:type", Array)
], BlisAppMetaData.prototype, "botFrameworkApps", void 0);
exports.BlisAppMetaData = BlisAppMetaData;
var BlisAppBase = (function () {
    function BlisAppBase(init) {
        this.appName = undefined;
        this.appId = undefined;
        this.luisKey = undefined;
        this.locale = undefined;
        this.metadata = undefined;
        Object.assign(this, init);
    }
    return BlisAppBase;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('appName'),
    tslib_1.__metadata("design:type", String)
], BlisAppBase.prototype, "appName", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('appId'),
    tslib_1.__metadata("design:type", String)
], BlisAppBase.prototype, "appId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('luisKey'),
    tslib_1.__metadata("design:type", String)
], BlisAppBase.prototype, "luisKey", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('locale'),
    tslib_1.__metadata("design:type", String)
], BlisAppBase.prototype, "locale", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: BlisAppMetaData, name: 'metadata' }),
    tslib_1.__metadata("design:type", BlisAppMetaData)
], BlisAppBase.prototype, "metadata", void 0);
exports.BlisAppBase = BlisAppBase;
var BlisAppList = (function () {
    function BlisAppList(init) {
        this.apps = undefined;
        Object.assign(this, init);
    }
    return BlisAppList;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('apps'),
    tslib_1.__metadata("design:type", Array)
], BlisAppList.prototype, "apps", void 0);
exports.BlisAppList = BlisAppList;
//# sourceMappingURL=BlisApp.js.map
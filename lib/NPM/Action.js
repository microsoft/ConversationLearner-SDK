"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var ActionMetaData = (function () {
    function ActionMetaData(init) {
        this.actionType = undefined;
        Object.assign(this, init);
    }
    ActionMetaData.prototype.Equal = function (metaData) {
        if (this.actionType != metaData.actionType)
            return false;
        return true;
    };
    return ActionMetaData;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('actionType'),
    tslib_1.__metadata("design:type", String)
], ActionMetaData.prototype, "actionType", void 0);
exports.ActionMetaData = ActionMetaData;
var ActionBase = (function () {
    function ActionBase(init) {
        this.actionId = undefined;
        this.payload = undefined;
        this.isTerminal = undefined;
        this.requiredEntities = undefined;
        this.negativeEntities = undefined;
        this.version = undefined;
        this.packageCreationId = undefined;
        this.packageDeletionId = undefined;
        this.metadata = new ActionMetaData();
        Object.assign(this, init);
    }
    return ActionBase;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('actionId'),
    tslib_1.__metadata("design:type", String)
], ActionBase.prototype, "actionId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('payload'),
    tslib_1.__metadata("design:type", String)
], ActionBase.prototype, "payload", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('isTerminal'),
    tslib_1.__metadata("design:type", Boolean)
], ActionBase.prototype, "isTerminal", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('requiredEntities'),
    tslib_1.__metadata("design:type", Array)
], ActionBase.prototype, "requiredEntities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('negativeEntities'),
    tslib_1.__metadata("design:type", Array)
], ActionBase.prototype, "negativeEntities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('version'),
    tslib_1.__metadata("design:type", Number)
], ActionBase.prototype, "version", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageCreationId'),
    tslib_1.__metadata("design:type", Number)
], ActionBase.prototype, "packageCreationId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageDeletionId'),
    tslib_1.__metadata("design:type", Number)
], ActionBase.prototype, "packageDeletionId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: ActionMetaData, name: 'metadata' }),
    tslib_1.__metadata("design:type", ActionMetaData)
], ActionBase.prototype, "metadata", void 0);
exports.ActionBase = ActionBase;
var ActionList = (function () {
    function ActionList(init) {
        this.actions = undefined;
        Object.assign(this, init);
    }
    return ActionList;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('actions'),
    tslib_1.__metadata("design:type", Array)
], ActionList.prototype, "actions", void 0);
exports.ActionList = ActionList;
var ActionIdList = (function () {
    function ActionIdList(init) {
        this.actionIds = undefined;
        Object.assign(this, init);
    }
    return ActionIdList;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('actionIds'),
    tslib_1.__metadata("design:type", Array)
], ActionIdList.prototype, "actionIds", void 0);
exports.ActionIdList = ActionIdList;
//# sourceMappingURL=Action.js.map
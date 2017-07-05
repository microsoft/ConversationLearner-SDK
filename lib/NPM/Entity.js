"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var EntityMetaData = (function () {
    function EntityMetaData(init) {
        this.isBucket = false;
        this.isReversable = false;
        this.negativeId = undefined;
        this.positiveId = undefined;
        Object.assign(this, init);
    }
    /** Make negate of given metadata */
    EntityMetaData.prototype.MakeNegative = function (posId) {
        return new EntityMetaData({ isBucket: this.isBucket, negativeId: null, positiveId: posId });
    };
    return EntityMetaData;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('isBucket'),
    tslib_1.__metadata("design:type", Boolean)
], EntityMetaData.prototype, "isBucket", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('isReversable'),
    tslib_1.__metadata("design:type", Boolean)
], EntityMetaData.prototype, "isReversable", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('negativeId'),
    tslib_1.__metadata("design:type", String)
], EntityMetaData.prototype, "negativeId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('positiveId'),
    tslib_1.__metadata("design:type", String)
], EntityMetaData.prototype, "positiveId", void 0);
exports.EntityMetaData = EntityMetaData;
var EntityBase = (function () {
    function EntityBase(init) {
        this.entityId = undefined;
        this.entityName = undefined;
        this.entityType = undefined;
        this.version = undefined;
        this.packageCreationId = undefined;
        this.packageDeletionId = undefined;
        this.metadata = undefined;
        Object.assign(this, init);
    }
    return EntityBase;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entityId'),
    tslib_1.__metadata("design:type", String)
], EntityBase.prototype, "entityId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entityName'),
    tslib_1.__metadata("design:type", String)
], EntityBase.prototype, "entityName", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entityType'),
    tslib_1.__metadata("design:type", String)
], EntityBase.prototype, "entityType", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('version'),
    tslib_1.__metadata("design:type", Number)
], EntityBase.prototype, "version", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageCreationId'),
    tslib_1.__metadata("design:type", Number)
], EntityBase.prototype, "packageCreationId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageDeletionId'),
    tslib_1.__metadata("design:type", Number)
], EntityBase.prototype, "packageDeletionId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: EntityMetaData, name: 'metadata' }),
    tslib_1.__metadata("design:type", EntityMetaData)
], EntityBase.prototype, "metadata", void 0);
exports.EntityBase = EntityBase;
var EntityList = (function () {
    function EntityList(init) {
        this.entities = undefined;
        Object.assign(this, init);
    }
    return EntityList;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: EntityBase, name: 'entities' }),
    tslib_1.__metadata("design:type", Array)
], EntityList.prototype, "entities", void 0);
exports.EntityList = EntityList;
var EntityIdList = (function () {
    function EntityIdList(init) {
        this.entityIds = undefined;
        Object.assign(this, init);
    }
    return EntityIdList;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entityIds'),
    tslib_1.__metadata("design:type", Array)
], EntityIdList.prototype, "entityIds", void 0);
exports.EntityIdList = EntityIdList;
//# sourceMappingURL=Entity.js.map
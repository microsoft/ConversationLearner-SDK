"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var TrainDialog_1 = require("./TrainDialog");
var Metrics_1 = require("./Metrics");
var PredictedEntity = (function (_super) {
    tslib_1.__extends(PredictedEntity, _super);
    function PredictedEntity(init) {
        var _this = _super.call(this, init) || this;
        _this.score = undefined;
        Object.assign(_this, init);
        return _this;
    }
    return PredictedEntity;
}(TrainDialog_1.LabeledEntity));
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('score'),
    tslib_1.__metadata("design:type", Number)
], PredictedEntity.prototype, "score", void 0);
exports.PredictedEntity = PredictedEntity;
var ExtractResponse = (function () {
    function ExtractResponse(init) {
        this.text = undefined;
        this.predictedEntities = undefined;
        this.metrics = undefined;
        this.packageId = undefined;
        Object.assign(this, init);
    }
    return ExtractResponse;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('text'),
    tslib_1.__metadata("design:type", String)
], ExtractResponse.prototype, "text", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: PredictedEntity, name: 'predictedEntities' }),
    tslib_1.__metadata("design:type", Array)
], ExtractResponse.prototype, "predictedEntities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Metrics_1.Metrics, name: 'metrics' }),
    tslib_1.__metadata("design:type", Metrics_1.Metrics)
], ExtractResponse.prototype, "metrics", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageId'),
    tslib_1.__metadata("design:type", String)
], ExtractResponse.prototype, "packageId", void 0);
exports.ExtractResponse = ExtractResponse;
//# sourceMappingURL=Extract.js.map
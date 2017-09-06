"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
/**
 * Used to remember training steps during a train dialog
 */
var Serializable_1 = require("./Serializable");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var TrainStep = (function (_super) {
    tslib_1.__extends(TrainStep, _super);
    function TrainStep(init) {
        var _this = _super.call(this) || this;
        // TODO: Obsolete with new UI?
        _this.input = null;
        _this.entity = null;
        _this.api = [];
        _this.response = [];
        _this.input = undefined;
        _this.entity = undefined;
        _this.api = [];
        _this.response = [];
        Object.assign(_this, init);
        return _this;
    }
    tslib_1.__decorate([
        json_typescript_mapper_1.JsonProperty('input'),
        tslib_1.__metadata("design:type", String)
    ], TrainStep.prototype, "input", void 0);
    tslib_1.__decorate([
        json_typescript_mapper_1.JsonProperty('entity'),
        tslib_1.__metadata("design:type", String)
    ], TrainStep.prototype, "entity", void 0);
    tslib_1.__decorate([
        json_typescript_mapper_1.JsonProperty('api'),
        tslib_1.__metadata("design:type", Array)
    ], TrainStep.prototype, "api", void 0);
    tslib_1.__decorate([
        json_typescript_mapper_1.JsonProperty('response'),
        tslib_1.__metadata("design:type", Array)
    ], TrainStep.prototype, "response", void 0);
    return TrainStep;
}(Serializable_1.Serializable));
exports.TrainStep = TrainStep;
//# sourceMappingURL=TrainStep.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Metrics_1 = require("./Metrics");
var ScoreInput = (function () {
    function ScoreInput(init) {
        this.filledEntities = undefined;
        this.context = undefined;
        this.maskedActions = undefined;
        Object.assign(this, init);
    }
    return ScoreInput;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('filledEntities'),
    tslib_1.__metadata("design:type", Array)
], ScoreInput.prototype, "filledEntities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('context'),
    tslib_1.__metadata("design:type", String)
], ScoreInput.prototype, "context", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('maskedActions'),
    tslib_1.__metadata("design:type", Array)
], ScoreInput.prototype, "maskedActions", void 0);
exports.ScoreInput = ScoreInput;
var UnscoredAction = (function () {
    function UnscoredAction(init) {
        this.actionId = undefined;
        this.reason = undefined;
        Object.assign(this, init);
    }
    return UnscoredAction;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('actionId'),
    tslib_1.__metadata("design:type", String)
], UnscoredAction.prototype, "actionId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('reason'),
    tslib_1.__metadata("design:type", String)
], UnscoredAction.prototype, "reason", void 0);
exports.UnscoredAction = UnscoredAction;
var ScoredAction = (function () {
    function ScoredAction(init) {
        this.actionId = undefined;
        this.score = undefined;
        Object.assign(this, init);
    }
    return ScoredAction;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('actionId'),
    tslib_1.__metadata("design:type", String)
], ScoredAction.prototype, "actionId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('score'),
    tslib_1.__metadata("design:type", Number)
], ScoredAction.prototype, "score", void 0);
exports.ScoredAction = ScoredAction;
var ScoreResponse = (function () {
    function ScoreResponse(init) {
        this.scoredActions = undefined;
        this.unscoredActions = undefined;
        this.metrics = undefined;
        Object.assign(this, init);
    }
    return ScoreResponse;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: ScoredAction, name: 'scoredActions' }),
    tslib_1.__metadata("design:type", Array)
], ScoreResponse.prototype, "scoredActions", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: UnscoredAction, name: 'unscoredActions' }),
    tslib_1.__metadata("design:type", Array)
], ScoreResponse.prototype, "unscoredActions", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Metrics_1.Metrics, name: 'metrics' }),
    tslib_1.__metadata("design:type", Metrics_1.Metrics)
], ScoreResponse.prototype, "metrics", void 0);
exports.ScoreResponse = ScoreResponse;
//# sourceMappingURL=Score.js.map
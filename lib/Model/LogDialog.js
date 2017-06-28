"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var TrainDialog_1 = require("./TrainDialog");
var Metrics = (function () {
    function Metrics(init) {
        this.wallTime = undefined;
        Object.assign(this, init);
    }
    return Metrics;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('wallTime'),
    tslib_1.__metadata("design:type", Number)
], Metrics.prototype, "wallTime", void 0);
exports.Metrics = Metrics;
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
var LogExtractorStep = (function () {
    function LogExtractorStep(init) {
        this.text = undefined;
        this.predictedEntities = undefined;
        this.stepBeginDatetime = undefined;
        this.stepEndDatetime = undefined;
        this.metrics = undefined;
        Object.assign(this, init);
    }
    return LogExtractorStep;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('text'),
    tslib_1.__metadata("design:type", String)
], LogExtractorStep.prototype, "text", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: PredictedEntity, name: 'predictedEntities' }),
    tslib_1.__metadata("design:type", Array)
], LogExtractorStep.prototype, "predictedEntities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('stepBeginDatetime'),
    tslib_1.__metadata("design:type", String)
], LogExtractorStep.prototype, "stepBeginDatetime", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('stepEndDatetime'),
    tslib_1.__metadata("design:type", String)
], LogExtractorStep.prototype, "stepEndDatetime", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Metrics, name: 'metrics' }),
    tslib_1.__metadata("design:type", Metrics)
], LogExtractorStep.prototype, "metrics", void 0);
exports.LogExtractorStep = LogExtractorStep;
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
var PredictionDetails = (function () {
    function PredictionDetails(init) {
        this.scoredActions = undefined;
        this.unscoredActions = undefined;
        Object.assign(this, init);
    }
    return PredictionDetails;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: ScoredAction, name: 'scoredActions' }),
    tslib_1.__metadata("design:type", Array)
], PredictionDetails.prototype, "scoredActions", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: UnscoredAction, name: 'unscoredActions' }),
    tslib_1.__metadata("design:type", Array)
], PredictionDetails.prototype, "unscoredActions", void 0);
exports.PredictionDetails = PredictionDetails;
var LogScorerStep = (function () {
    function LogScorerStep(init) {
        this.input = undefined;
        this.predictedAction = undefined;
        this.predictionDetails = undefined;
        this.stepBeginDatetime = undefined;
        this.stepEndDatetime = undefined;
        this.metrics = undefined;
        Object.assign(this, init);
    }
    return LogScorerStep;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: TrainDialog_1.ScorerInput, name: 'input' }),
    tslib_1.__metadata("design:type", TrainDialog_1.ScorerInput)
], LogScorerStep.prototype, "input", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('predictedAction'),
    tslib_1.__metadata("design:type", String)
], LogScorerStep.prototype, "predictedAction", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: PredictionDetails, name: 'predictionDetails' }),
    tslib_1.__metadata("design:type", PredictionDetails)
], LogScorerStep.prototype, "predictionDetails", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('stepBeginDatetime'),
    tslib_1.__metadata("design:type", String)
], LogScorerStep.prototype, "stepBeginDatetime", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('stepEndDatetime'),
    tslib_1.__metadata("design:type", String)
], LogScorerStep.prototype, "stepEndDatetime", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Metrics, name: 'metrics' }),
    tslib_1.__metadata("design:type", Metrics)
], LogScorerStep.prototype, "metrics", void 0);
exports.LogScorerStep = LogScorerStep;
var LogRound = (function () {
    function LogRound(init) {
        this.extractorStep = undefined;
        this.scorerSteps = undefined;
        Object.assign(this, init);
    }
    return LogRound;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: LogExtractorStep, name: 'extractorStep' }),
    tslib_1.__metadata("design:type", LogExtractorStep)
], LogRound.prototype, "extractorStep", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: LogScorerStep, name: 'scorerSteps' }),
    tslib_1.__metadata("design:type", Array)
], LogRound.prototype, "scorerSteps", void 0);
exports.LogRound = LogRound;
var LogDialog = (function () {
    function LogDialog(init) {
        this.logDialogId = undefined;
        this.dialogBeginDatetime = undefined;
        this.dialogEndDatetime = undefined;
        this.packageId = undefined;
        this.metrics = undefined;
        this.rounds = undefined;
        Object.assign(this, init);
    }
    return LogDialog;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('logDialogId'),
    tslib_1.__metadata("design:type", String)
], LogDialog.prototype, "logDialogId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('dialogBeginDatetime'),
    tslib_1.__metadata("design:type", String)
], LogDialog.prototype, "dialogBeginDatetime", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('dialogEndDatetime'),
    tslib_1.__metadata("design:type", String)
], LogDialog.prototype, "dialogEndDatetime", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageId'),
    tslib_1.__metadata("design:type", Number)
], LogDialog.prototype, "packageId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('metrics'),
    tslib_1.__metadata("design:type", String)
], LogDialog.prototype, "metrics", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: LogRound, name: 'rounds' }),
    tslib_1.__metadata("design:type", Array)
], LogDialog.prototype, "rounds", void 0);
exports.LogDialog = LogDialog;
var LogDialogList = (function () {
    function LogDialogList(init) {
        this.logDialogs = undefined;
        Object.assign(this, init);
    }
    return LogDialogList;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: LogDialog, name: 'logDialogs' }),
    tslib_1.__metadata("design:type", Array)
], LogDialogList.prototype, "logDialogs", void 0);
exports.LogDialogList = LogDialogList;
var LogDialogIdList = (function () {
    function LogDialogIdList(init) {
        this.logDialogIds = undefined;
        Object.assign(this, init);
    }
    return LogDialogIdList;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('logdialogIds'),
    tslib_1.__metadata("design:type", Array)
], LogDialogIdList.prototype, "logDialogIds", void 0);
exports.LogDialogIdList = LogDialogIdList;
//# sourceMappingURL=LogDialog.js.map
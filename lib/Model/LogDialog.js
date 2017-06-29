"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Score_1 = require("./Score");
var Extract_1 = require("./Extract");
var Metrics_1 = require("./Metrics");
var LogExtractorStep = (function (_super) {
    tslib_1.__extends(LogExtractorStep, _super);
    function LogExtractorStep(init) {
        var _this = _super.call(this) || this;
        _this.stepBeginDatetime = undefined;
        _this.stepEndDatetime = undefined;
        Object.assign(_this, init);
        return _this;
    }
    return LogExtractorStep;
}(Extract_1.ExtractResponse));
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('stepBeginDatetime'),
    tslib_1.__metadata("design:type", String)
], LogExtractorStep.prototype, "stepBeginDatetime", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('stepEndDatetime'),
    tslib_1.__metadata("design:type", String)
], LogExtractorStep.prototype, "stepEndDatetime", void 0);
exports.LogExtractorStep = LogExtractorStep;
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
    json_typescript_mapper_1.JsonProperty({ clazz: Score_1.ScoreInput, name: 'input' }),
    tslib_1.__metadata("design:type", Score_1.ScoreInput)
], LogScorerStep.prototype, "input", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('predictedAction'),
    tslib_1.__metadata("design:type", String)
], LogScorerStep.prototype, "predictedAction", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Score_1.ScoreResponse, name: 'predictionDetails' }),
    tslib_1.__metadata("design:type", Score_1.ScoreResponse)
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
    json_typescript_mapper_1.JsonProperty({ clazz: Metrics_1.Metrics, name: 'metrics' }),
    tslib_1.__metadata("design:type", Metrics_1.Metrics)
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
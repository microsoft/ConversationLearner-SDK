"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Score_1 = require("./Score");
var LabeledEntity = (function () {
    function LabeledEntity(init) {
        this.startCharIndex = undefined;
        this.endCharIndex = undefined;
        this.entityId = undefined;
        this.entityText = undefined;
        Object.assign(this, init);
    }
    return LabeledEntity;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('startCharIndex'),
    tslib_1.__metadata("design:type", Number)
], LabeledEntity.prototype, "startCharIndex", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('endCharIndex'),
    tslib_1.__metadata("design:type", Number)
], LabeledEntity.prototype, "endCharIndex", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entityId'),
    tslib_1.__metadata("design:type", String)
], LabeledEntity.prototype, "entityId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entityText'),
    tslib_1.__metadata("design:type", String)
], LabeledEntity.prototype, "entityText", void 0);
exports.LabeledEntity = LabeledEntity;
var TextVariation = (function () {
    function TextVariation(init) {
        this.text = undefined;
        this.labelEntities = undefined;
        Object.assign(this, init);
    }
    return TextVariation;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('text'),
    tslib_1.__metadata("design:type", String)
], TextVariation.prototype, "text", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: LabeledEntity, name: 'labelEntities' }),
    tslib_1.__metadata("design:type", Array)
], TextVariation.prototype, "labelEntities", void 0);
exports.TextVariation = TextVariation;
var TrainExtractorStep = (function () {
    function TrainExtractorStep(init) {
        this.textVariations = undefined;
        Object.assign(this, init);
    }
    return TrainExtractorStep;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: TextVariation, name: 'textVariations' }),
    tslib_1.__metadata("design:type", Array)
], TrainExtractorStep.prototype, "textVariations", void 0);
exports.TrainExtractorStep = TrainExtractorStep;
var TrainScorerStep = (function () {
    function TrainScorerStep(init) {
        this.input = undefined;
        this.labelAction = undefined;
        Object.assign(this, init);
    }
    return TrainScorerStep;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Score_1.ScoreInput, name: 'input' }),
    tslib_1.__metadata("design:type", Score_1.ScoreInput)
], TrainScorerStep.prototype, "input", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('labelAction'),
    tslib_1.__metadata("design:type", String)
], TrainScorerStep.prototype, "labelAction", void 0);
exports.TrainScorerStep = TrainScorerStep;
var TrainRound = (function () {
    function TrainRound(init) {
        this.extractorStep = undefined;
        this.scorerSteps = undefined;
        Object.assign(this, init);
    }
    return TrainRound;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: TrainExtractorStep, name: 'extractorStep' }),
    tslib_1.__metadata("design:type", TrainExtractorStep)
], TrainRound.prototype, "extractorStep", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: TrainScorerStep, name: 'scorerSteps' }),
    tslib_1.__metadata("design:type", Array)
], TrainRound.prototype, "scorerSteps", void 0);
exports.TrainRound = TrainRound;
var TrainDialog = (function () {
    function TrainDialog(init) {
        this.trainDialogId = undefined;
        this.version = undefined;
        this.packageCreationId = undefined;
        this.packageDeletionId = undefined;
        this.rounds = undefined;
        Object.assign(this, init);
    }
    return TrainDialog;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('trainDialogId'),
    tslib_1.__metadata("design:type", String)
], TrainDialog.prototype, "trainDialogId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('version'),
    tslib_1.__metadata("design:type", Number)
], TrainDialog.prototype, "version", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageCreationId'),
    tslib_1.__metadata("design:type", Number)
], TrainDialog.prototype, "packageCreationId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('packageDeletionId'),
    tslib_1.__metadata("design:type", Number)
], TrainDialog.prototype, "packageDeletionId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: TrainRound, name: 'rounds' }),
    tslib_1.__metadata("design:type", Array)
], TrainDialog.prototype, "rounds", void 0);
exports.TrainDialog = TrainDialog;
var TrainResponse = (function () {
    function TrainResponse(init) {
        this.packageId = undefined;
        this.trainingStatus = undefined;
        this.trainDialogId = undefined;
        Object.assign(this, init);
    }
    return TrainResponse;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("packageId"),
    tslib_1.__metadata("design:type", Number)
], TrainResponse.prototype, "packageId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("trainingStatus"),
    tslib_1.__metadata("design:type", String)
], TrainResponse.prototype, "trainingStatus", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("trainDialogId"),
    tslib_1.__metadata("design:type", String)
], TrainResponse.prototype, "trainDialogId", void 0);
exports.TrainResponse = TrainResponse;
var TrainDialogList = (function () {
    function TrainDialogList(init) {
        this.trainDialogs = undefined;
        Object.assign(this, init);
    }
    return TrainDialogList;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: TrainDialog, name: 'trainDialogs' }),
    tslib_1.__metadata("design:type", Array)
], TrainDialogList.prototype, "trainDialogs", void 0);
exports.TrainDialogList = TrainDialogList;
var TrainDialogIdList = (function () {
    function TrainDialogIdList(init) {
        this.trainDialogIds = undefined;
        Object.assign(this, init);
    }
    return TrainDialogIdList;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('trainDialogIds'),
    tslib_1.__metadata("design:type", Array)
], TrainDialogIdList.prototype, "trainDialogIds", void 0);
exports.TrainDialogIdList = TrainDialogIdList;
//# sourceMappingURL=TrainDialog.js.map
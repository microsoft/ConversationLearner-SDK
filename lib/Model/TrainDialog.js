"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var AltText = (function () {
    function AltText(init) {
        this.text = undefined;
        Object.assign(this, init);
    }
    return AltText;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('text'),
    tslib_1.__metadata("design:type", String)
], AltText.prototype, "text", void 0);
exports.AltText = AltText;
var TextEntity = (function () {
    function TextEntity(init) {
        this.endToken = undefined;
        this.entityId = undefined;
        this.startToken = undefined;
        Object.assign(this, init);
    }
    return TextEntity;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('EndToken'),
    tslib_1.__metadata("design:type", Number)
], TextEntity.prototype, "endToken", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('EntityType'),
    tslib_1.__metadata("design:type", String)
], TextEntity.prototype, "entityId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('StartToken'),
    tslib_1.__metadata("design:type", Number)
], TextEntity.prototype, "startToken", void 0);
exports.TextEntity = TextEntity;
var Input = (function () {
    function Input(init) {
        this.context = undefined;
        this.entityIds = undefined;
        this.maskedActionIds = undefined;
        this.text = undefined;
        this.textAlts = undefined;
        this.textEntities = undefined;
        Object.assign(this, init);
    }
    return Input;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('context'),
    tslib_1.__metadata("design:type", Object)
], Input.prototype, "context", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entities'),
    tslib_1.__metadata("design:type", Array)
], Input.prototype, "entityIds", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('masked-actions'),
    tslib_1.__metadata("design:type", Array)
], Input.prototype, "maskedActionIds", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('text'),
    tslib_1.__metadata("design:type", String)
], Input.prototype, "text", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: AltText, name: 'text-alts' }),
    tslib_1.__metadata("design:type", Array)
], Input.prototype, "textAlts", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: TextEntity, name: 'text-entities' }),
    tslib_1.__metadata("design:type", Array)
], Input.prototype, "textEntities", void 0);
exports.Input = Input;
var Turn = (function () {
    function Turn(init) {
        this.input = undefined;
        this.activityId = undefined;
        Object.assign(this, init);
    }
    return Turn;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Input, name: 'input' }),
    tslib_1.__metadata("design:type", Input)
], Turn.prototype, "input", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('output'),
    tslib_1.__metadata("design:type", String)
], Turn.prototype, "activityId", void 0);
exports.Turn = Turn;
var TrainDialog = (function () {
    function TrainDialog() {
        this.turns = [];
    }
    return TrainDialog;
}());
exports.TrainDialog = TrainDialog;
//# sourceMappingURL=TrainDialog.js.map
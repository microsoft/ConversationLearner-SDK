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
var Input = (function () {
    function Input(init) {
        this.text = undefined;
        this.textAlts = undefined;
        Object.assign(this, init);
    }
    return Input;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('text'),
    tslib_1.__metadata("design:type", String)
], Input.prototype, "text", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Input, name: 'text-alts' }),
    tslib_1.__metadata("design:type", Array)
], Input.prototype, "textAlts", void 0);
exports.Input = Input;
var Turn = (function () {
    function Turn(init) {
        this.input = undefined;
        this.output = undefined;
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
], Turn.prototype, "output", void 0);
exports.Turn = Turn;
var TrainDialogSnip = (function () {
    function TrainDialogSnip() {
        this.turns = [];
    }
    return TrainDialogSnip;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Turn, name: 'snippetlist' }),
    tslib_1.__metadata("design:type", Array)
], TrainDialogSnip.prototype, "turns", void 0);
exports.TrainDialogSnip = TrainDialogSnip;
//# sourceMappingURL=TrainDialogSnip.js.map
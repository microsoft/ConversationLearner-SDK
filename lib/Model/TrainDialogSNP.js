"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var AltTextSNP = (function () {
    function AltTextSNP(init) {
        this.text = undefined;
        Object.assign(this, init);
    }
    return AltTextSNP;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('text'),
    tslib_1.__metadata("design:type", String)
], AltTextSNP.prototype, "text", void 0);
exports.AltTextSNP = AltTextSNP;
var InputSNP = (function () {
    function InputSNP(init) {
        this.text = undefined;
        this.textAlts = undefined;
        Object.assign(this, init);
    }
    return InputSNP;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('text'),
    tslib_1.__metadata("design:type", String)
], InputSNP.prototype, "text", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: InputSNP, name: 'text-alts' }),
    tslib_1.__metadata("design:type", Array)
], InputSNP.prototype, "textAlts", void 0);
exports.InputSNP = InputSNP;
var TurnSNP = (function () {
    function TurnSNP(init) {
        this.input = undefined;
        this.output = undefined;
        Object.assign(this, init);
    }
    return TurnSNP;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: InputSNP, name: 'input' }),
    tslib_1.__metadata("design:type", InputSNP)
], TurnSNP.prototype, "input", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('output'),
    tslib_1.__metadata("design:type", String)
], TurnSNP.prototype, "output", void 0);
exports.TurnSNP = TurnSNP;
var TrainDialogSNP = (function () {
    function TrainDialogSNP() {
        this.turns = [];
    }
    return TrainDialogSNP;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: TurnSNP, name: 'snippetlist' }),
    tslib_1.__metadata("design:type", Array)
], TrainDialogSNP.prototype, "turns", void 0);
exports.TrainDialogSNP = TrainDialogSNP;
//# sourceMappingURL=TrainDialogSNP.js.map
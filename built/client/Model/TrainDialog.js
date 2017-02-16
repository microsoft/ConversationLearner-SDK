"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Input = (function () {
    function Input(init) {
        this.text = undefined;
        Object.assign(this, init);
    }
    return Input;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('text'),
    tslib_1.__metadata("design:type", String)
], Input.prototype, "text", void 0);
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
var TrainDialog = (function () {
    function TrainDialog() {
        this.turns = [];
    }
    return TrainDialog;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Turn, name: 'snippetlist' }),
    tslib_1.__metadata("design:type", Array)
], TrainDialog.prototype, "turns", void 0);
exports.TrainDialog = TrainDialog;
//# sourceMappingURL=TrainDialog.js.map
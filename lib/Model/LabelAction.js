"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
/** Action in response to a user's string */
var LabelAction = (function () {
    function LabelAction(init) {
        this.actionType = null;
        this.available = null;
        this.content = null;
        this.id = null;
        this.score = null;
        this.waitAction = null;
        Object.assign(this, init);
    }
    return LabelAction;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('action_type'),
    tslib_1.__metadata("design:type", String)
], LabelAction.prototype, "actionType", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('available'),
    tslib_1.__metadata("design:type", Boolean)
], LabelAction.prototype, "available", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('content'),
    tslib_1.__metadata("design:type", String)
], LabelAction.prototype, "content", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('id'),
    tslib_1.__metadata("design:type", String)
], LabelAction.prototype, "id", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('score'),
    tslib_1.__metadata("design:type", Number)
], LabelAction.prototype, "score", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('sequence_terminal'),
    tslib_1.__metadata("design:type", Array)
], LabelAction.prototype, "waitAction", void 0);
exports.LabelAction = LabelAction;
//# sourceMappingURL=LabelAction.js.map
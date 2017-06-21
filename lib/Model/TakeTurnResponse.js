"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Action_1 = require("./Action");
var LabelEntity_1 = require("./LabelEntity");
var LabelAction_1 = require("./LabelAction");
var TakeTurnResponse = (function () {
    function TakeTurnResponse(init) {
        this.originalText = undefined;
        this.entities = undefined;
        this.mode = undefined;
        this.actions = undefined;
        this.action = undefined;
        this.teachStep = undefined;
        this.teachLabelEntities = undefined;
        this.teachLabelActions = undefined;
        this.teachError = undefined;
        this.error = undefined;
        Object.assign(this, init);
    }
    return TakeTurnResponse;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('orig-text'),
    tslib_1.__metadata("design:type", String)
], TakeTurnResponse.prototype, "originalText", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: LabelEntity_1.LabelEntity_v1, name: 'entities' }),
    tslib_1.__metadata("design:type", Array)
], TakeTurnResponse.prototype, "entities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('mode'),
    tslib_1.__metadata("design:type", String)
], TakeTurnResponse.prototype, "mode", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Action_1.Action_v1, name: 'actions' }),
    tslib_1.__metadata("design:type", Array)
], TakeTurnResponse.prototype, "actions", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Action_1.Action_v1, name: 'action' }),
    tslib_1.__metadata("design:type", Action_1.Action_v1)
], TakeTurnResponse.prototype, "action", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('teach_step'),
    tslib_1.__metadata("design:type", String)
], TakeTurnResponse.prototype, "teachStep", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: LabelEntity_1.LabelEntity_v1, name: 'teach_label_entity' }),
    tslib_1.__metadata("design:type", Array)
], TakeTurnResponse.prototype, "teachLabelEntities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: LabelAction_1.LabelAction, name: 'teach_label_action' }),
    tslib_1.__metadata("design:type", Array)
], TakeTurnResponse.prototype, "teachLabelActions", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('teach_error_msg'),
    tslib_1.__metadata("design:type", String)
], TakeTurnResponse.prototype, "teachError", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('error'),
    tslib_1.__metadata("design:type", Object)
], TakeTurnResponse.prototype, "error", void 0);
exports.TakeTurnResponse = TakeTurnResponse;
//# sourceMappingURL=TakeTurnResponse.js.map
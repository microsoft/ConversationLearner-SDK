"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var LuisEntity_1 = require("./LuisEntity");
var Action_1 = require("./Action");
var TakeTurnResponse = (function () {
    function TakeTurnResponse(init) {
        this.originalText = undefined;
        this.entities = undefined;
        this.mode = undefined;
        this.actions = undefined;
        this.action = undefined;
        this.error = undefined;
        Object.assign(this, init);
    }
    TakeTurnResponse.prototype.ToJSON = function () {
        var json = {};
        if (this.originalText)
            json['text'] = this.originalText;
        if (this.entities)
            json['entities'] = this.entities;
        return json;
    };
    return TakeTurnResponse;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('orig-text'),
    tslib_1.__metadata("design:type", String)
], TakeTurnResponse.prototype, "originalText", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: LuisEntity_1.LuisEntity, name: 'entities' }),
    tslib_1.__metadata("design:type", Array)
], TakeTurnResponse.prototype, "entities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('mode'),
    tslib_1.__metadata("design:type", String)
], TakeTurnResponse.prototype, "mode", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Action_1.Action, name: 'actions' }),
    tslib_1.__metadata("design:type", Array)
], TakeTurnResponse.prototype, "actions", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Action_1.Action, name: 'action' }),
    tslib_1.__metadata("design:type", Action_1.Action)
], TakeTurnResponse.prototype, "action", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('error'),
    tslib_1.__metadata("design:type", String)
], TakeTurnResponse.prototype, "error", void 0);
exports.TakeTurnResponse = TakeTurnResponse;
//# sourceMappingURL=TakeTurnResponse.js.map
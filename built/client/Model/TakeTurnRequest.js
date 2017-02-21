"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Entity_1 = require("./Entity");
var TakeTurnRequest = (function () {
    function TakeTurnRequest(init) {
        this.text = undefined;
        this.entities = undefined;
        this.context = undefined;
        this.actionMask = undefined;
        Object.assign(this, init);
    }
    TakeTurnRequest.prototype.ToJSON = function () {
        var json = {};
        if (this.text)
            json['text'] = this.text;
        if (this.entities)
            json['entities'] = this.entities;
        if (this.context)
            json['context'] = this.context;
        if (this.actionMask)
            json['action-mask'] = this.context;
        return json;
    };
    return TakeTurnRequest;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('text'),
    tslib_1.__metadata("design:type", String)
], TakeTurnRequest.prototype, "text", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Entity_1.Entity, name: 'entities' }),
    tslib_1.__metadata("design:type", Array)
], TakeTurnRequest.prototype, "entities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('context'),
    tslib_1.__metadata("design:type", Object)
], TakeTurnRequest.prototype, "context", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('action-mask'),
    tslib_1.__metadata("design:type", Array)
], TakeTurnRequest.prototype, "actionMask", void 0);
exports.TakeTurnRequest = TakeTurnRequest;
//# sourceMappingURL=TakeTurnRequest.js.map
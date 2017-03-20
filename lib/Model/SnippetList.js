"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Action_1 = require("./Action");
var Entity_1 = require("./Entity");
var SnipTurn = (function () {
    function SnipTurn(init) {
        this.userText = undefined;
        this.action = undefined;
        Object.assign(this, init);
    }
    return SnipTurn;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('user_text'),
    tslib_1.__metadata("design:type", Array)
], SnipTurn.prototype, "userText", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('action'),
    tslib_1.__metadata("design:type", String)
], SnipTurn.prototype, "action", void 0);
exports.SnipTurn = SnipTurn;
var Snippet = (function () {
    function Snippet(init) {
        this.turns = undefined;
        Object.assign(this, init);
    }
    return Snippet;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: SnipTurn, name: 'turns' }),
    tslib_1.__metadata("design:type", Array)
], Snippet.prototype, "turns", void 0);
exports.Snippet = Snippet;
var BlisApp = (function () {
    function BlisApp(init) {
        this.actions = undefined;
        Object.assign(this, init);
    }
    return BlisApp;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Action_1.Action, name: 'action' }),
    tslib_1.__metadata("design:type", Array)
], BlisApp.prototype, "actions", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Entity_1.Entity, name: 'entity' }),
    tslib_1.__metadata("design:type", Array)
], BlisApp.prototype, "entities", void 0);
exports.BlisApp = BlisApp;
//# sourceMappingURL=SnippetList.js.map
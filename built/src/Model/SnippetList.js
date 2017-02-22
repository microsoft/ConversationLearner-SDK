"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
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
var SnippetList = (function () {
    function SnippetList(init) {
        this.snippets = undefined;
        Object.assign(this, init);
    }
    return SnippetList;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Snippet, name: 'snippetlist' }),
    tslib_1.__metadata("design:type", Array)
], SnippetList.prototype, "snippets", void 0);
exports.SnippetList = SnippetList;
//# sourceMappingURL=SnippetList.js.map
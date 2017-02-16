"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Turn = (function () {
    function Turn() {
    }
    return Turn;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('user_text'),
    tslib_1.__metadata("design:type", Array)
], Turn.prototype, "userText", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('action'),
    tslib_1.__metadata("design:type", String)
], Turn.prototype, "action", void 0);
exports.Turn = Turn;
var Snippet = (function () {
    function Snippet() {
    }
    return Snippet;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Turn, name: 'turns' }),
    tslib_1.__metadata("design:type", Array)
], Snippet.prototype, "turns", void 0);
exports.Snippet = Snippet;
var SnippetList = (function () {
    function SnippetList() {
    }
    return SnippetList;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Snippet, name: 'snippetlist' }),
    tslib_1.__metadata("design:type", Array)
], SnippetList.prototype, "snippets", void 0);
exports.SnippetList = SnippetList;
//# sourceMappingURL=SnippetList.js.map
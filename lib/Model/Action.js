"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Action = (function () {
    function Action(init) {
        this.id = undefined;
        this.actionType = undefined;
        this.content = undefined;
        this.negativeEntities = undefined;
        this.requiredEntities = undefined;
        Object.assign(this, init);
    }
    Action.GetEntitySuggestion = function (action) {
        if (!action)
            return null;
        var words = this.Split(action);
        for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
            var word = words_1[_i];
            if (word.startsWith("!")) {
                // Key is in form of $entityName
                var entityName = word.substr(1, word.length - 1);
                return entityName;
            }
        }
        return null;
    };
    Action.Split = function (action) {
        return action.split(/[\s,:.?]+/);
    };
    return Action;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('id'),
    tslib_1.__metadata("design:type", String)
], Action.prototype, "id", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('action_type'),
    tslib_1.__metadata("design:type", String)
], Action.prototype, "actionType", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('content'),
    tslib_1.__metadata("design:type", String)
], Action.prototype, "content", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('NegativeEntities'),
    tslib_1.__metadata("design:type", Array)
], Action.prototype, "negativeEntities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('RequiredEntities'),
    tslib_1.__metadata("design:type", Array)
], Action.prototype, "requiredEntities", void 0);
exports.Action = Action;
//# sourceMappingURL=Action.js.map
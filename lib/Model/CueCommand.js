"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Serializable_1 = require("./Serializable");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var CueCommand = (function (_super) {
    tslib_1.__extends(CueCommand, _super);
    function CueCommand(init) {
        var _this = _super.call(this) || this;
        _this.commandName = undefined;
        _this.args = undefined;
        Object.assign(_this, init);
        return _this;
    }
    return CueCommand;
}(Serializable_1.Serializable));
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('commandName'),
    tslib_1.__metadata("design:type", String)
], CueCommand.prototype, "commandName", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('args'),
    tslib_1.__metadata("design:type", String)
], CueCommand.prototype, "args", void 0);
exports.CueCommand = CueCommand;
//# sourceMappingURL=CueCommand.js.map
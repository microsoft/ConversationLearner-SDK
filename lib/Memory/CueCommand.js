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
    CueCommand.Set = function (cueCommand) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!cueCommand) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.memory.SetAsync(this.MEMKEY, cueCommand.Serialize())];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.memory.DeleteAsync(this.MEMKEY)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CueCommand.Get = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var value;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.memory.GetAsync(this.MEMKEY)];
                    case 1:
                        value = _a.sent();
                        return [2 /*return*/, CueCommand.Deserialize(CueCommand, value)];
                }
            });
        });
    };
    CueCommand.Clear = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Set(null)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return CueCommand;
}(Serializable_1.Serializable));
CueCommand.MEMKEY = "CUECOMMAND";
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
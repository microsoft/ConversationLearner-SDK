"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Action_1 = require("./Action");
var Entity_1 = require("./Entity");
var AltText = (function () {
    function AltText(init) {
        this.text = undefined;
        Object.assign(this, init);
    }
    return AltText;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('text'),
    tslib_1.__metadata("design:type", String)
], AltText.prototype, "text", void 0);
exports.AltText = AltText;
var TextEntity = (function () {
    function TextEntity(init) {
        this.endToken = undefined;
        this.entityId = undefined;
        this.startToken = undefined;
        Object.assign(this, init);
    }
    return TextEntity;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('EndToken'),
    tslib_1.__metadata("design:type", Number)
], TextEntity.prototype, "endToken", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('EntityType'),
    tslib_1.__metadata("design:type", String)
], TextEntity.prototype, "entityId", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('StartToken'),
    tslib_1.__metadata("design:type", Number)
], TextEntity.prototype, "startToken", void 0);
exports.TextEntity = TextEntity;
var Input = (function () {
    function Input(init) {
        this.context = undefined;
        this.entityIds = undefined;
        this.maskedActionIds = undefined;
        this.text = undefined;
        this.textAlts = undefined;
        this.textEntities = undefined;
        Object.assign(this, init);
    }
    Input.prototype.toText = function (client, appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var text, _i, _a, entityId, entityName, entityValue;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        text = "" + this.text;
                        _i = 0, _a = this.entityIds;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        entityId = _a[_i];
                        return [4 /*yield*/, Entity_1.Entity.toText(client, appId, entityId)];
                    case 2:
                        entityName = _b.sent();
                        entityValue = this.EntityValue(entityId);
                        text += " [" + entityName + " " + entityValue + "]";
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, text];
                }
            });
        });
    };
    Input.prototype.EntityValue = function (entityId) {
        for (var _i = 0, _a = this.textEntities; _i < _a.length; _i++) {
            var textEntity = _a[_i];
            if (textEntity.entityId == entityId) {
                return this.text.slice(textEntity.startToken, textEntity.endToken + 1);
            }
        }
    };
    return Input;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('context'),
    tslib_1.__metadata("design:type", Object)
], Input.prototype, "context", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('entities'),
    tslib_1.__metadata("design:type", Array)
], Input.prototype, "entityIds", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('masked-actions'),
    tslib_1.__metadata("design:type", Array)
], Input.prototype, "maskedActionIds", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('text'),
    tslib_1.__metadata("design:type", String)
], Input.prototype, "text", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: AltText, name: 'text-alts' }),
    tslib_1.__metadata("design:type", Array)
], Input.prototype, "textAlts", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: TextEntity, name: 'text-entities' }),
    tslib_1.__metadata("design:type", Array)
], Input.prototype, "textEntities", void 0);
exports.Input = Input;
var Turn = (function () {
    function Turn(init) {
        this.input = undefined;
        this.actionId = undefined;
        Object.assign(this, init);
    }
    Turn.prototype.toText = function (client, appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var inputText, actionText, text;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.input.toText(client, appId)];
                    case 1:
                        inputText = _a.sent();
                        return [4 /*yield*/, Action_1.Action.toText(client, appId, this.actionId)];
                    case 2:
                        actionText = _a.sent();
                        text = inputText + "\n\n     " + actionText;
                        return [2 /*return*/, text];
                }
            });
        });
    };
    return Turn;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Input, name: 'input' }),
    tslib_1.__metadata("design:type", Input)
], Turn.prototype, "input", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('output'),
    tslib_1.__metadata("design:type", String)
], Turn.prototype, "actionId", void 0);
exports.Turn = Turn;
var Dialog = (function () {
    function Dialog(init) {
        this.turns = undefined;
        Object.assign(this, init);
    }
    Dialog.prototype.toText = function (client, appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var text, _i, _a, turn, turnText;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        text = "";
                        _i = 0, _a = this.turns;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        turn = _a[_i];
                        return [4 /*yield*/, turn.toText(client, appId)];
                    case 2:
                        turnText = _b.sent();
                        text += turnText + "\n\n";
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, text];
                }
            });
        });
    };
    return Dialog;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Turn, name: 'turns' }),
    tslib_1.__metadata("design:type", Array)
], Dialog.prototype, "turns", void 0);
exports.Dialog = Dialog;
var TrainDialog = (function () {
    function TrainDialog(init) {
        this.id = undefined;
        this.dialog = undefined;
        Object.assign(this, init);
    }
    TrainDialog.prototype.toText = function (client, appId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var dialogText;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dialog.toText(client, appId)];
                    case 1:
                        dialogText = _a.sent();
                        return [2 /*return*/, "**" + this.id + "**\n\n" + dialogText];
                }
            });
        });
    };
    return TrainDialog;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('id'),
    tslib_1.__metadata("design:type", String)
], TrainDialog.prototype, "id", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Dialog, name: 'dialog' }),
    tslib_1.__metadata("design:type", Dialog)
], TrainDialog.prototype, "dialog", void 0);
exports.TrainDialog = TrainDialog;
//# sourceMappingURL=TrainDialog.js.map
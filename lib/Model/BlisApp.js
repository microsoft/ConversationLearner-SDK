"use strict";
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Action_1 = require("./Action");
var Entity_1 = require("./Entity");
var TrainDialog_1 = require("./TrainDialog");
var BlisApp = (function () {
    function BlisApp(init) {
        this.actions = undefined;
        this.entities = undefined;
        this.trainDialogs = undefined;
        this.appVersion = undefined;
        Object.assign(this, init);
    }
    BlisApp.prototype.findTrainDialogs = function (client, appId, searchTerm) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var dialogs, _i, _a, trainDialog, dialog;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dialogs = [];
                        _i = 0, _a = this.trainDialogs;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        trainDialog = _a[_i];
                        return [4 /*yield*/, trainDialog.toText(client, appId)];
                    case 2:
                        dialog = _b.sent();
                        if (!searchTerm || dialog.indexOf(searchTerm) > 0) {
                            dialogs.push({ 'dialogId': trainDialog.id, 'text': dialog });
                        }
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, dialogs];
                }
            });
        });
    };
    return BlisApp;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Action_1.Action, name: 'actions' }),
    tslib_1.__metadata("design:type", Array)
], BlisApp.prototype, "actions", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: Entity_1.Entity, name: 'entities' }),
    tslib_1.__metadata("design:type", Array)
], BlisApp.prototype, "entities", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: TrainDialog_1.TrainDialog, name: 'traindialogs' }),
    tslib_1.__metadata("design:type", Array)
], BlisApp.prototype, "trainDialogs", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty({ clazz: TrainDialog_1.TrainDialog, name: 'blis-app-version' }),
    tslib_1.__metadata("design:type", Array)
], BlisApp.prototype, "appVersion", void 0);
exports.BlisApp = BlisApp;
//# sourceMappingURL=BlisApp.js.map
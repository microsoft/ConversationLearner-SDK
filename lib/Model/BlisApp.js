"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var blis_models_1 = require("blis-models");
var BlisApp = (function (_super) {
    tslib_1.__extends(BlisApp, _super);
    function BlisApp() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BlisApp.Sort = function (apps) {
        return apps.sort(function (n1, n2) {
            var c1 = n1.appName.toLowerCase();
            var c2 = n2.appName.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2) {
                return -1;
            }
            return 0;
        });
    };
    return BlisApp;
}(blis_models_1.BlisAppBase));
exports.BlisApp = BlisApp;
//# sourceMappingURL=BlisApp.js.map
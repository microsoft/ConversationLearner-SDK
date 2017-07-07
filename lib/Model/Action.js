"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var blis_models_1 = require("blis-models");
var Action = (function (_super) {
    tslib_1.__extends(Action, _super);
    function Action() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /** Returns true if content of action is equal */
    /** ID, version and package do not matter      */
    Action.prototype.Equal = function (action) {
        if (this.payload != action.payload)
            return false;
        if (this.isTerminal != action.isTerminal)
            return false;
        if (this.negativeEntities.length != action.negativeEntities.length)
            return false;
        if (this.requiredEntities.length != action.requiredEntities.length)
            return false;
        for (var _i = 0, _a = this.negativeEntities; _i < _a.length; _i++) {
            var negEntity = _a[_i];
            if (action.negativeEntities.indexOf(negEntity) < 0)
                return false;
        }
        for (var _b = 0, _c = this.requiredEntities; _b < _c.length; _b++) {
            var reqEntity = _c[_b];
            if (action.requiredEntities.indexOf(reqEntity) < 0)
                return false;
        }
        return this.metadata.Equal(action.metadata);
    };
    Action.Sort = function (actions) {
        return actions.sort(function (n1, n2) {
            var c1 = n1.payload.toLowerCase();
            var c2 = n2.payload.toLowerCase();
            if (c1 > c2) {
                return 1;
            }
            if (c1 < c2) {
                return -1;
            }
            return 0;
        });
    };
    return Action;
}(blis_models_1.ActionBase));
exports.Action = Action;
//# sourceMappingURL=Action.js.map
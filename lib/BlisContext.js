"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BlisMemory_1 = require("./BlisMemory");
var Consts_1 = require("./Model/Consts");
var BlisContext = (function () {
    function BlisContext(bot, session) {
        this.bot = bot;
        this.session = session;
    }
    BlisContext.prototype.State = function (key) {
        if (key) {
            return this.session.userData.Blis[key];
        }
        return this.session.userData.Blis;
    };
    BlisContext.prototype.SetState = function (key, value) {
        if (key) {
            return this.session.userData.Blis[key] = value;
        }
    };
    BlisContext.prototype.InitState = function (appId) {
        this.session.userData.Blis = {};
        this.SetState(Consts_1.UserStates.APP, appId);
        this.SetState(Consts_1.UserStates.MODEL, null);
        this.SetState(Consts_1.UserStates.SESSION, null);
        this.SetState(Consts_1.UserStates.TEACH, false);
        this.SetState(Consts_1.UserStates.DEBUG, false);
        this.SetState(Consts_1.UserStates.MEMORY, {});
        this.SetState(Consts_1.UserStates.ENTITYLOOKUP, {});
        this.SetState(Consts_1.UserStates.LASTSTEP, null);
        this.SetState(Consts_1.UserStates.CURSTEP, null);
        this.SetState(Consts_1.UserStates.TRAINSTEPS, []);
        this.SetState(Consts_1.UserStates.CUECOMMAND, null);
        this.SetState(Consts_1.UserStates.PAGE, null);
    };
    BlisContext.prototype.Address = function () {
        return this.session.message.address;
    };
    BlisContext.prototype.Memory = function () {
        return new BlisMemory_1.BlisMemory(this.session);
    };
    return BlisContext;
}());
exports.BlisContext = BlisContext;
//# sourceMappingURL=BlisContext.js.map
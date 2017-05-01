"use strict";
var Consts_1 = require("./Model/Consts");
var BlisDebug_1 = require("./BlisDebug");
var BlisUserState = (function () {
    function BlisUserState(appId) {
        this[Consts_1.UserStates.APP] = appId;
        this[Consts_1.UserStates.MODEL] = null;
        this[Consts_1.UserStates.SESSION] = null;
        this[Consts_1.UserStates.TEACH] = false;
        this[Consts_1.UserStates.DEBUG] = false;
        this[Consts_1.UserStates.MEMORY] = {};
        this[Consts_1.UserStates.ENTITYLOOKUP] = {};
        this[Consts_1.UserStates.LASTSTEP] = null;
        this[Consts_1.UserStates.SAVELOOKUP] = {};
        this[Consts_1.UserStates.CURSTEP] = null;
        this[Consts_1.UserStates.TRAINSTEPS] = [];
        this[Consts_1.UserStates.CUECOMMAND] = null;
        this[Consts_1.UserStates.PAGE] = null;
    }
    BlisUserState.Get = function (bot, address, defaultApp, cb) {
        bot.loadSession(address, function (error, session) {
            if (error) {
                cb(error, null, null);
            }
            else if (!session.userData.Blis) {
                session.userData.Blis = new BlisUserState(defaultApp);
                cb(null, session.userData.Blis, true);
            }
            else {
                cb(null, session.userData.Blis, false);
            }
        });
    };
    BlisUserState.Save = function (context) {
        context.bot.loadSession(context.address, function (error, session) {
            if (error) {
                BlisDebug_1.BlisDebug.LogObject(error);
            }
            else {
                if (!session.userData.Blis) {
                    session.userData.Blis = {};
                }
                session.userData.Blis[Consts_1.UserStates.APP] = context.state[Consts_1.UserStates.APP];
                session.userData.Blis[Consts_1.UserStates.MODEL] = context.state[Consts_1.UserStates.MODEL];
                session.userData.Blis[Consts_1.UserStates.SESSION] = context.state[Consts_1.UserStates.SESSION];
                session.userData.Blis[Consts_1.UserStates.TEACH] = context.state[Consts_1.UserStates.TEACH];
                session.userData.Blis[Consts_1.UserStates.DEBUG] = context.state[Consts_1.UserStates.DEBUG];
                session.userData.Blis[Consts_1.UserStates.MEMORY] = context.state[Consts_1.UserStates.MEMORY];
                session.userData.Blis[Consts_1.UserStates.ENTITYLOOKUP] = context.state[Consts_1.UserStates.ENTITYLOOKUP];
                session.userData.Blis[Consts_1.UserStates.LASTSTEP] = context.state[Consts_1.UserStates.LASTSTEP];
                session.userData.Blis[Consts_1.UserStates.SAVELOOKUP] = context.state[Consts_1.UserStates.SAVELOOKUP];
                session.userData.Blis[Consts_1.UserStates.CURSTEP] = context.state[Consts_1.UserStates.CURSTEP];
                session.userData.Blis[Consts_1.UserStates.TRAINSTEPS] = context.state[Consts_1.UserStates.TRAINSTEPS];
                session.userData.Blis[Consts_1.UserStates.CUECOMMAND] = context.state[Consts_1.UserStates.CUECOMMAND];
                session.userData.Blis[Consts_1.UserStates.PAGE] = context.state[Consts_1.UserStates.PAGE];
                session.save();
            }
        });
    };
    return BlisUserState;
}());
exports.BlisUserState = BlisUserState;
//# sourceMappingURL=BlisUserState.js.map
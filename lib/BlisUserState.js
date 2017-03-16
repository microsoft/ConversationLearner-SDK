"use strict";
var Consts_1 = require("./Model/Consts");
var BlisDebug_1 = require("./BlisDebug");
var BlisUserState = (function () {
    function BlisUserState() {
    }
    BlisUserState.Get = function (bot, address, defaultApp, cb) {
        bot.loadSession(address, function (error, session) {
            if (error) {
                cb(error, null, null);
            }
            else if (!session.userData.Blis) {
                session.userData.Blis = {};
                session.userData.Blis[Consts_1.UserStates.APP] = defaultApp;
                session.userData.Blis[Consts_1.UserStates.MODEL] = null;
                session.userData.Blis[Consts_1.UserStates.SESSION] = null;
                session.userData.Blis[Consts_1.UserStates.TEACH] = false;
                session.userData.Blis[Consts_1.UserStates.DEBUG] = false;
                session.userData.Blis[Consts_1.UserStates.MEMORY] = {};
                session.userData.Blis[Consts_1.UserStates.ENTITYLOOKUP] = {};
                session.userData.Blis[Consts_1.UserStates.LASTINPUT] = null;
                session.userData.Blis[Consts_1.UserStates.TRAINSTEPS] = [];
                cb(null, session.userData.Blis, true);
            }
            else {
                cb(null, session.userData.Blis, false);
            }
        });
    };
    BlisUserState.Save = function (bot, address, userData) {
        bot.loadSession(address, function (error, session) {
            if (error) {
                BlisDebug_1.BlisDebug.LogObject(error);
            }
            else {
                if (!session.userData.Blis) {
                    session.userData.Blis = {};
                }
                session.userData.Blis[Consts_1.UserStates.APP] = userData[Consts_1.UserStates.APP];
                session.userData.Blis[Consts_1.UserStates.MODEL] = userData[Consts_1.UserStates.MODEL];
                session.userData.Blis[Consts_1.UserStates.SESSION] = userData[Consts_1.UserStates.SESSION];
                session.userData.Blis[Consts_1.UserStates.TEACH] = userData[Consts_1.UserStates.TEACH];
                session.userData.Blis[Consts_1.UserStates.DEBUG] = userData[Consts_1.UserStates.DEBUG];
                session.userData.Blis[Consts_1.UserStates.MEMORY] = userData[Consts_1.UserStates.MEMORY];
                session.userData.Blis[Consts_1.UserStates.ENTITYLOOKUP] = userData[Consts_1.UserStates.ENTITYLOOKUP];
                session.userData.Blis[Consts_1.UserStates.LASTINPUT] = userData[Consts_1.UserStates.LASTINPUT];
                session.userData.Blis[Consts_1.UserStates.TRAINSTEPS] = userData[Consts_1.UserStates.TRAINSTEPS];
                session.save();
            }
        });
    };
    return BlisUserState;
}());
exports.BlisUserState = BlisUserState;
//# sourceMappingURL=BlisUserState.js.map
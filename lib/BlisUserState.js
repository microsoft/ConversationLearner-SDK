"use strict";
var Consts_1 = require("./Model/Consts");
var BlisDebug_1 = require("./BlisDebug");
var BlisUserState = (function () {
    function BlisUserState() {
    }
    BlisUserState.Get = function (bot, address, defaultApp, cb) {
        var _this = this;
        bot.loadSession(address, function (error, session) {
            if (error) {
                cb(error, null, null);
            }
            else if (!session.userData.Blis) {
                session.userData.Blis = _this.InitState(defaultApp);
                cb(null, session.userData.Blis, true);
            }
            else {
                cb(null, session.userData.Blis, false);
            }
        });
    };
    BlisUserState.InitState = function (appId, userState) {
        if (!userState) {
            userState = new BlisUserState();
        }
        userState[Consts_1.UserStates.APP] = appId;
        userState[Consts_1.UserStates.MODEL] = null;
        userState[Consts_1.UserStates.SESSION] = null;
        userState[Consts_1.UserStates.TEACH] = false;
        userState[Consts_1.UserStates.DEBUG] = false;
        userState[Consts_1.UserStates.MEMORY] = {};
        userState[Consts_1.UserStates.ENTITYLOOKUP] = {};
        userState[Consts_1.UserStates.LASTSTEP] = null;
        userState[Consts_1.UserStates.SAVELOOKUP] = {};
        userState[Consts_1.UserStates.TRAINSTEPS] = [];
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
                session.userData.Blis[Consts_1.UserStates.LASTSTEP] = userData[Consts_1.UserStates.LASTSTEP];
                session.userData.Blis[Consts_1.UserStates.SAVELOOKUP] = userData[Consts_1.UserStates.SAVELOOKUP];
                session.userData.Blis[Consts_1.UserStates.TRAINSTEPS] = userData[Consts_1.UserStates.TRAINSTEPS];
                session.save();
            }
        });
    };
    return BlisUserState;
}());
exports.BlisUserState = BlisUserState;
//# sourceMappingURL=BlisUserState.js.map
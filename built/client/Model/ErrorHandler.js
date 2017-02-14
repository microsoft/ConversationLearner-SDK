"use strict";
function HandleError(text) {
    console.log("!!!! " + text);
    throw new Error(text);
}
exports.HandleError = HandleError;
function Debug(obj) {
    console.log("-> " + JSON.stringify(obj));
}
exports.Debug = Debug;
//# sourceMappingURL=ErrorHandler.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Consts_1 = require("./Consts");
// For keeping track of paging UI elements
var Pager = (function () {
    function Pager(index, numPages, search) {
        this.index = index;
        this.numPages = numPages;
        this.search = search;
    }
    Pager.Init = function (session, search) {
        var page = new Pager(0, 0, search);
        session.userData.Blis[Consts_1.UserStates.PAGE] = page;
    };
    Pager.Index = function (session) {
        var page = session.userData.Blis[Consts_1.UserStates.PAGE];
        return page.index;
    };
    /** Update the length */
    Pager.SetLength = function (session, length) {
        var page = session.userData.Blis[Consts_1.UserStates.PAGE];
        page.length = length;
        // Make sure still in bounds (i.e. handle deleted items in list)
        if (page.index > page.length - 1) {
            page.index = page.length - 1;
        }
        return page;
    };
    Pager.SearchTerm = function (session) {
        var page = session.userData.Blis[Consts_1.UserStates.PAGE];
        return page.search;
    };
    Pager.Next = function (session) {
        var page = session.userData.Blis[Consts_1.UserStates.PAGE];
        page.index++;
        // Loop if at end
        if (page.index > page.length - 1) {
            page.index = 0;
        }
        return page;
    };
    Pager.Prev = function (session) {
        var page = session.userData.Blis[Consts_1.UserStates.PAGE];
        page.index--;
        // Loop if at start
        if (page.index < 0) {
            page.index = page.length - 1;
        }
        return page;
    };
    return Pager;
}());
exports.Pager = Pager;
//# sourceMappingURL=Pager.js.map
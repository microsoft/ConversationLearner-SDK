"use strict";
var Consts_1 = require("./Model/Consts");
var Utils_1 = require("./Utils");
var Menu = (function () {
    function Menu() {
    }
    Menu.EditApp = function (newLine) {
        var cards = [];
        if (newLine)
            cards.push(null);
        cards.push(Utils_1.Utils.MakeHero("Entities", null, null, {
            "View": Consts_1.Commands.ENTITIES,
            "Add": Consts_1.IntCommands.ADDENTITY
        }));
        cards.push(Utils_1.Utils.MakeHero("Responses", null, null, {
            "View": Consts_1.Commands.RESPONSES,
            "Add": Consts_1.IntCommands.ADDRESPONSE
        }));
        cards.push(Utils_1.Utils.MakeHero("API Calls", null, null, {
            "View": Consts_1.Commands.APICALLS,
            "Add": Consts_1.IntCommands.ADDAPICALL
        }));
        cards = cards.concat(this.Apps("Apps"));
        cards.push(Utils_1.Utils.MakeHero(null, null, null, {
            "DONE": Consts_1.IntCommands.HOME
        }));
        return cards;
    };
    Menu.NotLoaded = function (title, subheader, body) {
        var cards = [];
        cards.push(Utils_1.Utils.MakeHero(title, subheader, body, {
            "My Apps": "" + Consts_1.Commands.APPS,
            "Create": "" + Consts_1.Commands.CREATEAPP,
        }));
        return cards;
    };
    Menu.Home = function (title, subheader, body) {
        var cards = [];
        cards.push(Utils_1.Utils.MakeHero(title, subheader, body, {
            "Start": Consts_1.Commands.START,
            "Teach": Consts_1.Commands.TEACH,
            "Edit": Consts_1.IntCommands.EDITAPP
        }));
        return cards;
    };
    Menu.Apps = function (title, subheader, body) {
        var cards = [];
        cards.push(Utils_1.Utils.MakeHero(title, subheader, body, {
            "View": Consts_1.Commands.APPS,
            "Create": Consts_1.Commands.CREATEAPP
        }));
        return cards;
    };
    return Menu;
}());
exports.Menu = Menu;
//# sourceMappingURL=Menu.js.map
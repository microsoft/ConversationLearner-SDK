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
            "List": Consts_1.Commands.ENTITIES,
            "Search": Consts_1.IntCommands.ENTITIES,
            "Add": Consts_1.IntCommands.ADDENTITY
        }));
        cards.push(Utils_1.Utils.MakeHero("Responses", null, null, {
            "List": Consts_1.Commands.RESPONSES,
            "Search": Consts_1.IntCommands.RESPONSES,
            "Add": Consts_1.IntCommands.ADDRESPONSE
        }));
        cards.push(Utils_1.Utils.MakeHero("API Calls", null, null, {
            "List": Consts_1.Commands.APICALLS,
            "Search": Consts_1.IntCommands.APICALLS,
            "Add": Consts_1.IntCommands.ADDAPICALL
        }));
        cards.push(null);
        cards.push(Utils_1.Utils.MakeHero("Train Dialogs", null, null, {
            "List": Consts_1.Commands.TRAINDIALOGS,
            "Search": Consts_1.IntCommands.TRAINDIALOGS,
            "Add": Consts_1.Commands.TEACH
        }));
        cards = cards.concat(this.Apps("Apps"));
        cards.push(Utils_1.Utils.MakeHero("Bot", null, null, {
            "Start": Consts_1.Commands.START,
            "Teach": Consts_1.Commands.TEACH,
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
            "List": Consts_1.Commands.APPS,
            "Search": Consts_1.IntCommands.APPS,
            "Create": Consts_1.IntCommands.CREATEAPP
        }));
        return cards;
    };
    Menu.EditError = function (message) {
        var responses = [];
        responses.push(message);
        return responses.concat(Menu.EditApp(true));
    };
    return Menu;
}());
exports.Menu = Menu;
//# sourceMappingURL=Menu.js.map
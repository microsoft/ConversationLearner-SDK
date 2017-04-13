"use strict";
var Consts_1 = require("./Model/Consts");
var CommandHandler_1 = require("./CommandHandler");
var Utils_1 = require("./Utils");
var Help_1 = require("./Model/Help");
var Menu = (function () {
    function Menu() {
    }
    Menu.AddEditApp = function (context, responses) {
        // Only add edit menu when not in teach mode
        if (context.state[Consts_1.UserStates.TEACH]) {
            return responses;
        }
        return responses.concat(Menu.EditApp(true));
    };
    Menu.EditApp = function (newLine) {
        var cards = [];
        if (newLine)
            cards.push(null);
        cards.push(Utils_1.Utils.MakeHero("Entities", null, null, {
            "List": CommandHandler_1.LineCommands.ENTITIES,
            "Search": CommandHandler_1.IntCommands.ENTITIES,
            "Add": CommandHandler_1.IntCommands.ADDENTITY
        }));
        cards.push(Utils_1.Utils.MakeHero("Responses", null, null, {
            "List": CommandHandler_1.LineCommands.RESPONSES,
            "Search": CommandHandler_1.IntCommands.RESPONSES,
            "Add": CommandHandler_1.IntCommands.ADDRESPONSE
        }));
        cards.push(Utils_1.Utils.MakeHero("API Calls", null, null, {
            "List": CommandHandler_1.LineCommands.APICALLS,
            "Search": CommandHandler_1.IntCommands.APICALLS,
            "Add": CommandHandler_1.IntCommands.ADDAPICALL
        }));
        cards.push(null);
        cards.push(Utils_1.Utils.MakeHero("Train Dialogs", null, null, {
            "List": CommandHandler_1.LineCommands.TRAINDIALOGS,
            "Search": CommandHandler_1.IntCommands.TRAINDIALOGS,
            "Add": CommandHandler_1.LineCommands.TEACH
        }));
        cards = cards.concat(this.AppPanel("Apps"));
        cards.push(Utils_1.Utils.MakeHero("Bot", null, null, {
            "Start": CommandHandler_1.LineCommands.START,
            "Teach": CommandHandler_1.LineCommands.TEACH,
        }));
        return cards;
    };
    Menu.Home = function (title, subheader, body) {
        var cards = [];
        cards.push(Utils_1.Utils.MakeHero(title, subheader, body, {
            "Start": CommandHandler_1.LineCommands.START,
            "Teach": CommandHandler_1.LineCommands.TEACH,
            "Edit": CommandHandler_1.IntCommands.EDITAPP
        }));
        return cards;
    };
    Menu.AppPanel = function (title, subheader, body) {
        var cards = [];
        cards.push(Utils_1.Utils.MakeHero(title, subheader, body, {
            "List": CommandHandler_1.LineCommands.APPS,
            "Search": CommandHandler_1.IntCommands.APPS,
            "Create": CommandHandler_1.IntCommands.CREATEAPP
        }));
        return cards;
    };
    Menu.AddAPICall = function () {
        var card = Utils_1.Utils.MakeHero("Add API Call", null, "Enter new API Call", {
            "Help": Help_1.Help.ADDAPICALL,
            "Cancel": CommandHandler_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.AddEntity = function () {
        var card = Utils_1.Utils.MakeHero("Add Entity", null, "Enter new Entity", {
            "Help": Help_1.Help.ADDENTITY,
            "Cancel": CommandHandler_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.AddResponse = function () {
        var card = Utils_1.Utils.MakeHero("Add Response", null, "Enter new Response", {
            "Help": Help_1.Help.ADDRESPONSE,
            "Cancel": CommandHandler_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.APICalls = function () {
        var card = Utils_1.Utils.MakeHero("Find API call", null, "Enter search term", {
            "Cancel": CommandHandler_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.Apps = function () {
        var card = Utils_1.Utils.MakeHero("Find App", null, "Enter search term", {
            "Cancel": CommandHandler_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.CreateApp = function (title) {
        if (title === void 0) { title = "Create App"; }
        var card = Utils_1.Utils.MakeHero(title, '{appName} {LUIS key}', "Enter new App name and Luis Key", {
            "Cancel": CommandHandler_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.EditAPICall = function (action) {
        var subheader = action ? action.content : null;
        var card = Utils_1.Utils.MakeHero("Edit API Call", subheader, "Enter new API Name", {
            "Help": Help_1.Help.EDITAPICALL,
            "Cancel": CommandHandler_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.EditEntity = function (entity) {
        var title = entity ? "Edit: (" + entity.name + ")" : "";
        var subheader = entity ? (entity.luisPreName ? entity.luisPreName : entity.entityType) : "";
        var type = entity.luisPreName ? entity.luisPreName : entity.entityType;
        var card = Utils_1.Utils.MakeHero(title, subheader, "Enter new Entity name", {
            "Help": Help_1.Help.EDITENTITY,
            "Cancel": CommandHandler_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.EditResponse = function (action) {
        var subheader = action ? action.content : null;
        var card = Utils_1.Utils.MakeHero("Edit Response", subheader, "Enter new Response context", {
            "Help": Help_1.Help.EDITRESPONSE,
            "Cancel": CommandHandler_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.Entities = function () {
        var card = Utils_1.Utils.MakeHero("Find Entity", null, "Enter search term", {
            "Cancel": CommandHandler_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.Responses = function () {
        var card = Utils_1.Utils.MakeHero("Find Response", null, "Enter search term", {
            "Cancel": CommandHandler_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.TrainDialogs = function () {
        var card = Utils_1.Utils.MakeHero("Find Training Dialog", null, "Enter search term", {
            "Cancel": CommandHandler_1.IntCommands.CANCEL
        });
        return card;
    };
    return Menu;
}());
exports.Menu = Menu;
//# sourceMappingURL=Menu.js.map
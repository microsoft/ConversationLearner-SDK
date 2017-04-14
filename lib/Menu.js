"use strict";
var Consts_1 = require("./Model/Consts");
var Command_1 = require("./Model/Command");
var Utils_1 = require("./Utils");
var Menu = (function () {
    function Menu() {
    }
    Menu.AddEditCards = function (context, responses) {
        // Only add edit menu when not in teach mode
        if (context.state[Consts_1.UserStates.TEACH]) {
            return responses;
        }
        return responses.concat(Menu.EditCards(true));
    };
    Menu.EditCards = function (newLine) {
        var cards = [];
        if (newLine)
            cards.push(null);
        cards.push(Utils_1.Utils.MakeHero("Entities", null, null, {
            "List": Command_1.LineCommands.ENTITIES,
            "Search": Command_1.CueCommands.ENTITIES,
            "Add": Command_1.CueCommands.ADDENTITY
        }));
        cards.push(Utils_1.Utils.MakeHero("Responses", null, null, {
            "List": Command_1.LineCommands.RESPONSES,
            "Search": Command_1.CueCommands.RESPONSES,
            "Add": Command_1.CueCommands.ADDRESPONSE
        }));
        cards.push(Utils_1.Utils.MakeHero("API Calls", null, null, {
            "List": Command_1.LineCommands.CUEAPICALLS,
            "Search": Command_1.IntCommands.APICALLS,
            "Add": Command_1.IntCommands.CHOOSEAPITYPE
        }));
        cards.push(null);
        cards.push(Utils_1.Utils.MakeHero("Train Dialogs", null, null, {
            "List": Command_1.LineCommands.TRAINDIALOGS,
            "Search": Command_1.CueCommands.TRAINDIALOGS,
            "Add": Command_1.LineCommands.TEACH
        }));
        cards = cards.concat(this.AppPanel("Apps"));
        cards.push(Utils_1.Utils.MakeHero("Bot", null, null, {
            "Start": Command_1.LineCommands.START,
            "Teach": Command_1.LineCommands.TEACH,
        }));
        return cards;
    };
    Menu.Home = function (title, subheader, body) {
        if (title === void 0) { title = ""; }
        if (subheader === void 0) { subheader = ""; }
        if (body === void 0) { body = ""; }
        var card = Utils_1.Utils.MakeHero(title, subheader, body, {
            "Start": Command_1.LineCommands.START,
            "Teach": Command_1.LineCommands.TEACH,
            "Edit": Command_1.IntCommands.EDITAPP
        });
        return card;
    };
    Menu.AppPanel = function (title, subheader, body) {
        var cards = [];
        cards.push(Utils_1.Utils.MakeHero(title, subheader, body, {
            "List": Command_1.LineCommands.APPS,
            "Search": Command_1.CueCommands.APPS,
            "Create": Command_1.CueCommands.CREATEAPP
        }));
        return cards;
    };
    Menu.ChooseAPICall = function () {
        var card = Utils_1.Utils.MakeHero("Add API Call", null, "Local or Azure Functions call?", {
            "Azure": Command_1.CueCommands.ADDAPIAZURE,
            "Local": Command_1.CueCommands.ADDAPILOCAL,
            "Help": Command_1.HelpCommands.ADDAPICALL,
            "Cancel": Command_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.AddAzureApi = function (title) {
        if (title === void 0) { title = "Add Azure Function Call"; }
        var card = Utils_1.Utils.MakeHero(title, '{function name} {args}', "Enter Function Name and args", {
            "Help": Command_1.HelpCommands.ADDAZUREAPI,
            "Cancel": Command_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.AddLocalApi = function (title) {
        if (title === void 0) { title = "Add Local API Call"; }
        var card = Utils_1.Utils.MakeHero(title, '{function name} {args}', "Enter Function Name and args", {
            "Help": Command_1.HelpCommands.ADDAPICALL,
            "Cancel": Command_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.AddEntity = function () {
        var card = Utils_1.Utils.MakeHero("Add Entity", null, "Enter new Entity", {
            "Help": Command_1.HelpCommands.ADDENTITY,
            "Cancel": Command_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.AddResponse = function () {
        var card = Utils_1.Utils.MakeHero("Add Response", null, "Enter new Response", {
            "Help": Command_1.HelpCommands.ADDRESPONSE,
            "Cancel": Command_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.APICalls = function () {
        var card = Utils_1.Utils.MakeHero("Find API call", null, "Enter search term", {
            "Cancel": Command_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.Apps = function () {
        var card = Utils_1.Utils.MakeHero("Find App", null, "Enter search term", {
            "Cancel": Command_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.CreateApp = function (title) {
        if (title === void 0) { title = "Create App"; }
        var card = Utils_1.Utils.MakeHero(title, '{appName} {LUIS key}', "Enter new App name and Luis Key", {
            "Cancel": Command_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.EditAPICall = function (action) {
        var subheader = action ? action.content : null;
        var card = Utils_1.Utils.MakeHero("Edit API Call", subheader, "Enter new API Name", {
            "Help": Command_1.HelpCommands.EDITAPICALL,
            "Cancel": Command_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.EditEntity = function (entity) {
        var title = entity ? "Edit: (" + entity.name + ")" : "";
        var subheader = entity ? (entity.luisPreName ? entity.luisPreName : entity.entityType) : "";
        var type = entity.luisPreName ? entity.luisPreName : entity.entityType;
        var card = Utils_1.Utils.MakeHero(title, subheader, "Enter new Entity name", {
            "Help": Command_1.HelpCommands.EDITENTITY,
            "Cancel": Command_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.EditResponse = function (action) {
        var subheader = action ? action.content : null;
        var card = Utils_1.Utils.MakeHero("Edit Response", subheader, "Enter new Response context", {
            "Help": Command_1.HelpCommands.EDITRESPONSE,
            "Cancel": Command_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.Entities = function () {
        var card = Utils_1.Utils.MakeHero("Find Entity", null, "Enter search term", {
            "Cancel": Command_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.Responses = function () {
        var card = Utils_1.Utils.MakeHero("Find Response", null, "Enter search term", {
            "Cancel": Command_1.IntCommands.CANCEL
        });
        return card;
    };
    Menu.TrainDialogs = function () {
        var card = Utils_1.Utils.MakeHero("Find Training Dialog", null, "Enter search term", {
            "Cancel": Command_1.IntCommands.CANCEL
        });
        return card;
    };
    return Menu;
}());
exports.Menu = Menu;
//# sourceMappingURL=Menu.js.map
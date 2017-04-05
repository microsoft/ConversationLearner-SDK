"use strict";
var Command = (function () {
    function Command(name, description, detail, args, examples) {
        this.name = name;
        this.description = description;
        this.detail = detail;
        this.args = args;
        this.examples = examples;
    }
    return Command;
}());
exports.Command = Command;
//# sourceMappingURL=Command.js.map
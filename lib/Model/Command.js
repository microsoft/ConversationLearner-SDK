"use strict";
var Command = (function () {
    function Command(name, description, args, examples) {
        this.name = name;
        this.description = description;
        this.args = args;
        this.examples = examples;
    }
    return Command;
}());
exports.Command = Command;
//# sourceMappingURL=Command.js.map
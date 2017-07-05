"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var UserInput = (function () {
    function UserInput(init) {
        this.text = undefined;
        Object.assign(this, init);
    }
    return UserInput;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty("text"),
    tslib_1.__metadata("design:type", String)
], UserInput.prototype, "text", void 0);
exports.UserInput = UserInput;
//# sourceMappingURL=UserInput.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Serializable = (function () {
    function Serializable(init) {
        Object.assign(this, init);
    }
    Serializable.prototype.Serialize = function () {
        return JSON.stringify(json_typescript_mapper_1.serialize(this));
    };
    Serializable.Deserialize = function (type, text) {
        var json = JSON.parse(text);
        return json_typescript_mapper_1.deserialize(type, json);
    };
    return Serializable;
}());
exports.Serializable = Serializable;
//# sourceMappingURL=Serializable.js.map
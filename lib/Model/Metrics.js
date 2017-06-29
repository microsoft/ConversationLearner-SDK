"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var json_typescript_mapper_1 = require("json-typescript-mapper");
var Metrics = (function () {
    function Metrics(init) {
        this.wallTime = undefined;
        Object.assign(this, init);
    }
    return Metrics;
}());
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('wallTime'),
    tslib_1.__metadata("design:type", Number)
], Metrics.prototype, "wallTime", void 0);
exports.Metrics = Metrics;
//# sourceMappingURL=Metrics.js.map
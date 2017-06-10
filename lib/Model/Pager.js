"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Serializable_1 = require("./Serializable");
var json_typescript_mapper_1 = require("json-typescript-mapper");
// For keeping track of paging UI elements
var Pager = (function (_super) {
    tslib_1.__extends(Pager, _super);
    function Pager(init) {
        var _this = _super.call(this) || this;
        _this.index = undefined;
        _this.numPages = undefined;
        _this.search = undefined;
        _this.length = undefined;
        Object.assign(_this, init);
        return _this;
    }
    Pager.Init = function (context, search) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var page;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        page = new Pager({ index: 0, numPages: 0, search: search });
                        return [4 /*yield*/, context.Memory().SetPager(page)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Pager.Index = function (context) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var page;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, context.Memory().Pager()];
                    case 1:
                        page = _a.sent();
                        return [2 /*return*/, page.index];
                }
            });
        });
    };
    /** Update the length */
    Pager.SetLength = function (context, length) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var page;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, context.Memory().Pager()];
                    case 1:
                        page = _a.sent();
                        page.length = length;
                        // Make sure still in bounds (i.e. handle deleted items in list)
                        if (page.index > page.length - 1) {
                            page.index = page.length - 1;
                        }
                        return [2 /*return*/, page];
                }
            });
        });
    };
    Pager.SearchTerm = function (context) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var page;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, context.Memory().Pager()];
                    case 1:
                        page = _a.sent();
                        return [2 /*return*/, page.search];
                }
            });
        });
    };
    Pager.Next = function (context) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var page;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, context.Memory().Pager()];
                    case 1:
                        page = _a.sent();
                        page.index++;
                        // Loop if at end
                        if (page.index > page.length - 1) {
                            page.index = 0;
                        }
                        return [2 /*return*/, page];
                }
            });
        });
    };
    Pager.Prev = function (context) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var page;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, context.Memory().Pager()];
                    case 1:
                        page = _a.sent();
                        page.index--;
                        // Loop if at start
                        if (page.index < 0) {
                            page.index = page.length - 1;
                        }
                        return [2 /*return*/, page];
                }
            });
        });
    };
    return Pager;
}(Serializable_1.Serializable));
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('index'),
    tslib_1.__metadata("design:type", Number)
], Pager.prototype, "index", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('numPages'),
    tslib_1.__metadata("design:type", Number)
], Pager.prototype, "numPages", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('search'),
    tslib_1.__metadata("design:type", String)
], Pager.prototype, "search", void 0);
tslib_1.__decorate([
    json_typescript_mapper_1.JsonProperty('length'),
    tslib_1.__metadata("design:type", Number)
], Pager.prototype, "length", void 0);
exports.Pager = Pager;
//# sourceMappingURL=Pager.js.map
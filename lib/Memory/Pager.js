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
    Pager.Get = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var data;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.memory) {
                            throw new Error("TrainHistory called without initialzing memory");
                        }
                        return [4 /*yield*/, this.memory.GetAsync(this.MEMKEY)];
                    case 1:
                        data = _a.sent();
                        if (data) {
                            return [2 /*return*/, Pager.Deserialize(Pager, data)];
                        }
                        return [2 /*return*/, new Pager()];
                }
            });
        });
    };
    Pager.Set = function (pager) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.memory) {
                            throw new Error("Pager called without initialzing memory");
                        }
                        if (!pager) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.memory.SetAsync(this.MEMKEY, pager.Serialize())];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.memory.DeleteAsync(this.MEMKEY)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Pager.Clear = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Set(null)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Pager.Init = function (search) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var pager;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.memory) {
                            throw new Error("Pager called without initialzing memory");
                        }
                        pager = new Pager({ index: 0, numPages: 0, search: search });
                        return [4 /*yield*/, this.Set(pager)];
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
                    case 0: return [4 /*yield*/, this.Get()];
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
            var pager;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        pager = _a.sent();
                        pager.length = length;
                        // Make sure still in bounds (i.e. handle deleted items in list)
                        if (pager.index > pager.length - 1) {
                            pager.index = pager.length - 1;
                        }
                        return [4 /*yield*/, this.Set(pager)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, pager];
                }
            });
        });
    };
    Pager.SearchTerm = function (context) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var page;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        page = _a.sent();
                        return [2 /*return*/, page.search];
                }
            });
        });
    };
    Pager.Next = function (context) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var pager;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        pager = _a.sent();
                        pager.index++;
                        // Loop if at end
                        if (pager.index > pager.length - 1) {
                            pager.index = 0;
                        }
                        return [4 /*yield*/, this.Set(pager)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, pager];
                }
            });
        });
    };
    Pager.Prev = function (context) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var pager;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.Get()];
                    case 1:
                        pager = _a.sent();
                        pager.index--;
                        // Loop if at start
                        if (pager.index < 0) {
                            pager.index = pager.length - 1;
                        }
                        return [2 /*return*/, pager];
                }
            });
        });
    };
    Pager.MEMKEY = "PAGER";
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
    return Pager;
}(Serializable_1.Serializable));
exports.Pager = Pager;
//# sourceMappingURL=Pager.js.map
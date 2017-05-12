"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var builder = require("botbuilder");
var EditableResponse_1 = require("./Model/EditableResponse");
var BlisContext_1 = require("./BlisContext");
var Consts_1 = require("./Model/Consts");
var BlisDialog = (function (_super) {
    tslib_1.__extends(BlisDialog, _super);
    function BlisDialog(options) {
        var _this = _super.call(this) || this;
        _this.options = options;
        // LARS TEMP options.intentThreshold = 0.05;
        _this.recognizers = new builder.IntentRecognizerSet(options);
        return _this;
    }
    BlisDialog.prototype.replyReceived = function (session, recognizeResult) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var locale, context;
            return tslib_1.__generator(this, function (_a) {
                if (!recognizeResult) {
                    locale = session.preferredLocale();
                    context = session.toRecognizeContext();
                    context.dialogData = session.dialogData;
                    context.activeDialog = true;
                    this.recognize(context, function (error, result) {
                        var blisResult = result;
                        try {
                            if (!error) {
                                _this.invokeAnswer(session, blisResult);
                            }
                        }
                        catch (e) {
                            _this.emitError(session, e);
                        }
                    });
                }
                else {
                    this.invokeAnswer(session, recognizeResult);
                }
                return [2 /*return*/];
            });
        });
    };
    BlisDialog.prototype.recognize = function (context, cb) {
        this.recognizers.recognize(context, cb);
    };
    BlisDialog.prototype.recognizer = function (plugin) {
        // Append recognizer
        this.recognizers.recognizer(plugin);
        return this;
    };
    BlisDialog.prototype.invokeAnswer = function (session, recognizeResult) {
        var blisResult = recognizeResult;
        blisResult.recognizer.invoke(session, function (err, blisResponse) {
            if (err) {
                session.send(err.message);
                return;
            }
            // Clear memory of last posts -- todo clear editable cache
            session.conversationData.lastPosts = [];
            // If reponses present, send to user
            if (blisResponse.responses) {
                var carousel = null;
                for (var _i = 0, _a = blisResponse.responses; _i < _a.length; _i++) {
                    var response = _a[_i];
                    if (response instanceof builder.SuggestedActions) {
                        // Add suggested actions to carousel
                        if (carousel) {
                            carousel.suggestedActions(response);
                        }
                    }
                    else if (typeof response == 'string') {
                        // Send existing carousel if next entry is text
                        if (carousel) {
                            session.send(carousel);
                            carousel = null;
                        }
                        session.send(response);
                    }
                    else if (response == null) {
                        // Send existing carousel if empty entry
                        if (carousel) {
                            session.send(carousel);
                            carousel = null;
                        }
                    }
                    else if (response instanceof EditableResponse_1.EditableResponse) {
                        // Send existing carousel if next entry is text
                        if (carousel) {
                            session.send(carousel);
                            carousel = null;
                        }
                        response.Send(session);
                    }
                    else {
                        if (!carousel) {
                            carousel = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel);
                        }
                        carousel.addAttachment(response);
                    }
                }
                if (carousel) {
                    session.send(carousel);
                }
            }
            // If intent present, fire the intent
            if (blisResponse.intent) {
                // If in teach mode wrap the intent so can give next input cue when intent dialog completes
                var context = new BlisContext_1.BlisContext(null, null, session);
                if (context.State(Consts_1.UserStates.TEACH)) {
                    session.beginDialog('BLIS_INTENT_WRAPPER', { intent: blisResponse.intent, entities: blisResponse.entities });
                }
                else {
                    session.beginDialog(blisResponse.intent, blisResponse.entities);
                }
            }
        });
    };
    BlisDialog.prototype.emitError = function (session, err) {
        var m = err.toString();
        err = err instanceof Error ? err : new Error(m);
        session.error(err);
    };
    return BlisDialog;
}(builder.Dialog));
exports.BlisDialog = BlisDialog;
//# sourceMappingURL=BlisDialog.js.map
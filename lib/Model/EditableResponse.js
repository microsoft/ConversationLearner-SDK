"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var builder = require("botbuilder");
var BlisDebug_1 = require("../BlisDebug");
var EditableResponse = (function () {
    function EditableResponse(session, original, replacement, buttons) {
        this.original = null;
        this.replacement = null;
        this.original = original;
        this.replacement = replacement;
        this.buttons = buttons;
        this.address = null;
        if (!session.userData.editableResponses) {
            session.userData.editableResponses = [];
        }
        session.userData.editableResponses.push(this);
    }
    /** Send message and remember it's address */
    EditableResponse.prototype.Send = function (session) {
        var _this = this;
        var msg = new builder.Message(session)
            .addAttachment(this.original);
        session.send(msg).sendBatch(function (err, addresses) {
            _this.address = addresses[0];
            session.save().sendBatch();
        });
    };
    /** Check if button is mapped to replacable message, if so replace it */
    EditableResponse.Clear = function (session) {
        session.userData.editableResponses = [];
    };
    /** Check if button is mapped to replacable message, if so replace it */
    EditableResponse.Replace = function (session, buttonText) {
        var editableResponses = session.userData.editableResponses;
        if (editableResponses) {
            for (var _i = 0, editableResponses_1 = editableResponses; _i < editableResponses_1.length; _i++) {
                var editableResponse = editableResponses_1[_i];
                if (editableResponse.address) {
                    for (var _a = 0, _b = editableResponse.buttons; _a < _b.length; _a++) {
                        var button = _b[_a];
                        // If button matches replace it
                        if (button == buttonText) {
                            // Generate replacement message
                            var msg = new builder.Message(session)
                                .address(editableResponse.address)
                                .text("gotcha!");
                            //   .addAttachment(editableResponse.replacement);
                            // Clear response cache
                            this.Clear(session);
                            // Post it
                            //session.connector.update(msg.toMessage(), function (err, address) 
                            session.connector.delete(editableResponse.address, function (err) {
                                if (err) {
                                    BlisDebug_1.BlisDebug.Error(err);
                                }
                            });
                            return;
                        }
                    }
                }
            }
        }
    };
    return EditableResponse;
}());
exports.EditableResponse = EditableResponse;
//# sourceMappingURL=EditableResponse.js.map
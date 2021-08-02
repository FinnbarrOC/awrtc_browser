"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameUpdateEventArgs = exports.MediaUpdatedEventArgs = exports.DataMessageEventArgs = exports.MessageEventArgs = exports.WaitForIncomingCallEventArgs = exports.ErrorEventArgs = exports.CallErrorType = exports.CallEndedEventArgs = exports.CallAcceptedEventArgs = exports.CallEventArgs = exports.CallEventType = void 0;
/*
Copyright (c) 2019, because-why-not.com Limited
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the copyright holder nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
var index_1 = require("../network/index");
/// <summary>
/// Type of the event.
/// </summary>
var CallEventType;
(function (CallEventType) {
    /// <summary>
    /// Used if the event value wasn't initialized
    /// </summary>
    CallEventType[CallEventType["Invalid"] = 0] = "Invalid";
    /// <summary>
    /// The call object is successfully connected to the server waiting for another user 
    /// to connect.
    /// </summary>
    CallEventType[CallEventType["WaitForIncomingCall"] = 1] = "WaitForIncomingCall";
    /// <summary>
    /// A call was accepted
    /// </summary>
    CallEventType[CallEventType["CallAccepted"] = 2] = "CallAccepted";
    /// <summary>
    /// The call ended
    /// </summary>
    CallEventType[CallEventType["CallEnded"] = 3] = "CallEnded";
    /**
     * Backwards compatibility. Use MediaUpdate
     */
    CallEventType[CallEventType["FrameUpdate"] = 4] = "FrameUpdate";
    /// <summary>
    /// Text message arrived
    /// </summary>
    CallEventType[CallEventType["Message"] = 5] = "Message";
    /// <summary>
    /// Connection failed. Might be due to an server, network error or the address didn't exist
    /// Using ErrorEventArgs
    /// </summary>
    CallEventType[CallEventType["ConnectionFailed"] = 6] = "ConnectionFailed";
    /// <summary>
    /// Listening failed. Address might be in use or due to server/network error
    /// Using ErrorEventArgs
    /// </summary>
    CallEventType[CallEventType["ListeningFailed"] = 7] = "ListeningFailed";
    /// <summary>
    /// Event triggered after the local media was successfully configured. 
    /// If requested the call object will have access to the users camera and/or audio now and
    /// the local camera frames can be received in events. 
    /// </summary>
    CallEventType[CallEventType["ConfigurationComplete"] = 8] = "ConfigurationComplete";
    /// <summary>
    /// Configuration failed. This happens if the configuration requested features
    /// the system doesn't support e.g. no camera, camera doesn't support the requested resolution
    /// or the user didn't allow the website to access the camera/microphone in WebGL mode.
    /// </summary>
    CallEventType[CallEventType["ConfigurationFailed"] = 9] = "ConfigurationFailed";
    /// <summary>
    /// Reliable or unreliable data msg arrived
    /// </summary>
    CallEventType[CallEventType["DataMessage"] = 10] = "DataMessage";
    /**
     *
     */
    CallEventType[CallEventType["MediaUpdate"] = 20] = "MediaUpdate";
})(CallEventType = exports.CallEventType || (exports.CallEventType = {}));
var CallEventArgs = /** @class */ (function () {
    function CallEventArgs(type) {
        this.mType = CallEventType.Invalid;
        this.mType = type;
    }
    Object.defineProperty(CallEventArgs.prototype, "Type", {
        get: function () {
            return this.mType;
        },
        enumerable: false,
        configurable: true
    });
    return CallEventArgs;
}());
exports.CallEventArgs = CallEventArgs;
var CallAcceptedEventArgs = /** @class */ (function (_super) {
    __extends(CallAcceptedEventArgs, _super);
    function CallAcceptedEventArgs(connectionId) {
        var _this = _super.call(this, CallEventType.CallAccepted) || this;
        _this.mConnectionId = index_1.ConnectionId.INVALID;
        _this.mConnectionId = connectionId;
        return _this;
    }
    Object.defineProperty(CallAcceptedEventArgs.prototype, "ConnectionId", {
        get: function () {
            return this.mConnectionId;
        },
        enumerable: false,
        configurable: true
    });
    return CallAcceptedEventArgs;
}(CallEventArgs));
exports.CallAcceptedEventArgs = CallAcceptedEventArgs;
var CallEndedEventArgs = /** @class */ (function (_super) {
    __extends(CallEndedEventArgs, _super);
    function CallEndedEventArgs(connectionId) {
        var _this = _super.call(this, CallEventType.CallEnded) || this;
        _this.mConnectionId = index_1.ConnectionId.INVALID;
        _this.mConnectionId = connectionId;
        return _this;
    }
    Object.defineProperty(CallEndedEventArgs.prototype, "ConnectionId", {
        get: function () {
            return this.mConnectionId;
        },
        enumerable: false,
        configurable: true
    });
    return CallEndedEventArgs;
}(CallEventArgs));
exports.CallEndedEventArgs = CallEndedEventArgs;
var CallErrorType;
(function (CallErrorType) {
    CallErrorType[CallErrorType["Unknown"] = 0] = "Unknown";
})(CallErrorType = exports.CallErrorType || (exports.CallErrorType = {}));
var ErrorEventArgs = /** @class */ (function (_super) {
    __extends(ErrorEventArgs, _super);
    function ErrorEventArgs(eventType, type, errorMessage) {
        var _this = _super.call(this, eventType) || this;
        _this.mErrorType = CallErrorType.Unknown;
        _this.mErrorType = type;
        _this.mErrorMessage = errorMessage;
        if (_this.mErrorMessage == null) {
            switch (eventType) {
                //use some generic error messages as the underlaying system doesn't report the errors yet.
                case CallEventType.ConnectionFailed:
                    _this.mErrorMessage = "Connection failed.";
                    break;
                case CallEventType.ListeningFailed:
                    _this.mErrorMessage = "Failed to allow incoming connections. Address already in use or server connection failed.";
                    break;
                default:
                    _this.mErrorMessage = "Unknown error.";
                    break;
            }
        }
        return _this;
    }
    Object.defineProperty(ErrorEventArgs.prototype, "ErrorMessage", {
        get: function () {
            return this.mErrorMessage;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ErrorEventArgs.prototype, "ErrorType", {
        get: function () {
            return this.mErrorType;
        },
        enumerable: false,
        configurable: true
    });
    return ErrorEventArgs;
}(CallEventArgs));
exports.ErrorEventArgs = ErrorEventArgs;
var WaitForIncomingCallEventArgs = /** @class */ (function (_super) {
    __extends(WaitForIncomingCallEventArgs, _super);
    function WaitForIncomingCallEventArgs(address) {
        var _this = _super.call(this, CallEventType.WaitForIncomingCall) || this;
        _this.mAddress = address;
        return _this;
    }
    Object.defineProperty(WaitForIncomingCallEventArgs.prototype, "Address", {
        get: function () {
            return this.mAddress;
        },
        enumerable: false,
        configurable: true
    });
    return WaitForIncomingCallEventArgs;
}(CallEventArgs));
exports.WaitForIncomingCallEventArgs = WaitForIncomingCallEventArgs;
var MessageEventArgs = /** @class */ (function (_super) {
    __extends(MessageEventArgs, _super);
    function MessageEventArgs(id, message, reliable) {
        var _this = _super.call(this, CallEventType.Message) || this;
        _this.mConnectionId = index_1.ConnectionId.INVALID;
        _this.mConnectionId = id;
        _this.mContent = message;
        _this.mReliable = reliable;
        return _this;
    }
    Object.defineProperty(MessageEventArgs.prototype, "ConnectionId", {
        get: function () {
            return this.mConnectionId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MessageEventArgs.prototype, "Content", {
        get: function () {
            return this.mContent;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MessageEventArgs.prototype, "Reliable", {
        get: function () {
            return this.mReliable;
        },
        enumerable: false,
        configurable: true
    });
    return MessageEventArgs;
}(CallEventArgs));
exports.MessageEventArgs = MessageEventArgs;
var DataMessageEventArgs = /** @class */ (function (_super) {
    __extends(DataMessageEventArgs, _super);
    function DataMessageEventArgs(id, message, reliable) {
        var _this = _super.call(this, CallEventType.DataMessage) || this;
        _this.mConnectionId = index_1.ConnectionId.INVALID;
        _this.mConnectionId = id;
        _this.mContent = message;
        _this.mReliable = reliable;
        return _this;
    }
    Object.defineProperty(DataMessageEventArgs.prototype, "ConnectionId", {
        get: function () {
            return this.mConnectionId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DataMessageEventArgs.prototype, "Content", {
        get: function () {
            return this.mContent;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DataMessageEventArgs.prototype, "Reliable", {
        get: function () {
            return this.mReliable;
        },
        enumerable: false,
        configurable: true
    });
    return DataMessageEventArgs;
}(CallEventArgs));
exports.DataMessageEventArgs = DataMessageEventArgs;
/**
 * Replaces the FrameUpdateEventArgs. Instead of
 * giving access to video frames only this gives access to
 * video html tag once it is created.
 * TODO: Add audio + video tracks + flag that indicates added, updated or removed
 * after renegotiation is added.
 */
var MediaUpdatedEventArgs = /** @class */ (function (_super) {
    __extends(MediaUpdatedEventArgs, _super);
    function MediaUpdatedEventArgs(conId, videoElement) {
        var _this = _super.call(this, CallEventType.MediaUpdate) || this;
        _this.mConnectionId = index_1.ConnectionId.INVALID;
        _this.mConnectionId = conId;
        _this.mVideoElement = videoElement;
        return _this;
    }
    Object.defineProperty(MediaUpdatedEventArgs.prototype, "ConnectionId", {
        get: function () {
            return this.mConnectionId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaUpdatedEventArgs.prototype, "IsRemote", {
        /// <summary>
        /// False if the frame is from a local camera. True if it is received from
        /// via network.
        /// </summary>
        get: function () {
            return this.mConnectionId.id != index_1.ConnectionId.INVALID.id;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaUpdatedEventArgs.prototype, "VideoElement", {
        get: function () {
            return this.mVideoElement;
        },
        enumerable: false,
        configurable: true
    });
    return MediaUpdatedEventArgs;
}(CallEventArgs));
exports.MediaUpdatedEventArgs = MediaUpdatedEventArgs;
/// <summary>
/// Will be replaced with MediaUpdatedEventArgs.
/// It doesn't make a lot of sense in HTML only
/// </summary>
var FrameUpdateEventArgs = /** @class */ (function (_super) {
    __extends(FrameUpdateEventArgs, _super);
    /// <summary>
    /// Constructor
    /// </summary>
    /// <param name="conId"></param>
    /// <param name="frame"></param>
    function FrameUpdateEventArgs(conId, frame) {
        var _this = _super.call(this, CallEventType.FrameUpdate) || this;
        _this.mConnectionId = index_1.ConnectionId.INVALID;
        _this.mConnectionId = conId;
        _this.mFrame = frame;
        return _this;
    }
    Object.defineProperty(FrameUpdateEventArgs.prototype, "Frame", {
        /// <summary>
        /// Raw image data. Note that the byte array contained in RawFrame will be reused
        /// for the next frames received. Only valid until the next call of ICall.Update
        /// </summary>
        get: function () {
            return this.mFrame;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FrameUpdateEventArgs.prototype, "ConnectionId", {
        get: function () {
            return this.mConnectionId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FrameUpdateEventArgs.prototype, "IsRemote", {
        /// <summary>
        /// False if the frame is from a local camera. True if it is received from
        /// via network.
        /// </summary>
        get: function () {
            return this.mConnectionId.id != index_1.ConnectionId.INVALID.id;
        },
        enumerable: false,
        configurable: true
    });
    return FrameUpdateEventArgs;
}(CallEventArgs));
exports.FrameUpdateEventArgs = FrameUpdateEventArgs;

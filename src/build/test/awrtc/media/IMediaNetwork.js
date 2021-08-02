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
import { ConnectionId } from "../network/index";
export var MediaConfigurationState;
(function (MediaConfigurationState) {
    MediaConfigurationState[MediaConfigurationState["Invalid"] = 0] = "Invalid";
    MediaConfigurationState[MediaConfigurationState["NoConfiguration"] = 1] = "NoConfiguration";
    MediaConfigurationState[MediaConfigurationState["InProgress"] = 2] = "InProgress";
    MediaConfigurationState[MediaConfigurationState["Successful"] = 3] = "Successful";
    MediaConfigurationState[MediaConfigurationState["Failed"] = 4] = "Failed";
})(MediaConfigurationState || (MediaConfigurationState = {}));
export var MediaEventType;
(function (MediaEventType) {
    MediaEventType[MediaEventType["Invalid"] = 0] = "Invalid";
    MediaEventType[MediaEventType["StreamAdded"] = 20] = "StreamAdded";
})(MediaEventType || (MediaEventType = {}));
/**
 * Will replace frame event / configuration system in the future.
 *
 * So far it only delivers HTMLVideoElements once connection and
 * all tracks are ready and it plays.
 *
 * This is all temporary and will be updated soon to handle
 * all events from configuration of local streams to frame updates and
 * renegotation.
 *
 */
var MediaEvent = /** @class */ (function () {
    function MediaEvent(type, id, args) {
        this.mEventType = MediaEventType.Invalid;
        this.mConnectionId = ConnectionId.INVALID;
        this.mEventType = type;
        this.mConnectionId = id;
        this.mArgs = args;
    }
    Object.defineProperty(MediaEvent.prototype, "EventType", {
        get: function () {
            return this.mEventType;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaEvent.prototype, "ConnectionId", {
        get: function () {
            return this.mConnectionId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaEvent.prototype, "Args", {
        get: function () {
            return this.mArgs;
        },
        enumerable: false,
        configurable: true
    });
    return MediaEvent;
}());
export { MediaEvent };
//# sourceMappingURL=IMediaNetwork.js.map
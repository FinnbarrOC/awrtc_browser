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
import { WebRtcDataPeer, SLog } from "../network/index";
import { BrowserMediaStream } from "./BrowserMediaStream";
var MediaPeer = /** @class */ (function (_super) {
    __extends(MediaPeer, _super);
    function MediaPeer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.mRemoteStream = null;
        //quick workaround to allow html user to get the HTMLVideoElement once it is
        //created. Might be done via events later to make wrapping to unity/emscripten possible
        _this.InternalStreamAdded = null;
        return _this;
    }
    MediaPeer.prototype.OnSetup = function () {
        var _this = this;
        _super.prototype.OnSetup.call(this);
        //TODO: test in different browsers if boolean works now
        //this is unclear in the API. according to typescript they are boolean, in native code they are int
        //and some browser failed in the past if boolean was used ... 
        this.mOfferOptions = { "offerToReceiveAudio": true, "offerToReceiveVideo": true };
        if (MediaPeer.sUseObsolete) {
            SLog.LW("Using obsolete onaddstream as not all browsers support ontrack");
            this.mPeer.onaddstream = function (streamEvent) { _this.OnAddStream(streamEvent); };
        }
        else {
            this.mPeer.ontrack = function (ev) { _this.OnTrack(ev); };
        }
    };
    MediaPeer.prototype.OnCleanup = function () {
        _super.prototype.OnCleanup.call(this);
        if (this.mRemoteStream != null) {
            this.mRemoteStream.Dispose();
            this.mRemoteStream = null;
        }
    };
    MediaPeer.prototype.OnAddStream = function (streamEvent) {
        this.SetupStream(streamEvent.stream);
    };
    MediaPeer.prototype.OnTrack = function (ev) {
        if (ev && ev.streams && ev.streams.length > 0) {
            //this is getting called twice if audio and video is active
            if (this.mRemoteStream == null)
                this.SetupStream(ev.streams[0]);
        }
        else {
            SLog.LE("Unexpected RTCTrackEvent: " + JSON.stringify(ev));
        }
    };
    MediaPeer.prototype.SetupStream = function (stream) {
        var _this = this;
        this.mRemoteStream = new BrowserMediaStream(stream);
        //trigger events once the stream has its meta data available
        this.mRemoteStream.InternalStreamAdded = function (stream) {
            if (_this.InternalStreamAdded != null) {
                _this.InternalStreamAdded(_this, stream);
            }
        };
    };
    MediaPeer.prototype.TryGetRemoteFrame = function () {
        if (this.mRemoteStream == null)
            return null;
        return this.mRemoteStream.TryGetFrame();
    };
    MediaPeer.prototype.PeekFrame = function () {
        if (this.mRemoteStream == null)
            return null;
        return this.mRemoteStream.PeekFrame();
    };
    MediaPeer.prototype.AddLocalStream = function (stream) {
        if (MediaPeer.sUseObsolete) {
            this.mPeer.addStream(stream);
        }
        else {
            for (var _i = 0, _a = stream.getTracks(); _i < _a.length; _i++) {
                var v = _a[_i];
                this.mPeer.addTrack(v, stream);
            }
        }
    };
    MediaPeer.prototype.Update = function () {
        _super.prototype.Update.call(this);
        if (this.mRemoteStream != null) {
            this.mRemoteStream.Update();
        }
    };
    MediaPeer.prototype.SetVolume = function (volume) {
        if (this.mRemoteStream != null)
            this.mRemoteStream.SetVolume(volume);
    };
    MediaPeer.prototype.HasAudioTrack = function () {
        if (this.mRemoteStream != null)
            return this.mRemoteStream.HasAudioTrack();
        return false;
    };
    MediaPeer.prototype.HasVideoTrack = function () {
        if (this.mRemoteStream != null)
            return this.mRemoteStream.HasVideoTrack();
        return false;
    };
    //true - will use obsolete onstream / add stream
    //false - will use ontrack / addtrack (seems to work fine now even on chrome)
    MediaPeer.sUseObsolete = false;
    return MediaPeer;
}(WebRtcDataPeer));
export { MediaPeer };
//# sourceMappingURL=MediaPeer.js.map
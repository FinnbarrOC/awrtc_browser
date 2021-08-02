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
import { WebRtcNetwork, SLog, ConnectionId, SignalingConfig, LocalNetwork, WebsocketNetwork, Queue } from "../network/index";
import { MediaConfigurationState, MediaEvent, MediaEventType } from "../media/IMediaNetwork";
import { MediaConfig } from "../media/MediaConfig";
import { MediaPeer } from "./MediaPeer";
import { BrowserMediaStream } from "./BrowserMediaStream";
import { DeviceApi } from "./DeviceApi";
import { Media } from "./Media";
/**Avoid using this class directly whenever possible. Use BrowserWebRtcCall instead.
 * BrowserMediaNetwork might be subject to frequent changes to keep up with changes
 * in all other platforms.
 *
 * IMediaNetwork implementation for the browser. The class is mostly identical with the
 * C# version. Main goal is to have an interface that can easily be wrapped to other
 * programming languages and gives access to basic WebRTC features such as receiving
 * and sending audio and video + signaling via websockets.
 *
 * BrowserMediaNetwork can be used to stream a local audio and video track to a group of
 * multiple peers and receive remote tracks. The handling of the peers itself
 * remains the same as WebRtcNetwork.
 * Local tracks are created after calling Configure. This will request access from the
 * user. After the user allowed access GetConfigurationState will return Configured.
 * Every incoming and outgoing peer that is established after this will receive
 * the local audio and video track.
 * So far Configure can only be called once before any peers are connected.
 *
 *
 */
var BrowserMediaNetwork = /** @class */ (function (_super) {
    __extends(BrowserMediaNetwork, _super);
    function BrowserMediaNetwork(config) {
        var _this = _super.call(this, BrowserMediaNetwork.BuildSignalingConfig(config.SignalingUrl), BrowserMediaNetwork.BuildRtcConfig(config.IceServers)) || this;
        //media configuration set by the user
        _this.mMediaConfig = null;
        //keeps track of audio / video tracks based on local devices
        //will be shared with all connected peers.
        _this.mLocalStream = null;
        _this.mConfigurationState = MediaConfigurationState.Invalid;
        _this.mConfigurationError = null;
        _this.mMediaEvents = new Queue();
        _this.MediaPeer_InternalMediaStreamAdded = function (peer, stream) {
            _this.EnqueueMediaEvent(MediaEventType.StreamAdded, peer.ConnectionId, stream.VideoElement);
        };
        _this.mConfigurationState = MediaConfigurationState.NoConfiguration;
        return _this;
    }
    /**Triggers the creation of a local audio and video track. After this
     * call the user might get a request to allow access to the requested
     * devices.
     *
     * @param config Detail configuration for audio/video devices.
     */
    BrowserMediaNetwork.prototype.Configure = function (config) {
        var _this = this;
        this.mMediaConfig = config;
        this.mConfigurationError = null;
        this.mConfigurationState = MediaConfigurationState.InProgress;
        if (config.Audio || config.Video) {
            SLog.L("calling GetUserMedia. Media config: " + JSON.stringify(config));
            if (DeviceApi.IsUserMediaAvailable()) {
                var promise = null;
                promise = Media.SharedInstance.getUserMedia(config);
                promise.then(function (stream) {
                    //totally unrelated -> user gave access to devices. use this
                    //to get the proper names for our DeviceApi
                    DeviceApi.Update();
                    //call worked -> setup a frame buffer that deals with the rest
                    _this.mLocalStream = new BrowserMediaStream(stream);
                    //console.debug("Local tracks: ", stream.getTracks());
                    _this.mLocalStream.InternalStreamAdded = function (stream) {
                        _this.EnqueueMediaEvent(MediaEventType.StreamAdded, ConnectionId.INVALID, _this.mLocalStream.VideoElement);
                    };
                    //unlike native version this one will happily play the local sound causing an echo
                    //set to mute
                    _this.mLocalStream.SetMute(true);
                    _this.OnConfigurationSuccess();
                });
                promise.catch(function (err) {
                    //failed due to an error or user didn't give permissions
                    SLog.LE(err.name + ": " + err.message);
                    _this.OnConfigurationFailed(err.message);
                });
            }
            else {
                //no access to media device -> fail
                var error = "Configuration failed. navigator.mediaDevices is unedfined. The browser might not allow media access." +
                    "Is the page loaded via http or file URL? Some browsers only support https!";
                SLog.LE(error);
                this.OnConfigurationFailed(error);
            }
        }
        else {
            this.OnConfigurationSuccess();
        }
    };
    /**Call this every time a new frame is shown to the user in realtime
     * applications.
     *
     */
    BrowserMediaNetwork.prototype.Update = function () {
        _super.prototype.Update.call(this);
        if (this.mLocalStream != null)
            this.mLocalStream.Update();
    };
    BrowserMediaNetwork.prototype.EnqueueMediaEvent = function (type, id, args) {
        var evt = new MediaEvent(type, id, args);
        this.mMediaEvents.Enqueue(evt);
    };
    BrowserMediaNetwork.prototype.DequeueMediaEvent = function () {
        return this.mMediaEvents.Dequeue();
    };
    /**
     * Call this every frame after interacting with this instance.
     *
     * This call might flush buffered messages in the future and clear
     * events that the user didn't process to avoid buffer overflows.
     *
     */
    BrowserMediaNetwork.prototype.Flush = function () {
        _super.prototype.Flush.call(this);
        this.mMediaEvents.Clear();
    };
    /**Poll this after Configure is called to get the result.
     * Won't change after state is Configured or Failed.
     *
     */
    BrowserMediaNetwork.prototype.GetConfigurationState = function () {
        return this.mConfigurationState;
    };
    /**Returns the error message if the configure process failed.
     * This usally either happens because the user refused access
     * or no device fulfills the configuration given
     * (e.g. device doesn't support the given resolution)
     *
     */
    BrowserMediaNetwork.prototype.GetConfigurationError = function () {
        return this.mConfigurationError;
    };
    /**Resets the configuration state to allow multiple attempts
     * to call Configure.
     *
     */
    BrowserMediaNetwork.prototype.ResetConfiguration = function () {
        this.mConfigurationState = MediaConfigurationState.NoConfiguration;
        this.mMediaConfig = new MediaConfig();
        this.mConfigurationError = null;
    };
    BrowserMediaNetwork.prototype.OnConfigurationSuccess = function () {
        this.mConfigurationState = MediaConfigurationState.Successful;
    };
    BrowserMediaNetwork.prototype.OnConfigurationFailed = function (error) {
        this.mConfigurationError = error;
        this.mConfigurationState = MediaConfigurationState.Failed;
    };
    /**Allows to peek at the current frame.
     * Added to allow the emscripten C / C# side to allocate memory before
     * actually getting the frame.
     *
     * @param id
     */
    BrowserMediaNetwork.prototype.PeekFrame = function (id) {
        if (id == null)
            return;
        if (id.id == ConnectionId.INVALID.id) {
            if (this.mLocalStream != null) {
                return this.mLocalStream.PeekFrame();
            }
        }
        else {
            var peer = this.IdToConnection[id.id];
            if (peer != null) {
                return peer.PeekFrame();
            }
            //TODO: iterate over media peers and do the same as above
        }
        return null;
    };
    BrowserMediaNetwork.prototype.TryGetFrame = function (id) {
        if (id == null)
            return;
        if (id.id == ConnectionId.INVALID.id) {
            if (this.mLocalStream != null) {
                return this.mLocalStream.TryGetFrame();
            }
        }
        else {
            var peer = this.IdToConnection[id.id];
            if (peer != null) {
                return peer.TryGetRemoteFrame();
            }
            //TODO: iterate over media peers and do the same as above
        }
        return null;
    };
    /**
     * Remote audio control for each peer.
     *
     * @param volume 0 - mute and 1 - max volume
     * @param id peer id
     */
    BrowserMediaNetwork.prototype.SetVolume = function (volume, id) {
        SLog.L("SetVolume called. Volume: " + volume + " id: " + id.id);
        var peer = this.IdToConnection[id.id];
        if (peer != null) {
            return peer.SetVolume(volume);
        }
    };
    /** Allows to check if a specific peer has a remote
     * audio track attached.
     *
     * @param id
     */
    BrowserMediaNetwork.prototype.HasAudioTrack = function (id) {
        var peer = this.IdToConnection[id.id];
        if (peer != null) {
            return peer.HasAudioTrack();
        }
        return false;
    };
    /** Allows to check if a specific peer has a remote
     * video track attached.
     *
     * @param id
     */
    BrowserMediaNetwork.prototype.HasVideoTrack = function (id) {
        var peer = this.IdToConnection[id.id];
        if (peer != null) {
            return peer.HasVideoTrack();
        }
        return false;
    };
    /**Returns true if no local audio available or it is muted.
     * False if audio is available (could still not work due to 0 volume, hardware
     * volume control or a dummy audio input device is being used)
     */
    BrowserMediaNetwork.prototype.IsMute = function () {
        if (this.mLocalStream != null && this.mLocalStream.Stream != null) {
            var stream = this.mLocalStream.Stream;
            var tracks = stream.getAudioTracks();
            if (tracks.length > 0) {
                if (tracks[0].enabled)
                    return false;
            }
        }
        return true;
    };
    /**Sets the local audio device to mute / unmute it.
     *
     * @param value
     */
    BrowserMediaNetwork.prototype.SetMute = function (value) {
        if (this.mLocalStream != null && this.mLocalStream.Stream != null) {
            var stream = this.mLocalStream.Stream;
            var tracks = stream.getAudioTracks();
            if (tracks.length > 0) {
                tracks[0].enabled = !value;
            }
        }
    };
    BrowserMediaNetwork.prototype.CreatePeer = function (peerId, lRtcConfig) {
        var peer = new MediaPeer(peerId, lRtcConfig);
        peer.InternalStreamAdded = this.MediaPeer_InternalMediaStreamAdded;
        if (this.mLocalStream != null)
            peer.AddLocalStream(this.mLocalStream.Stream);
        return peer;
    };
    BrowserMediaNetwork.prototype.DisposeInternal = function () {
        _super.prototype.DisposeInternal.call(this);
        this.DisposeLocalStream();
    };
    BrowserMediaNetwork.prototype.DisposeLocalStream = function () {
        if (this.mLocalStream != null) {
            this.mLocalStream.Dispose();
            this.mLocalStream = null;
            SLog.L("local buffer disposed");
        }
    };
    BrowserMediaNetwork.BuildSignalingConfig = function (signalingUrl) {
        var signalingNetwork;
        if (signalingUrl == null || signalingUrl == "") {
            signalingNetwork = new LocalNetwork();
        }
        else {
            signalingNetwork = new WebsocketNetwork(signalingUrl);
        }
        return new SignalingConfig(signalingNetwork);
    };
    BrowserMediaNetwork.BuildRtcConfig = function (servers) {
        var rtcConfig = { iceServers: servers };
        return rtcConfig;
    };
    return BrowserMediaNetwork;
}(WebRtcNetwork));
export { BrowserMediaNetwork };
//# sourceMappingURL=BrowserMediaNetwork.js.map
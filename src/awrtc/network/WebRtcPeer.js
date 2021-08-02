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
exports.WebRtcDataPeer = exports.AWebRtcPeer = exports.WebRtcInternalState = exports.WebRtcPeerState = exports.SignalingInfo = exports.SignalingConfig = void 0;
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
var index_1 = require("./index");
var Helper_1 = require("./Helper");
var SignalingConfig = /** @class */ (function () {
    function SignalingConfig(network) {
        this.mNetwork = network;
    }
    SignalingConfig.prototype.GetNetwork = function () {
        return this.mNetwork;
    };
    return SignalingConfig;
}());
exports.SignalingConfig = SignalingConfig;
var SignalingInfo = /** @class */ (function () {
    function SignalingInfo(id, isIncoming, timeStamp) {
        this.mConnectionId = id;
        this.mIsIncoming = isIncoming;
        this.mCreationTime = timeStamp;
        this.mSignalingConnected = true;
    }
    SignalingInfo.prototype.IsSignalingConnected = function () {
        return this.mSignalingConnected;
    };
    Object.defineProperty(SignalingInfo.prototype, "ConnectionId", {
        get: function () {
            return this.mConnectionId;
        },
        enumerable: false,
        configurable: true
    });
    SignalingInfo.prototype.IsIncoming = function () {
        return this.mIsIncoming;
    };
    SignalingInfo.prototype.GetCreationTimeMs = function () {
        return Date.now() - this.mCreationTime;
    };
    SignalingInfo.prototype.SignalingDisconnected = function () {
        this.mSignalingConnected = false;
    };
    return SignalingInfo;
}());
exports.SignalingInfo = SignalingInfo;
var WebRtcPeerState;
(function (WebRtcPeerState) {
    WebRtcPeerState[WebRtcPeerState["Invalid"] = 0] = "Invalid";
    WebRtcPeerState[WebRtcPeerState["Created"] = 1] = "Created";
    WebRtcPeerState[WebRtcPeerState["Signaling"] = 2] = "Signaling";
    WebRtcPeerState[WebRtcPeerState["SignalingFailed"] = 3] = "SignalingFailed";
    WebRtcPeerState[WebRtcPeerState["Connected"] = 4] = "Connected";
    WebRtcPeerState[WebRtcPeerState["Closing"] = 5] = "Closing";
    WebRtcPeerState[WebRtcPeerState["Closed"] = 6] = "Closed"; //either Closed call finished or closed remotely or Cleanup/Dispose finished -> peer connection is destroyed and all resources are released
})(WebRtcPeerState = exports.WebRtcPeerState || (exports.WebRtcPeerState = {}));
var WebRtcInternalState;
(function (WebRtcInternalState) {
    WebRtcInternalState[WebRtcInternalState["None"] = 0] = "None";
    WebRtcInternalState[WebRtcInternalState["Signaling"] = 1] = "Signaling";
    WebRtcInternalState[WebRtcInternalState["SignalingFailed"] = 2] = "SignalingFailed";
    WebRtcInternalState[WebRtcInternalState["Connected"] = 3] = "Connected";
    WebRtcInternalState[WebRtcInternalState["Closed"] = 4] = "Closed"; //at least one channel was closed
})(WebRtcInternalState = exports.WebRtcInternalState || (exports.WebRtcInternalState = {}));
var AWebRtcPeer = /** @class */ (function () {
    function AWebRtcPeer(rtcConfig) {
        var _this = this;
        this.mState = WebRtcPeerState.Invalid;
        //only written during webrtc callbacks
        this.mRtcInternalState = WebRtcInternalState.None;
        this.mIncomingSignalingQueue = new Helper_1.Queue();
        this.mOutgoingSignalingQueue = new Helper_1.Queue();
        //Used to negotiate who starts the signaling if 2 peers listening
        //at the same time
        this.mDidSendRandomNumber = false;
        this.mRandomNumerSent = 0;
        this.mOfferOptions = { "offerToReceiveAudio": false, "offerToReceiveVideo": false };
        this.mReadyForIce = false;
        this.mBufferedIceCandidates = [];
        this.OnIceCandidate = function (ev) {
            if (ev && ev.candidate) {
                var candidate = ev.candidate;
                var msg = JSON.stringify(candidate);
                _this.EnqueueOutgoing(msg);
            }
        };
        this.OnIceConnectionStateChange = function (ev) {
            Helper_1.Debug.Log("oniceconnectionstatechange: " + _this.mPeer.iceConnectionState);
            //Chrome stopped emitting "failed" events. We have to react to disconnected events now
            if (_this.mPeer.iceConnectionState == "failed" || _this.mPeer.iceConnectionState == "disconnected") {
                if (_this.mState == WebRtcPeerState.Signaling) {
                    _this.RtcSetSignalingFailed();
                }
                else if (_this.mState == WebRtcPeerState.Connected) {
                    _this.RtcSetClosed();
                }
            }
        };
        /*
        So far useless. never triggered in firefox.
        In Chrome it triggers together with the DataChannels opening which might be more useful in the future
        */
        this.OnConnectionStateChange = function (ev) {
            Helper_1.Debug.Log("onconnectionstatechange: " + _this.mPeer.iceConnectionState);
        };
        this.OnIceGatheringStateChange = function (ev) {
            Helper_1.Debug.Log("onicegatheringstatechange: " + _this.mPeer.iceGatheringState);
        };
        this.OnRenegotiationNeeded = function (ev) {
        };
        //broken in chrome. won't switch to closed anymore
        this.OnSignalingChange = function (ev) {
            Helper_1.Debug.Log("onsignalingstatechange:" + _this.mPeer.signalingState);
            //obsolete
            if (_this.mPeer.signalingState == "closed") {
                _this.RtcSetClosed();
            }
        };
        this.SetupPeer(rtcConfig);
        //remove this. it will trigger this call before the subclasses
        //are initialized
        this.OnSetup();
        this.mState = WebRtcPeerState.Created;
    }
    AWebRtcPeer.prototype.GetState = function () {
        return this.mState;
    };
    AWebRtcPeer.prototype.SetupPeer = function (rtcConfig) {
        this.mPeer = new RTCPeerConnection(rtcConfig);
        this.mPeer.onicecandidate = this.OnIceCandidate;
        this.mPeer.oniceconnectionstatechange = this.OnIceConnectionStateChange;
        this.mPeer.onicegatheringstatechange = this.OnIceGatheringStateChange;
        this.mPeer.onnegotiationneeded = this.OnRenegotiationNeeded;
        this.mPeer.onconnectionstatechange = this.OnConnectionStateChange;
        this.mPeer.onsignalingstatechange = this.OnSignalingChange;
    };
    AWebRtcPeer.prototype.DisposeInternal = function () {
        this.Cleanup();
    };
    AWebRtcPeer.prototype.Dispose = function () {
        if (this.mPeer != null) {
            this.DisposeInternal();
        }
    };
    AWebRtcPeer.prototype.Cleanup = function () {
        //closing webrtc could cause old events to flush out -> make sure we don't call cleanup
        //recursively
        if (this.mState == WebRtcPeerState.Closed || this.mState == WebRtcPeerState.Closing) {
            return;
        }
        this.mState = WebRtcPeerState.Closing;
        this.OnCleanup();
        if (this.mPeer != null)
            this.mPeer.close();
        //js version still receives callbacks after this. would make it
        //impossible to get the state
        //this.mReliableDataChannel = null;
        //this.mUnreliableDataChannel = null;
        //this.mPeer = null;
        this.mState = WebRtcPeerState.Closed;
    };
    AWebRtcPeer.prototype.Update = function () {
        if (this.mState != WebRtcPeerState.Closed && this.mState != WebRtcPeerState.Closing && this.mState != WebRtcPeerState.SignalingFailed)
            this.UpdateState();
        if (this.mState == WebRtcPeerState.Signaling || this.mState == WebRtcPeerState.Created)
            this.HandleIncomingSignaling();
    };
    AWebRtcPeer.prototype.UpdateState = function () {
        //will only be entered if the current state isn't already one of the ending states (closed, closing, signalingfailed)
        if (this.mRtcInternalState == WebRtcInternalState.Closed) {
            //if webrtc switched to the closed state -> make sure everything is destroyed.
            //webrtc closed the connection. update internal state + destroy the references
            //to webrtc
            this.Cleanup();
            //mState will be Closed now as well
        }
        else if (this.mRtcInternalState == WebRtcInternalState.SignalingFailed) {
            //if webrtc switched to a state indicating the signaling process failed ->  set the whole state to failed
            //this step will be ignored if the peers are destroyed already to not jump back from closed state to failed
            this.mState = WebRtcPeerState.SignalingFailed;
        }
        else if (this.mRtcInternalState == WebRtcInternalState.Connected) {
            this.mState = WebRtcPeerState.Connected;
        }
    };
    AWebRtcPeer.prototype.BufferIceCandidate = function (ice) {
        this.mBufferedIceCandidates.push(ice);
    };
    /**Called after setRemoteDescription succeeded.
     * After this call we accept ice candidates and add all buffered ice candidates we received
     * until then.
     *
     * This is a workaround for problems between Safari & Firefox. Safari sometimes sends ice candidates before
     * it sends an answer causing an error in firefox.
     */
    AWebRtcPeer.prototype.StartIce = function () {
        Helper_1.Debug.Log("accepting ice candidates");
        this.mReadyForIce = true;
        if (this.mBufferedIceCandidates.length > 0) {
            Helper_1.Debug.Log("adding locally buffered ice candidates");
            //signaling active. Forward ice candidates we received so far
            var candidates = this.mBufferedIceCandidates;
            this.mBufferedIceCandidates = [];
            for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
                var candidate = candidates_1[_i];
                this.AddIceCandidate(candidate);
            }
        }
    };
    AWebRtcPeer.prototype.AddIceCandidate = function (ice) {
        //based on the shim internals there is a risk it triggers errors outside of the promise
        try {
            var promise = this.mPeer.addIceCandidate(ice);
            promise.then(function () { });
            promise.catch(function (error) { Helper_1.Debug.LogError(error); });
        }
        catch (error) {
            Helper_1.Debug.LogError(error);
        }
    };
    AWebRtcPeer.prototype.HandleIncomingSignaling = function () {
        //handle the incoming messages all at once
        while (this.mIncomingSignalingQueue.Count() > 0) {
            var msgString = this.mIncomingSignalingQueue.Dequeue();
            var randomNumber = Helper_1.Helper.tryParseInt(msgString);
            if (randomNumber != null) {
                //was a random number for signaling negotiation
                //if this peer uses negotiation as well then
                //this would be true
                if (this.mDidSendRandomNumber) {
                    //no peer is set to start signaling -> the one with the bigger number starts
                    if (randomNumber < this.mRandomNumerSent) {
                        //own diced number was bigger -> start signaling
                        Helper_1.SLog.L("Signaling negotiation complete. Starting signaling.");
                        this.StartSignaling();
                    }
                    else if (randomNumber == this.mRandomNumerSent) {
                        //same numbers. restart the process
                        this.NegotiateSignaling();
                    }
                    else {
                        //wait for other peer to start signaling
                        Helper_1.SLog.L("Signaling negotiation complete. Waiting for signaling.");
                    }
                }
                else {
                    //ignore. this peer starts signaling automatically and doesn't use this
                    //negotiation
                }
            }
            else {
                //must be a webrtc signaling message using default json formatting
                var msg = JSON.parse(msgString);
                if (msg.sdp) {
                    var sdp = new RTCSessionDescription(msg);
                    if (sdp.type == 'offer') {
                        this.CreateAnswer(sdp);
                        //setTimeout(() => {  }, 5000);
                    }
                    else {
                        //setTimeout(() => { }, 5000);
                        this.RecAnswer(sdp);
                    }
                }
                else {
                    var ice = new RTCIceCandidate(msg);
                    if (ice != null) {
                        if (this.mReadyForIce) {
                            //expected normal behaviour
                            this.AddIceCandidate(ice);
                        }
                        else {
                            //Safari sometimes sends ice candidates before the answer message
                            //causing firefox to trigger an error
                            //buffer and reemit once setRemoteCandidate has been called
                            this.BufferIceCandidate(ice);
                        }
                    }
                }
            }
        }
    };
    AWebRtcPeer.prototype.AddSignalingMessage = function (msg) {
        Helper_1.Debug.Log("incoming Signaling message " + msg);
        this.mIncomingSignalingQueue.Enqueue(msg);
    };
    AWebRtcPeer.prototype.DequeueSignalingMessage = function (/*out*/ msg) {
        //lock might be not the best way to deal with this
        //lock(mOutgoingSignalingQueue)
        {
            if (this.mOutgoingSignalingQueue.Count() > 0) {
                msg.val = this.mOutgoingSignalingQueue.Dequeue();
                return true;
            }
            else {
                msg.val = null;
                return false;
            }
        }
    };
    AWebRtcPeer.prototype.EnqueueOutgoing = function (msg) {
        //lock(mOutgoingSignalingQueue)
        {
            Helper_1.Debug.Log("Outgoing Signaling message " + msg);
            this.mOutgoingSignalingQueue.Enqueue(msg);
        }
    };
    AWebRtcPeer.prototype.StartSignaling = function () {
        this.OnStartSignaling();
        this.CreateOffer();
    };
    AWebRtcPeer.prototype.NegotiateSignaling = function () {
        var nb = Helper_1.Random.getRandomInt(0, 2147483647);
        this.mRandomNumerSent = nb;
        this.mDidSendRandomNumber = true;
        this.EnqueueOutgoing("" + nb);
    };
    AWebRtcPeer.prototype.CreateOffer = function () {
        var _this = this;
        Helper_1.Debug.Log("CreateOffer");
        var createOfferPromise = this.mPeer.createOffer(this.mOfferOptions);
        createOfferPromise.then(function (desc_in) {
            var desc_out = _this.ProcLocalSdp(desc_in);
            var msg = JSON.stringify(desc_out);
            var setDescPromise = _this.mPeer.setLocalDescription(desc_in);
            setDescPromise.then(function () {
                _this.RtcSetSignalingStarted();
                _this.EnqueueOutgoing(msg);
            });
            setDescPromise.catch(function (error) {
                Helper_1.Debug.LogError(error);
                Helper_1.Debug.LogError("Error during setLocalDescription with sdp: " + JSON.stringify(desc_in));
                _this.RtcSetSignalingFailed();
            });
        });
        createOfferPromise.catch(function (error) {
            Helper_1.Debug.LogError(error);
            _this.RtcSetSignalingFailed();
        });
    };
    //Gives a specific codec priority over the others
    AWebRtcPeer.prototype.EditCodecs = function (lines) {
        var prefCodec = "H264";
        console.warn("sdp munging: prioritizing codec " + prefCodec);
        //index and list of all video codec id's
        //e.g.: m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 121 127 120 125 107 108 109 35 36 124 119 123 118 114 115 116
        var vcodecs_line_index;
        var vcodecs_line_split;
        var vcodecs_list;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.startsWith("m=video")) {
                vcodecs_line_split = line.split(" ");
                vcodecs_list = vcodecs_line_split.slice(3, vcodecs_line_split.length);
                vcodecs_line_index = i;
                //console.log(vcodecs_list);
                break;
            }
        }
        //list of video codecs positioned based on our priority list
        var vcodecs_list_new = [];
        //start below the the m=video line
        for (var i = vcodecs_line_index + 1; i < lines.length; i++) {
            var line = lines[i];
            var prefix = "a=rtpmap:";
            if (line.startsWith(prefix)) {
                var subline = line.substr(prefix.length);
                var split = subline.split(" ");
                var codecId = split[0];
                var codecDesc = split[1];
                var codecSplit = codecDesc.split("/");
                var codecName = codecSplit[0];
                //sanity check. is this a video codec?
                if (vcodecs_list.includes(codecId)) {
                    if (codecName === prefCodec) {
                        vcodecs_list_new.unshift(codecId);
                    }
                    else {
                        vcodecs_list_new.push(codecId);
                    }
                }
            }
        }
        //first 3 elements remain the same
        var vcodecs_line_new = vcodecs_line_split[0] + " " + vcodecs_line_split[1] + " " + vcodecs_line_split[2];
        //add new codec list after it
        vcodecs_list_new.forEach(function (x) { vcodecs_line_new = vcodecs_line_new + " " + x; });
        //replace old line
        lines[vcodecs_line_index] = vcodecs_line_new;
    };
    //Replaces H264 profile levels
    //iOS workaround. Streaming from iOS to browser currently fails without this if
    //resolution is above 720p and h264 is active
    AWebRtcPeer.prototype.EditProfileLevel = function (lines) {
        //TODO: Make sure we only edit H264. There could be other codecs in the future
        //that look identical
        console.warn("sdp munging: replacing h264 profile-level with 2a");
        var vcodecs_line_index;
        var vcodecs_line_split;
        var vcodecs_list;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.startsWith("a=fmtp:")) {
                //looking for profile-level-id=42001f
                //we replace the 1f
                var searchString = "profile-level-id=";
                var sublines = line.split(";");
                var updateLine = false;
                for (var k = 0; k < sublines.length; k++) {
                    var subline = sublines[k];
                    if (subline.startsWith(searchString)) {
                        var len = searchString.length + 4;
                        sublines[k] = sublines[k].substr(0, len) + "2a";
                        updateLine = true;
                        break;
                    }
                }
                if (updateLine) {
                    lines[i] = sublines.join(";");
                }
            }
        }
    };
    AWebRtcPeer.prototype.ProcLocalSdp = function (desc) {
        if (AWebRtcPeer.MUNGE_SDP === false)
            return desc;
        console.warn("sdp munging active");
        var sdp_in = desc.sdp;
        var sdp_out = "";
        var lines = sdp_in.split("\r\n");
        this.EditCodecs(lines);
        //this.EditProfileLevel(lines);
        sdp_out = lines.join("\r\n");
        var desc_out = { type: desc.type, sdp: sdp_out };
        return desc_out;
    };
    AWebRtcPeer.prototype.ProcRemoteSdp = function (desc) {
        if (AWebRtcPeer.MUNGE_SDP === false)
            return desc;
        //console.warn("sdp munging active");
        return desc;
    };
    AWebRtcPeer.prototype.CreateAnswer = function (offer) {
        var _this = this;
        Helper_1.Debug.Log("CreateAnswer");
        offer = this.ProcRemoteSdp(offer);
        var remoteDescPromise = this.mPeer.setRemoteDescription(offer);
        remoteDescPromise.then(function () {
            _this.StartIce();
            var createAnswerPromise = _this.mPeer.createAnswer();
            createAnswerPromise.then(function (desc_in) {
                var desc_out = _this.ProcLocalSdp(desc_in);
                var msg = JSON.stringify(desc_out);
                var localDescPromise = _this.mPeer.setLocalDescription(desc_in);
                localDescPromise.then(function () {
                    _this.RtcSetSignalingStarted();
                    _this.EnqueueOutgoing(msg);
                });
                localDescPromise.catch(function (error) {
                    Helper_1.Debug.LogError(error);
                    _this.RtcSetSignalingFailed();
                });
            });
            createAnswerPromise.catch(function (error) {
                Helper_1.Debug.LogError(error);
                _this.RtcSetSignalingFailed();
            });
        });
        remoteDescPromise.catch(function (error) {
            Helper_1.Debug.LogError(error);
            _this.RtcSetSignalingFailed();
        });
    };
    AWebRtcPeer.prototype.RecAnswer = function (answer) {
        var _this = this;
        Helper_1.Debug.Log("RecAnswer");
        answer = this.ProcRemoteSdp(answer);
        var remoteDescPromise = this.mPeer.setRemoteDescription(answer);
        remoteDescPromise.then(function () {
            //all done
            _this.StartIce();
        });
        remoteDescPromise.catch(function (error) {
            Helper_1.Debug.LogError(error);
            _this.RtcSetSignalingFailed();
        });
    };
    AWebRtcPeer.prototype.RtcSetSignalingStarted = function () {
        if (this.mRtcInternalState == WebRtcInternalState.None) {
            this.mRtcInternalState = WebRtcInternalState.Signaling;
        }
    };
    AWebRtcPeer.prototype.RtcSetSignalingFailed = function () {
        this.mRtcInternalState = WebRtcInternalState.SignalingFailed;
    };
    AWebRtcPeer.prototype.RtcSetConnected = function () {
        if (this.mRtcInternalState == WebRtcInternalState.Signaling)
            this.mRtcInternalState = WebRtcInternalState.Connected;
    };
    AWebRtcPeer.prototype.RtcSetClosed = function () {
        if (this.mRtcInternalState == WebRtcInternalState.Connected) {
            Helper_1.Debug.Log("triggering closure");
            this.mRtcInternalState = WebRtcInternalState.Closed;
        }
    };
    AWebRtcPeer.MUNGE_SDP = false;
    return AWebRtcPeer;
}());
exports.AWebRtcPeer = AWebRtcPeer;
var WebRtcDataPeer = /** @class */ (function (_super) {
    __extends(WebRtcDataPeer, _super);
    function WebRtcDataPeer(id, rtcConfig) {
        var _this = _super.call(this, rtcConfig) || this;
        _this.mInfo = null;
        _this.mEvents = new Helper_1.Queue();
        _this.mReliableDataChannelReady = false;
        _this.mUnreliableDataChannelReady = false;
        _this.mConnectionId = id;
        return _this;
    }
    Object.defineProperty(WebRtcDataPeer.prototype, "ConnectionId", {
        get: function () {
            return this.mConnectionId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebRtcDataPeer.prototype, "SignalingInfo", {
        get: function () {
            return this.mInfo;
        },
        enumerable: false,
        configurable: true
    });
    WebRtcDataPeer.prototype.SetSignalingInfo = function (info) {
        this.mInfo = info;
    };
    WebRtcDataPeer.prototype.OnSetup = function () {
        var _this = this;
        this.mPeer.ondatachannel = function (ev) { _this.OnDataChannel(ev.channel); };
    };
    WebRtcDataPeer.prototype.OnStartSignaling = function () {
        var configReliable = {};
        this.mReliableDataChannel = this.mPeer.createDataChannel(WebRtcDataPeer.sLabelReliable, configReliable);
        this.RegisterObserverReliable();
        var configUnreliable = {};
        configUnreliable.maxRetransmits = 0;
        configUnreliable.ordered = false;
        this.mUnreliableDataChannel = this.mPeer.createDataChannel(WebRtcDataPeer.sLabelUnreliable, configUnreliable);
        this.RegisterObserverUnreliable();
    };
    WebRtcDataPeer.prototype.OnCleanup = function () {
        if (this.mReliableDataChannel != null)
            this.mReliableDataChannel.close();
        if (this.mUnreliableDataChannel != null)
            this.mUnreliableDataChannel.close();
        //dont set to null. handlers will be called later
    };
    WebRtcDataPeer.prototype.RegisterObserverReliable = function () {
        var _this = this;
        this.mReliableDataChannel.onmessage = function (event) { _this.ReliableDataChannel_OnMessage(event); };
        this.mReliableDataChannel.onopen = function (event) { _this.ReliableDataChannel_OnOpen(); };
        this.mReliableDataChannel.onclose = function (event) { _this.ReliableDataChannel_OnClose(); };
        this.mReliableDataChannel.onerror = function (event) { _this.ReliableDataChannel_OnError(""); }; //should the event just be a string?
    };
    WebRtcDataPeer.prototype.RegisterObserverUnreliable = function () {
        var _this = this;
        this.mUnreliableDataChannel.onmessage = function (event) { _this.UnreliableDataChannel_OnMessage(event); };
        this.mUnreliableDataChannel.onopen = function (event) { _this.UnreliableDataChannel_OnOpen(); };
        this.mUnreliableDataChannel.onclose = function (event) { _this.UnreliableDataChannel_OnClose(); };
        this.mUnreliableDataChannel.onerror = function (event) { _this.UnreliableDataChannel_OnError(""); }; //should the event just be a string?
    };
    WebRtcDataPeer.prototype.SendData = function (data, /* offset : number, length : number,*/ reliable) {
        //let buffer: ArrayBufferView = data.subarray(offset, offset + length) as ArrayBufferView;
        var buffer = data;
        var MAX_SEND_BUFFER = 1024 * 1024;
        //chrome bug: If the channels is closed remotely trough disconnect
        //then the local channel can appear open but will throw an exception
        //if send is called
        var sentSuccessfully = false;
        try {
            if (reliable) {
                if (this.mReliableDataChannel.readyState === "open") {
                    //bugfix: WebRTC seems to simply close the data channel if we send
                    //too much at once. avoid this from now on by returning false
                    //if the buffer gets too full
                    if ((this.mReliableDataChannel.bufferedAmount + buffer.byteLength) < MAX_SEND_BUFFER) {
                        this.mReliableDataChannel.send(buffer);
                        sentSuccessfully = true;
                    }
                }
            }
            else {
                if (this.mUnreliableDataChannel.readyState === "open") {
                    if ((this.mUnreliableDataChannel.bufferedAmount + buffer.byteLength) < MAX_SEND_BUFFER) {
                        this.mUnreliableDataChannel.send(buffer);
                        sentSuccessfully = true;
                    }
                }
            }
        }
        catch (e) {
            Helper_1.SLog.LogError("Exception while trying to send: " + e);
        }
        return sentSuccessfully;
    };
    WebRtcDataPeer.prototype.GetBufferedAmount = function (reliable) {
        var result = -1;
        try {
            if (reliable) {
                if (this.mReliableDataChannel.readyState === "open") {
                    result = this.mReliableDataChannel.bufferedAmount;
                }
            }
            else {
                if (this.mUnreliableDataChannel.readyState === "open") {
                    result = this.mUnreliableDataChannel.bufferedAmount;
                }
            }
        }
        catch (e) {
            Helper_1.SLog.LogError("Exception while trying to access GetBufferedAmount: " + e);
        }
        return result;
    };
    WebRtcDataPeer.prototype.DequeueEvent = function (/*out*/ ev) {
        //lock(mEvents)
        {
            if (this.mEvents.Count() > 0) {
                ev.val = this.mEvents.Dequeue();
                return true;
            }
        }
        return false;
    };
    WebRtcDataPeer.prototype.Enqueue = function (ev) {
        //lock(mEvents)
        {
            this.mEvents.Enqueue(ev);
        }
    };
    WebRtcDataPeer.prototype.OnDataChannel = function (data_channel) {
        var newChannel = data_channel;
        if (newChannel.label == WebRtcDataPeer.sLabelReliable) {
            this.mReliableDataChannel = newChannel;
            this.RegisterObserverReliable();
        }
        else if (newChannel.label == WebRtcDataPeer.sLabelUnreliable) {
            this.mUnreliableDataChannel = newChannel;
            this.RegisterObserverUnreliable();
        }
        else {
            Helper_1.Debug.LogError("Datachannel with unexpected label " + newChannel.label);
        }
    };
    WebRtcDataPeer.prototype.RtcOnMessageReceived = function (event, reliable) {
        var eventType = index_1.NetEventType.UnreliableMessageReceived;
        if (reliable) {
            eventType = index_1.NetEventType.ReliableMessageReceived;
        }
        //async conversion to blob/arraybuffer here
        if (event.data instanceof ArrayBuffer) {
            var buffer = new Uint8Array(event.data);
            this.Enqueue(new index_1.NetworkEvent(eventType, this.mConnectionId, buffer));
        }
        else if (event.data instanceof Blob) {
            var connectionId = this.mConnectionId;
            var fileReader = new FileReader();
            var self = this;
            fileReader.onload = function () {
                //need to use function as this pointer is needed to reference to the data
                var data = this.result;
                var buffer = new Uint8Array(data);
                self.Enqueue(new index_1.NetworkEvent(eventType, self.mConnectionId, buffer));
            };
            fileReader.readAsArrayBuffer(event.data);
        }
        else {
            Helper_1.Debug.LogError("Invalid message type. Only blob and arraybuffer supported: " + event.data);
        }
    };
    WebRtcDataPeer.prototype.ReliableDataChannel_OnMessage = function (event) {
        Helper_1.Debug.Log("ReliableDataChannel_OnMessage ");
        this.RtcOnMessageReceived(event, true);
    };
    WebRtcDataPeer.prototype.ReliableDataChannel_OnOpen = function () {
        Helper_1.Debug.Log("mReliableDataChannelReady");
        this.mReliableDataChannelReady = true;
        if (this.IsRtcConnected()) {
            this.RtcSetConnected();
            Helper_1.Debug.Log("Fully connected");
        }
    };
    WebRtcDataPeer.prototype.ReliableDataChannel_OnClose = function () {
        this.RtcSetClosed();
    };
    WebRtcDataPeer.prototype.ReliableDataChannel_OnError = function (errorMsg) {
        Helper_1.Debug.LogError(errorMsg);
        this.RtcSetClosed();
    };
    WebRtcDataPeer.prototype.UnreliableDataChannel_OnMessage = function (event) {
        Helper_1.Debug.Log("UnreliableDataChannel_OnMessage ");
        this.RtcOnMessageReceived(event, false);
    };
    WebRtcDataPeer.prototype.UnreliableDataChannel_OnOpen = function () {
        Helper_1.Debug.Log("mUnreliableDataChannelReady");
        this.mUnreliableDataChannelReady = true;
        if (this.IsRtcConnected()) {
            this.RtcSetConnected();
            Helper_1.Debug.Log("Fully connected");
        }
    };
    WebRtcDataPeer.prototype.UnreliableDataChannel_OnClose = function () {
        this.RtcSetClosed();
    };
    WebRtcDataPeer.prototype.UnreliableDataChannel_OnError = function (errorMsg) {
        Helper_1.Debug.LogError(errorMsg);
        this.RtcSetClosed();
    };
    WebRtcDataPeer.prototype.IsRtcConnected = function () {
        return this.mReliableDataChannelReady && this.mUnreliableDataChannelReady;
    };
    WebRtcDataPeer.sLabelReliable = "reliable";
    WebRtcDataPeer.sLabelUnreliable = "unreliable";
    return WebRtcDataPeer;
}(AWebRtcPeer));
exports.WebRtcDataPeer = WebRtcDataPeer;

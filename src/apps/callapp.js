"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.callapp = exports.CallApp = void 0;
var awrtc = require("../awrtc/index");
var index_1 = require("../awrtc/index");
/**
 * Main (and most complicated) example for using BrowserWebRtcCall.
 * Have a look at examples.html for easier scenarios.
 *
 *
 *
 * Features:
 * - Build a "Join" system on top of the regular Listen / Call model to make it easier to use.
 * - basic user interface (This is for easy testing not for use as a final application!!! Write your own using the API)
 * - setup to be compatible with the Unity Asset's CallApp (but without TURN server!)
 * - Get parameters from the address line to configure the call
 * - autostart the call (this might not work in all browsers. Mostly used for testing)
 * Todo:
 * - text message system (so far it sends back the same message)
 * - conference call support
 *
 *
 */
var CallApp = /** @class */ (function () {
    function CallApp() {
        var _this = this;
        this.mNetConfig = new awrtc.NetworkConfig();
        this.mCall = null;
        //update loop
        this.mIntervalId = -1;
        this.mLocalVideo = null;
        this.mRemoteVideo = {};
        this.mIsRunning = false;
        this.Ui_OnStartStopButtonClicked = function () {
            _this.UI_UiToValues();
            if (_this.mIsRunning) {
                _this.Stop();
            }
            else {
                _this.Start(_this.mAddress);
            }
        };
        //UI to values
        this.Ui_OnUpdate = function () {
            console.debug("OnUiUpdate");
            _this.UI_UiToValues();
        };
        this.mNetConfig.IceServers = [
            { urls: "stun:stun.because-why-not.com:443" },
            { urls: "stun:stun.l.google.com:19302" }
        ];
        //use for testing conferences 
        //this.mNetConfig.IsConference = true;
        //this.mNetConfig.SignalingUrl = "wss://signaling.because-why-not.com/testshared";
        this.mNetConfig.IsConference = false;
        this.mNetConfig.SignalingUrl = "wss://signaling.because-why-not.com/callapp";
    }
    CallApp.prototype.GetParameterByName = function (name) {
        var url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
        if (!results)
            return null;
        if (!results[2])
            return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    };
    CallApp.prototype.tobool = function (value, defaultval) {
        if (value === true || value === "true")
            return true;
        if (value === false || value === "false")
            return false;
        return defaultval;
    };
    CallApp.prototype.Start = function (address) {
        var _this = this;
        if (this.mCall != null)
            this.Stop();
        this.mIsRunning = true;
        this.Ui_OnStart();
        console.log("start");
        console.log("Using signaling server url: " + this.mNetConfig.SignalingUrl);
        //create media configuration
        var config = this.mMediaConfig;
        config.IdealFps = 30;
        //For usage in HTML set FrameUpdates to false and wait for  MediaUpdate to
        //get the VideoElement. By default awrtc would deliver frames individually
        //for use in Unity WebGL
        console.log("requested config:" + JSON.stringify(config));
        //setup our high level call class.
        this.mCall = new awrtc.BrowserWebRtcCall(this.mNetConfig);
        //handle events (get triggered after Configure / Listen call)
        //+ugly lambda to avoid loosing "this" reference
        this.mCall.addEventListener(function (sender, args) {
            _this.OnNetworkEvent(sender, args);
        });
        //As the system is designed for realtime graphics we have to call the Update method. Events are only
        //triggered during this Update call!
        this.mIntervalId = setInterval(function () {
            _this.Update();
        }, 50);
        //configure media. This will request access to media and can fail if the user doesn't have a proper device or
        //blocks access
        this.mCall.Configure(config);
        //Try to listen to the address 
        //Conference mode = everyone listening will connect to each other
        //Call mode -> If the address is free it will wait for someone else to connect
        //          -> If the address is used then it will fail to listen and then try to connect via Call(address);
        this.mCall.Listen(address);
    };
    CallApp.prototype.Stop = function () {
        this.Cleanup();
    };
    CallApp.prototype.Cleanup = function () {
        if (this.mCall != null) {
            this.mCall.Dispose();
            this.mCall = null;
            clearInterval(this.mIntervalId);
            this.mIntervalId = -1;
            this.mIsRunning = false;
            this.mLocalVideo = null;
            this.mRemoteVideo = {};
        }
        this.Ui_OnCleanup();
    };
    CallApp.prototype.Update = function () {
        if (this.mCall != null)
            this.mCall.Update();
    };
    CallApp.prototype.OnNetworkEvent = function (sender, args) {
        //User gave access to requested camera/ microphone
        if (args.Type == awrtc.CallEventType.ConfigurationComplete) {
            console.log("configuration complete");
        }
        else if (args.Type == awrtc.CallEventType.MediaUpdate) {
            var margs = args;
            if (this.mLocalVideo == null && margs.ConnectionId == awrtc.ConnectionId.INVALID) {
                var videoElement = margs.VideoElement;
                this.mLocalVideo = videoElement;
                this.Ui_OnLocalVideo(videoElement);
                console.log("local video added resolution:" + videoElement.videoWidth + videoElement.videoHeight + " fps: ??");
            }
            else if (margs.ConnectionId != awrtc.ConnectionId.INVALID && this.mRemoteVideo[margs.ConnectionId.id] == null) {
                var videoElement = margs.VideoElement;
                this.mRemoteVideo[margs.ConnectionId.id] = videoElement;
                this.Ui_OnRemoteVideo(videoElement, margs.ConnectionId);
                console.log("remote video added resolution:" + videoElement.videoWidth + videoElement.videoHeight + " fps: ??");
            }
        }
        else if (args.Type == awrtc.CallEventType.ListeningFailed) {
            //First attempt of this example is to try to listen on a certain address
            //for conference calls this should always work (expect the internet is dead)
            if (this.mNetConfig.IsConference == false) {
                //no conference call and listening failed? someone might have claimed the address.
                //Try to connect to existing call
                this.mCall.Call(this.mAddress);
            }
            else {
                var errorMsg = "Listening failed. Offline? Server dead?";
                console.error(errorMsg);
                this.Ui_OnError(errorMsg);
                this.Cleanup();
                return;
            }
        }
        else if (args.Type == awrtc.CallEventType.ConnectionFailed) {
            //Outgoing call failed entirely. This can mean there is no address to connect to,
            //server is offline, internet is dead, firewall blocked access, ...
            var errorMsg = "Connection failed. Offline? Server dead? ";
            console.error(errorMsg);
            this.Ui_OnError(errorMsg);
            this.Cleanup();
            return;
        }
        else if (args.Type == awrtc.CallEventType.CallEnded) {
            //call ended or was disconnected
            var callEndedEvent = args;
            console.log("call ended with id " + callEndedEvent.ConnectionId.id);
            delete this.mRemoteVideo[callEndedEvent.ConnectionId.id];
            this.Ui_OnLog("Disconnected from user with id " + callEndedEvent.ConnectionId.id);
            //check if this was the last user
            if (this.mNetConfig.IsConference == false && Object.keys(this.mRemoteVideo).length == 0) {
                //1 to 1 call and only user left -> quit
                this.Cleanup();
                return;
            }
        }
        else if (args.Type == awrtc.CallEventType.Message) {
            //no ui for this yet. simply echo messages for testing
            var messageArgs = args;
            this.mCall.Send(messageArgs.Content, messageArgs.Reliable, messageArgs.ConnectionId);
        }
        else if (args.Type == awrtc.CallEventType.DataMessage) {
            //no ui for this yet. simply echo messages for testing
            var messageArgs = args;
            this.mCall.SendData(messageArgs.Content, messageArgs.Reliable, messageArgs.ConnectionId);
        }
        else if (args.Type == awrtc.CallEventType.CallAccepted) {
            var arg = args;
            console.log("New call accepted id: " + arg.ConnectionId.id);
        }
        else if (args.Type == awrtc.CallEventType.WaitForIncomingCall) {
            console.log("Waiting for incoming call ...");
        }
        else {
            console.log("Unhandled event: " + args.Type);
        }
    };
    CallApp.prototype.setupUi = function (parent) {
        this.mMediaConfig = new index_1.MediaConfig();
        this.mUiAddress = parent.querySelector(".callapp_address");
        this.mUiAudio = parent.querySelector(".callapp_send_audio");
        this.mUiVideo = parent.querySelector(".callapp_send_video");
        this.mUiWidth = parent.querySelector(".callapp_width");
        this.mUiHeight = parent.querySelector(".callapp_height");
        this.mUiUrl = parent.querySelector(".callapp_url");
        this.mUiButton = parent.querySelector(".callapp_button");
        this.mUiLocalVideoParent = parent.querySelector(".callapp_local_video");
        this.mUiRemoteVideoParent = parent.querySelector(".callapp_remote_video");
        this.mUiAudio.onclick = this.Ui_OnUpdate;
        this.mUiVideo.onclick = this.Ui_OnUpdate;
        this.mUiAddress.onkeyup = this.Ui_OnUpdate;
        this.mUiButton.onclick = this.Ui_OnStartStopButtonClicked;
        this.UI_ParameterToUi();
        this.UI_UiToValues();
        //if autostart is set but no address is given -> create one and reopen the page
        if (this.mAddress === null && this.mAutostart == true) {
            this.mAddress = this.GenerateRandomKey();
            window.location.href = this.GetUrlParams();
        }
        else {
            if (this.mAddress === null)
                this.mAddress = this.GenerateRandomKey();
            this.Ui_ValuesToUi();
        }
        //used for interacting with the Unity CallApp
        //current hack to get the html element delivered. by default this
        //just the image is copied and given as array
        //Lazy frames will be the default soon though
        if (this.mAutostart) {
            console.log("Starting automatically ... ");
            this.Start(this.mAddress);
        }
        console.log("address: " + this.mAddress + " audio: " + this.mMediaConfig.Audio + " video: " + this.mMediaConfig.Video + " autostart: " + this.mAutostart);
    };
    CallApp.prototype.Ui_OnStart = function () {
        this.mUiButton.textContent = "Stop";
    };
    CallApp.prototype.Ui_OnCleanup = function () {
        this.mUiButton.textContent = "Join";
        while (this.mUiLocalVideoParent.hasChildNodes()) {
            this.mUiLocalVideoParent.removeChild(this.mUiLocalVideoParent.firstChild);
        }
        while (this.mUiRemoteVideoParent.hasChildNodes()) {
            this.mUiRemoteVideoParent.removeChild(this.mUiRemoteVideoParent.firstChild);
        }
    };
    CallApp.prototype.Ui_OnLog = function (msg) {
    };
    CallApp.prototype.Ui_OnError = function (msg) {
    };
    CallApp.prototype.Ui_OnLocalVideo = function (video) {
        this.mUiLocalVideoParent.appendChild(document.createElement("br"));
        this.mUiLocalVideoParent.appendChild(video);
    };
    CallApp.prototype.Ui_OnRemoteVideo = function (video, id) {
        this.mUiRemoteVideoParent.appendChild(document.createElement("br"));
        this.mUiRemoteVideoParent.appendChild(new Text("connection " + id.id));
        this.mUiRemoteVideoParent.appendChild(document.createElement("br"));
        this.mUiRemoteVideoParent.appendChild(video);
    };
    CallApp.prototype.UI_ParameterToUi = function () {
        this.mUiAudio.checked = this.tobool(this.GetParameterByName("audio"), true);
        this.mUiVideo.checked = this.tobool(this.GetParameterByName("video"), true);
        var width = this.GetParameterByName("width");
        if (width)
            this.mUiWidth.value = width;
        var height = this.GetParameterByName("height");
        if (height)
            this.mUiHeight.value = height;
        this.mUiAddress.value = this.GetParameterByName("a");
        this.mAutostart = this.GetParameterByName("autostart");
        this.mAutostart = this.tobool(this.mAutostart, false);
    };
    CallApp.prototype.UI_ParseRes = function (element) {
        if (element) {
            var val = Math.floor(element.value);
            if (val > 0)
                return val;
        }
        return -1;
    };
    CallApp.prototype.UI_UiToValues = function () {
        this.mAddress = this.mUiAddress.value;
        this.mMediaConfig.Audio = this.mUiAudio.checked;
        this.mMediaConfig.Video = this.mUiVideo.checked;
        this.mMediaConfig.IdealWidth = this.UI_ParseRes(this.mUiWidth);
        this.mMediaConfig.IdealHeight = this.UI_ParseRes(this.mUiHeight);
        this.mUiUrl.innerHTML = this.ValuesToParameter();
    };
    //Values to UI
    CallApp.prototype.Ui_ValuesToUi = function () {
        console.log("UpdateUi");
        this.mUiAddress.value = this.mAddress;
        this.mUiAudio.checked = this.mMediaConfig.Audio;
        this.mUiVideo.checked = this.mMediaConfig.Video;
        this.mUiWidth.value = "";
        if (this.mMediaConfig.IdealWidth > 0)
            this.mUiWidth.value = "" + this.mMediaConfig.IdealWidth;
        this.mUiHeight.value = "";
        if (this.mMediaConfig.IdealHeight > 0)
            this.mUiHeight.value = "" + this.mMediaConfig.IdealHeight;
        this.mUiUrl.innerHTML = this.ValuesToParameter();
    };
    CallApp.prototype.GenerateRandomKey = function () {
        var result = "";
        for (var i = 0; i < 7; i++) {
            result += String.fromCharCode(65 + Math.round(Math.random() * 25));
        }
        return result;
    };
    CallApp.prototype.GetUrlParams = function () {
        return "?a=" + this.mAddress + "&audio=" + this.mMediaConfig.Audio + "&video=" + this.mMediaConfig.Video + "&" + "autostart=" + false;
    };
    CallApp.prototype.ValuesToParameter = function () {
        return location.protocol + '//' + location.host + location.pathname + this.GetUrlParams();
    };
    return CallApp;
}());
exports.CallApp = CallApp;
function callapp(parent) {
    var callApp;
    console.log("init callapp");
    if (parent == null) {
        console.log("parent was null");
        parent = document.body;
    }
    awrtc.SLog.SetLogLevel(awrtc.SLogLevel.Info);
    callApp = new CallApp();
    callApp.setupUi(parent);
}
exports.callapp = callapp;

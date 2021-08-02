"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserWebRtcCall_minimal = exports.WebRtcNetwork_minimal = void 0;
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
var awrtc = require("../awrtc/index");
var apphelpers_1 = require("./apphelpers");
var index_1 = require("../awrtc/index");
//Creates two WebRtcNetwork objects and connects them
//directly + sends test messages
function WebRtcNetwork_minimal() {
    console.log("test1");
    var testMessage = "test1234";
    var websocketurl = apphelpers_1.DefaultValues.Signaling;
    var rtcConfig = { iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] };
    var srv = new awrtc.WebRtcNetwork(new awrtc.SignalingConfig(new index_1.WebsocketNetwork(websocketurl)), rtcConfig);
    srv.StartServer();
    var clt = new awrtc.WebRtcNetwork(new awrtc.SignalingConfig(new index_1.WebsocketNetwork(websocketurl)), rtcConfig);
    setInterval(function () {
        srv.Update();
        var evt = null;
        while (evt = srv.Dequeue()) {
            console.log("server inc: " + evt.toString());
            if (evt.Type == awrtc.NetEventType.ServerInitialized) {
                console.log("server started. Address " + evt.Info);
                clt.Connect(evt.Info);
            }
            else if (evt.Type == awrtc.NetEventType.ServerInitFailed) {
                console.error("server start failed");
            }
            else if (evt.Type == awrtc.NetEventType.NewConnection) {
                console.log("server new incoming connection");
            }
            else if (evt.Type == awrtc.NetEventType.Disconnected) {
                console.log("server peer disconnected");
                console.log("server shutdown");
                srv.Shutdown();
            }
            else if (evt.Type == awrtc.NetEventType.ReliableMessageReceived) {
                srv.SendData(evt.ConnectionId, evt.MessageData, true);
            }
            else if (evt.Type == awrtc.NetEventType.UnreliableMessageReceived) {
                srv.SendData(evt.ConnectionId, evt.MessageData, false);
            }
        }
        srv.Flush();
        clt.Update();
        while (evt = clt.Dequeue()) {
            console.log("client inc: " + evt.toString());
            if (evt.Type == awrtc.NetEventType.NewConnection) {
                console.log("client connection established");
                var buff = awrtc.Encoding.UTF16.GetBytes(testMessage);
                clt.SendData(evt.ConnectionId, buff, true);
            }
            else if (evt.Type == awrtc.NetEventType.ReliableMessageReceived) {
                //check last message
                var str = awrtc.Encoding.UTF16.GetString(evt.MessageData);
                if (str != testMessage) {
                    console.error("Test failed sent string %s but received string %s", testMessage, str);
                }
                var buff = awrtc.Encoding.UTF16.GetBytes(testMessage);
                clt.SendData(evt.ConnectionId, buff, false);
            }
            else if (evt.Type == awrtc.NetEventType.UnreliableMessageReceived) {
                var str = awrtc.Encoding.UTF16.GetString(evt.MessageData);
                if (str != testMessage) {
                    console.error("Test failed sent string %s but received string %s", testMessage, str);
                }
                console.log("client disconnecting");
                clt.Disconnect(evt.ConnectionId);
                console.log("client shutting down");
                clt.Shutdown();
            }
        }
        clt.Flush();
    }, 100);
}
exports.WebRtcNetwork_minimal = WebRtcNetwork_minimal;
var MinimalCall = /** @class */ (function () {
    function MinimalCall(id, netConfig, mediaConfig) {
        //just a number we give each local call to
        //identify the output of each individual call
        this.mId = -1;
        this.mCall = null;
        this.mLocalVideo = null;
        this.mRemoteVideo = {};
        this.mId = id;
        this.mNetConfig = netConfig;
        this.mMediaConfig = mediaConfig;
    }
    MinimalCall.prototype.Start = function (address) {
        var _this = this;
        this.mDiv = document.createElement("div");
        document.body.appendChild(this.mDiv);
        this.mDiv.innerHTML += "<h1>Call " + this.mId + "</h1>";
        this.mAddress = address;
        this.mCall = new awrtc.BrowserWebRtcCall(this.mNetConfig);
        this.mCall.addEventListener(function (sender, args) {
            _this.OnCallEvent(sender, args);
        });
        setInterval(function () {
            _this.Update();
        }, 50);
        this.mCall.Configure(this.mMediaConfig);
    };
    MinimalCall.prototype.OnCallEvent = function (sender, args) {
        if (args.Type == awrtc.CallEventType.ConfigurationComplete) {
            console.log("configuration complete");
            this.mCall.Listen(this.mAddress);
        } /* Old system. not used anymore
         else if (args.Type == awrtc.CallEventType.FrameUpdate) {

            let frameUpdateArgs = args as awrtc.FrameUpdateEventArgs;
            if (this.mLocalVideo == null && frameUpdateArgs.ConnectionId == awrtc.ConnectionId.INVALID) {
                this.mDiv.innerHTML += "local video: " + "<br>";
                console.log(this.mId  + ":local video added");
                let lazyFrame = frameUpdateArgs.Frame as awrtc.LazyFrame;
                this.mLocalVideo = lazyFrame.FrameGenerator.VideoElement;
                this.mDiv.appendChild(this.mLocalVideo);


            } else if (frameUpdateArgs.ConnectionId != awrtc.ConnectionId.INVALID && this.mRemoteVideo[frameUpdateArgs.ConnectionId.id] == null) {
                console.log(this.mId  + ":remote video added");
                let lazyFrame = frameUpdateArgs.Frame as awrtc.LazyFrame;
                this.mDiv.innerHTML += "remote " + this.mId + "<br>";
                this.mRemoteVideo[frameUpdateArgs.ConnectionId.id] = lazyFrame.FrameGenerator.VideoElement;
                this.mDiv.appendChild(this.mRemoteVideo[frameUpdateArgs.ConnectionId.id]);
            }
        }*/
        else if (args.Type == awrtc.CallEventType.MediaUpdate) {
            var margs = args;
            if (this.mLocalVideo == null && margs.ConnectionId == awrtc.ConnectionId.INVALID) {
                var videoElement = margs.VideoElement;
                this.mLocalVideo = videoElement;
                this.mDiv.innerHTML += "local video: " + "<br>";
                this.mDiv.appendChild(videoElement);
                console.log("local video added resolution:" + videoElement.videoWidth + videoElement.videoHeight + " fps: ??");
            }
            else if (margs.ConnectionId != awrtc.ConnectionId.INVALID && this.mRemoteVideo[margs.ConnectionId.id] == null) {
                var videoElement = margs.VideoElement;
                this.mRemoteVideo[margs.ConnectionId.id] = videoElement;
                this.mDiv.innerHTML += "remote " + this.mId + "<br>";
                this.mDiv.appendChild(videoElement);
                console.log("remote video added resolution:" + videoElement.videoWidth + videoElement.videoHeight + " fps: ??");
            }
        }
        else if (args.Type == awrtc.CallEventType.ListeningFailed) {
            if (this.mNetConfig.IsConference == false) {
                //in 1 to 1 calls there is a listener and a caller
                //if we try to listen first and it fails it likely means
                //the other side is waiting for an incoming call
                this.mCall.Call(this.mAddress);
            }
            else {
                //in conference mode there is no "caller" as everyone
                //just joins a single call via Listen call. if it fails
                //there is likely a network fault / configuration error
                console.error(this.mId + ":Listening failed. Server dead?");
            }
        }
        else if (args.Type == awrtc.CallEventType.ConnectionFailed) {
            alert(this.mId + ":connection failed");
        }
        else if (args.Type == awrtc.CallEventType.CallEnded) {
            var callEndedEvent = args;
            console.log(this.mId + ":call ended with id " + callEndedEvent.ConnectionId.id);
            //document.body.removeChild(mRemoteVideo[callEndedEvent.ConnectionId.id]);
            //remove properly
            this.mRemoteVideo[callEndedEvent.ConnectionId.id] = null;
        }
        else {
            console.log(args.Type);
        }
    };
    MinimalCall.prototype.Update = function () {
        this.mCall.Update();
    };
    return MinimalCall;
}());
//Example that creates two calls within the same
//browser window and streams from one end to the
//other. 
function BrowserWebRtcCall_minimal() {
    var netConfig = new awrtc.NetworkConfig();
    netConfig.IsConference = false;
    netConfig.SignalingUrl = apphelpers_1.DefaultValues.Signaling;
    var mediaConfigSender = new awrtc.MediaConfig();
    mediaConfigSender.Video = true;
    mediaConfigSender.Audio = true;
    mediaConfigSender.FrameUpdates = false;
    var mediaConfigReceiver = new awrtc.MediaConfig();
    mediaConfigReceiver.Video = false;
    mediaConfigReceiver.Audio = false;
    mediaConfigReceiver.FrameUpdates = false;
    //random key so we don't mistakenly connect
    //to another user
    //replace with fixed passphrase to connect multiple browser windows
    var address = apphelpers_1.GetRandomKey();
    var numberOfCalls = 2;
    //creates a call that sends audio and video to the other side
    var sender = new MinimalCall(1, netConfig, mediaConfigSender);
    sender.Start(address);
    //will create a call that is just receiving
    var receiver = new MinimalCall(2, netConfig, mediaConfigReceiver);
    receiver.Start(address);
}
exports.BrowserWebRtcCall_minimal = BrowserWebRtcCall_minimal;

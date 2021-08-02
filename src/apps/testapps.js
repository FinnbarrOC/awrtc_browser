"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserMediaNetwork_frameaccess = exports.BrowserMediaNetwork_TestLocalCamera = exports.WebsocketNetwork_test1 = exports.WebsocketNetwork_sharedaddress = exports.CAPI_MediaNetwork_testapp = exports.CAPI_WebRtcNetwork_testapp = void 0;
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
//This file only contains badly maintained
//test apps. Use only experimentation. 
//For proper examples look at examples.ts
//testapp to run a full connection test using the CAPI
//which is used by the unity WebGL plugin
function CAPI_WebRtcNetwork_testapp() {
    console.log("test1");
    var testMessage = "test1234";
    //var configuration = "{ \"signaling\" :  { \"class\": \"WebsocketNetwork\", \"param\" : \"ws://localhost:12776\"}, \"iceServers\":[\"stun:stun.l.google.com:19302\"]}";
    var configuration = "{ \"signaling\" :  { \"class\": \"LocalNetwork\", \"param\" : null}, \"iceServers\":[{\"urls\": \"stun:stun.l.google.com:19302\"}]}";
    var srv = awrtc.CAPI_WebRtcNetwork_Create(configuration);
    awrtc.CAPI_WebRtcNetwork_StartServer(srv, "Room1");
    var clt = awrtc.CAPI_WebRtcNetwork_Create(configuration);
    setInterval(function () {
        awrtc.CAPI_WebRtcNetwork_Update(srv);
        var evt = null;
        while (evt = awrtc.CAPI_WebRtcNetwork_Dequeue(srv)) {
            console.log("server inc: " + evt.toString());
            if (evt.Type == awrtc.NetEventType.ServerInitialized) {
                console.log("server started. Address " + evt.Info);
                awrtc.CAPI_WebRtcNetwork_Connect(clt, evt.Info);
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
                awrtc.CAPI_WebRtcNetwork_Shutdown(srv);
            }
            else if (evt.Type == awrtc.NetEventType.ReliableMessageReceived) {
                //srv.SendData(evt.ConnectionId, evt.MessageData, true);
                awrtc.CAPI_WebRtcNetwork_SendData(srv, evt.ConnectionId.id, evt.MessageData, true);
            }
            else if (evt.Type == awrtc.NetEventType.UnreliableMessageReceived) {
                //srv.SendData(evt.ConnectionId, evt.MessageData, false);
                awrtc.CAPI_WebRtcNetwork_SendData(srv, evt.ConnectionId.id, evt.MessageData, false);
            }
        }
        //srv.Flush();
        awrtc.CAPI_WebRtcNetwork_Flush(srv);
        //clt.Update();
        awrtc.CAPI_WebRtcNetwork_Update(clt);
        while (evt = awrtc.CAPI_WebRtcNetwork_Dequeue(clt)) {
            console.log("client inc: " + evt.toString());
            if (evt.Type == awrtc.NetEventType.NewConnection) {
                console.log("client connection established");
                var buff = awrtc.Encoding.UTF16.GetBytes(testMessage);
                //clt.SendData(evt.ConnectionId, buff, true);
                awrtc.CAPI_WebRtcNetwork_SendData(clt, evt.ConnectionId.id, buff, true);
            }
            else if (evt.Type == awrtc.NetEventType.ReliableMessageReceived) {
                //check last message
                var str = awrtc.Encoding.UTF16.GetString(evt.MessageData);
                if (str != testMessage) {
                    console.error("Test failed sent string %s but received string %s", testMessage, str);
                }
                var buff = awrtc.Encoding.UTF16.GetBytes(testMessage);
                //clt.SendData(evt.ConnectionId, buff, false);
                awrtc.CAPI_WebRtcNetwork_SendData(clt, evt.ConnectionId.id, buff, false);
            }
            else if (evt.Type == awrtc.NetEventType.UnreliableMessageReceived) {
                var str = awrtc.Encoding.UTF16.GetString(evt.MessageData);
                if (str != testMessage) {
                    console.error("Test failed sent string %s but received string %s", testMessage, str);
                }
                console.log("client disconnecting");
                //clt.Disconnect(evt.ConnectionId);
                awrtc.CAPI_WebRtcNetwork_Disconnect(clt, evt.ConnectionId.id);
                console.log("client shutting down");
                //clt.Shutdown();
                awrtc.CAPI_WebRtcNetwork_Shutdown(clt);
            }
        }
        //clt.Flush();
        awrtc.CAPI_WebRtcNetwork_Flush(clt);
    }, 100);
}
exports.CAPI_WebRtcNetwork_testapp = CAPI_WebRtcNetwork_testapp;
//for testing the media API used by the unity plugin
function CAPI_MediaNetwork_testapp() {
    awrtc.BrowserMediaStream.DEBUG_SHOW_ELEMENTS = true;
    var signalingUrl = apphelpers_1.DefaultValues.Signaling;
    var lIndex = awrtc.CAPI_MediaNetwork_Create("{\"IceUrls\":[\"stun:stun.l.google.com:19302\"], \"SignalingUrl\":\"ws://because-why-not.com:12776\"}");
    var configDone = false;
    awrtc.CAPI_MediaNetwork_Configure(lIndex, true, true, 160, 120, 640, 480, 640, 480, -1, -1, -1);
    console.log(awrtc.CAPI_MediaNetwork_GetConfigurationState(lIndex));
    var startTime = new Date().getTime();
    var mainLoop = function () {
        awrtc.CAPI_WebRtcNetwork_Update(lIndex);
        if (awrtc.CAPI_MediaNetwork_GetConfigurationState(lIndex) == awrtc.MediaConfigurationState.Successful && configDone == false) {
            configDone = true;
            console.log("configuration done");
        }
        if (awrtc.CAPI_MediaNetwork_GetConfigurationState(lIndex) == awrtc.MediaConfigurationState.Failed) {
            alert("configuration failed");
        }
        if (configDone == false)
            console.log(awrtc.CAPI_MediaNetwork_GetConfigurationState(lIndex));
        if ((new Date().getTime() - startTime) < 15000) {
            window.requestAnimationFrame(mainLoop);
        }
        else {
            console.log("shutting down");
            awrtc.CAPI_WebRtcNetwork_Release(lIndex);
        }
    };
    window.requestAnimationFrame(mainLoop);
}
exports.CAPI_MediaNetwork_testapp = CAPI_MediaNetwork_testapp;
//Tests shared address feature of the WebsocketNetwork
function WebsocketNetwork_sharedaddress() {
    console.log("WebsocketNetwork shared address test");
    var testMessage = "test1234";
    var local = true;
    var allowUnsafe = true;
    var url = apphelpers_1.DefaultValues.SignalingShared;
    var address = "sharedaddresstest";
    var network1 = new awrtc.WebsocketNetwork(url);
    var network2 = new awrtc.WebsocketNetwork(url);
    var network3 = new awrtc.WebsocketNetwork(url);
    var network1Greeting = awrtc.Encoding.UTF16.GetBytes("network1 says hi");
    var network2Greeting = awrtc.Encoding.UTF16.GetBytes("network2 says hi");
    var network3Greeting = awrtc.Encoding.UTF16.GetBytes("network3 says hi");
    //
    network1.StartServer(address);
    network2.StartServer(address);
    network3.StartServer(address);
    function UpdateNetwork(network, name) {
        network.Update();
        var evt = null;
        while (evt = network.Dequeue()) {
            if (evt.Type == awrtc.NetEventType.ServerInitFailed
                || evt.Type == awrtc.NetEventType.ConnectionFailed
                || evt.Type == awrtc.NetEventType.ServerClosed) {
                console.error(name + "inc: " + evt.toString());
            }
            else {
                console.log(name + "inc: " + evt.toString());
            }
            if (evt.Type == awrtc.NetEventType.ServerInitialized) {
            }
            else if (evt.Type == awrtc.NetEventType.ServerInitFailed) {
            }
            else if (evt.Type == awrtc.NetEventType.NewConnection) {
                var greeting = awrtc.Encoding.UTF16.GetBytes(name + "says WASSUP!");
                network.SendData(evt.ConnectionId, greeting, true);
            }
            else if (evt.Type == awrtc.NetEventType.Disconnected) {
            }
            else if (evt.Type == awrtc.NetEventType.ReliableMessageReceived) {
                var str = awrtc.Encoding.UTF16.GetString(evt.MessageData);
                console.log(name + " received: " + str);
            }
            else if (evt.Type == awrtc.NetEventType.UnreliableMessageReceived) {
            }
        }
        network.Flush();
    }
    var time = 0;
    setInterval(function () {
        UpdateNetwork(network1, "network1 ");
        UpdateNetwork(network2, "network2 ");
        UpdateNetwork(network3, "network3 ");
        time += 100;
        if (time == 10000) {
            console.log("network1 shutdown");
            network1.Shutdown();
        }
        if (time == 15000) {
            console.log("network2 shutdown");
            network2.Shutdown();
        }
        if (time == 20000) {
            console.log("network3 shutdown");
            network3.Shutdown();
        }
    }, 100);
}
exports.WebsocketNetwork_sharedaddress = WebsocketNetwork_sharedaddress;
function WebsocketNetwork_test1() {
    var testMessage = "test1234";
    var url = apphelpers_1.DefaultValues.Signaling;
    var srv = new awrtc.WebsocketNetwork(url);
    srv.StartServer();
    var clt = new awrtc.WebsocketNetwork(url);
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
exports.WebsocketNetwork_test1 = WebsocketNetwork_test1;
function BrowserMediaNetwork_TestLocalCamera() {
    //first get the device names
    var handler;
    handler = function () {
        awrtc.DeviceApi.RemOnChangedHandler(handler);
        BrowserMediaNetwork_TestLocalCameraInternal();
    };
    awrtc.DeviceApi.AddOnChangedHandler(handler);
    awrtc.DeviceApi.Update();
}
exports.BrowserMediaNetwork_TestLocalCamera = BrowserMediaNetwork_TestLocalCamera;
function BrowserMediaNetwork_TestLocalCameraInternal() {
    awrtc.BrowserMediaStream.DEBUG_SHOW_ELEMENTS = true;
    var networkConfig = new awrtc.NetworkConfig();
    networkConfig.SignalingUrl = null;
    var network = new awrtc.BrowserMediaNetwork(networkConfig);
    var mediaConfig = new awrtc.MediaConfig();
    mediaConfig.Audio = true;
    mediaConfig.Video = true;
    //test setting a specifid device here
    var keys = Object.keys(awrtc.DeviceApi.Devices);
    mediaConfig.VideoDeviceName = ""; //awrtc.DeviceApi.Devices[keys[0]].label;
    network.Configure(mediaConfig);
    setInterval(function () {
        network.Update();
        var frame = network.TryGetFrame(awrtc.ConnectionId.INVALID);
        if (frame != null)
            console.log("width" + frame.Width + " height:" + frame.Height + " data:" + frame.Buffer[0]);
        network.Flush();
    }, 50);
}
var FpsCounter = /** @class */ (function () {
    function FpsCounter() {
        this.lastRefresh = 0;
        this.fps = 0;
        this.counter = 0;
        this.isNew = false;
    }
    Object.defineProperty(FpsCounter.prototype, "Fps", {
        get: function () {
            return Math.round(this.fps);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FpsCounter.prototype, "IsNew", {
        get: function () {
            if (this.isNew) {
                this.isNew = false;
                return true;
            }
            return false;
        },
        enumerable: false,
        configurable: true
    });
    FpsCounter.prototype.Update = function () {
        this.counter++;
        var diff = new Date().getTime() - this.lastRefresh;
        var refresh_time = 2000;
        if (diff > refresh_time) {
            this.fps = this.counter / (diff / 1000);
            this.counter = 0;
            this.lastRefresh = new Date().getTime();
            this.isNew = true;
        }
    };
    return FpsCounter;
}());
//Sends video data between two peers within the same browser window
//and accesses the resulting frame data directly
function BrowserMediaNetwork_frameaccess() {
    //BrowserMediaStream.DEFAULT_FRAMERATE = 60;
    //awrtc.BrowserMediaStream.DEBUG_SHOW_ELEMENTS = true;
    var address = apphelpers_1.GetRandomKey();
    var networkConfig = new awrtc.NetworkConfig();
    networkConfig.SignalingUrl = apphelpers_1.DefaultValues.Signaling;
    var network1 = new awrtc.BrowserMediaNetwork(networkConfig);
    var network2 = new awrtc.BrowserMediaNetwork(networkConfig);
    var mediaConfig1 = new awrtc.MediaConfig();
    mediaConfig1.Audio = false;
    mediaConfig1.Video = true;
    /*
    mediaConfig1.IdealWidth = 320;
    mediaConfig1.IdealHeight = 240;
    //fps seems to be ignored by browsers even if
    //the camera specifically supports that setting
    mediaConfig1.IdealFps = 15;
    */
    var mediaConfig2 = new awrtc.MediaConfig();
    mediaConfig2.Audio = false;
    mediaConfig2.Video = false;
    var localFps = new FpsCounter();
    var remoteFps = new FpsCounter();
    var loopRate = new FpsCounter();
    setTimeout(function () {
        network1.Configure(mediaConfig1);
    }, 5000);
    setTimeout(function () {
        console.log("connecting network1");
        network1.StartServer(address);
        //if (network2 != null)
        //network2.Configure(mediaConfig);
    }, 10000);
    setTimeout(function () {
        if (network2 != null) {
            console.log("connecting network2");
            network2.Connect(address);
        }
    }, 15000);
    var remoteConId1 = null;
    var remoteConId2 = null;
    setInterval(function () {
        network1.Update();
        loopRate.Update();
        if (loopRate.IsNew)
            console.log("Loop rate: " + loopRate.Fps);
        var frame1 = null;
        var frame2 = null;
        frame1 = network1.TryGetFrame(awrtc.ConnectionId.INVALID);
        if (frame1 != null) {
            localFps.Update();
            if (localFps.IsNew)
                console.log("local1  width" + frame1.Width + " height:" + frame1.Height + "fps: " + localFps.Fps + " data:" + frame1.Buffer[0]);
        }
        var evt;
        while ((evt = network1.Dequeue()) != null) {
            console.log("network1: " + evt.toString());
            if (evt.Type == awrtc.NetEventType.NewConnection) {
                remoteConId1 = evt.ConnectionId;
            }
        }
        if (remoteConId1 != null) {
            frame1 = network1.TryGetFrame(remoteConId1);
            if (frame1 != null)
                console.log("remote1 width" + frame1.Width + " height:" + frame1.Height + " data:" + frame1.Buffer[0]);
        }
        network1.Flush();
        if (network2 == null)
            return;
        network2.Update();
        frame2 = network2.TryGetFrame(awrtc.ConnectionId.INVALID);
        if (frame2 != null)
            console.log("local2  width" + frame2.Width + " height:" + frame2.Height + " data:" + frame2.Buffer[0]);
        while ((evt = network2.Dequeue()) != null) {
            console.log("network2: " + evt.toString());
            if (evt.Type == awrtc.NetEventType.NewConnection) {
                remoteConId2 = evt.ConnectionId;
            }
        }
        if (remoteConId2 != null) {
            frame2 = network2.TryGetFrame(remoteConId2);
            if (frame2 != null) {
                remoteFps.Update();
                if (remoteFps.IsNew)
                    console.log("remote2 width" + frame2.Width + " height:" + frame2.Height + "fps: " + remoteFps.Fps + " data:" + frame2.Buffer[0]);
            }
        }
        network2.Flush();
    }, 10);
}
exports.BrowserMediaNetwork_frameaccess = BrowserMediaNetwork_frameaccess;

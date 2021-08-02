"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoinputapp = exports.VideoInputApp = void 0;
var awrtc = require("../awrtc/index");
/**
 * Copy of the CallApp to test custom video input
 */
var VideoInputApp = /** @class */ (function () {
    function VideoInputApp() {
        var _this = this;
        this.mNetConfig = new awrtc.NetworkConfig();
        this.mCall = null;
        //update loop
        this.mIntervalId = -1;
        this.mLocalVideo = null;
        this.mRemoteVideo = {};
        this.mIsRunning = false;
        this.Ui_OnStartStopButtonClicked = function () {
            if (_this.mIsRunning) {
                _this.Stop();
            }
            else {
                _this.Start(_this.mAddress, _this.mAudio, _this.mVideo);
            }
        };
        this.Ui_OnUpdate = function () {
            console.debug("OnUiUpdate");
            _this.mAddress = _this.mUiAddress.value;
            _this.mAudio = _this.mUiAudio.checked;
            _this.mVideo = _this.mUiVideo.checked;
            _this.mUiUrl.innerHTML = _this.GetUrl();
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
    VideoInputApp.prototype.GetParameterByName = function (name) {
        var url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
        if (!results)
            return null;
        if (!results[2])
            return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    };
    VideoInputApp.prototype.tobool = function (value, defaultval) {
        if (value === true || value === "true")
            return true;
        if (value === false || value === "false")
            return false;
        return defaultval;
    };
    VideoInputApp.prototype.Start = function (address, audio, video) {
        var _this = this;
        if (this.mCall != null)
            this.Stop();
        this.mIsRunning = true;
        this.Ui_OnStart();
        console.log("start");
        console.log("Using signaling server url: " + this.mNetConfig.SignalingUrl);
        //create media configuration
        var config = new awrtc.MediaConfig();
        config.Audio = audio;
        config.Video = video;
        config.IdealWidth = 640;
        config.IdealHeight = 480;
        config.IdealFps = 30;
        if (VideoInputApp.sVideoDevice !== null) {
            config.VideoDeviceName = VideoInputApp.sVideoDevice;
        }
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
    VideoInputApp.prototype.Stop = function () {
        this.Cleanup();
    };
    VideoInputApp.prototype.Cleanup = function () {
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
    VideoInputApp.prototype.Update = function () {
        if (this.mCall != null)
            this.mCall.Update();
    };
    VideoInputApp.prototype.OnNetworkEvent = function (sender, args) {
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
    VideoInputApp.prototype.setupUi = function (parent) {
        this.mUiAddress = parent.querySelector(".callapp_address");
        this.mUiAudio = parent.querySelector(".callapp_send_audio");
        this.mUiVideo = parent.querySelector(".callapp_send_video");
        this.mUiUrl = parent.querySelector(".callapp_url");
        this.mUiButton = parent.querySelector(".callapp_button");
        this.mUiLocalVideoParent = parent.querySelector(".callapp_local_video");
        this.mUiRemoteVideoParent = parent.querySelector(".callapp_remote_video");
        this.mUiAudio.onclick = this.Ui_OnUpdate;
        this.mUiVideo.onclick = this.Ui_OnUpdate;
        this.mUiAddress.onkeyup = this.Ui_OnUpdate;
        this.mUiButton.onclick = this.Ui_OnStartStopButtonClicked;
        //set default value + make string "true"/"false" to proper booleans
        this.mAudio = this.GetParameterByName("audio");
        this.mAudio = this.tobool(this.mAudio, true);
        this.mVideo = this.GetParameterByName("video");
        this.mVideo = this.tobool(this.mVideo, true);
        this.mAutostart = this.GetParameterByName("autostart");
        this.mAutostart = this.tobool(this.mAutostart, false);
        this.mAddress = this.GetParameterByName("a");
        //if autostart is set but no address is given -> create one and reopen the page
        if (this.mAddress === null && this.mAutostart == true) {
            this.mAddress = this.GenerateRandomKey();
            window.location.href = this.GetUrlParams();
        }
        else {
            if (this.mAddress === null)
                this.mAddress = this.GenerateRandomKey();
            this.Ui_Update();
        }
        //used for interacting with the Unity CallApp
        //current hack to get the html element delivered. by default this
        //just the image is copied and given as array
        //Lazy frames will be the default soon though
        if (this.mAutostart) {
            console.log("Starting automatically ... ");
            this.Start(this.mAddress, this.mAudio, this.mVideo);
        }
        console.log("address: " + this.mAddress + " audio: " + this.mAudio + " video: " + this.mVideo + " autostart: " + this.mAutostart);
    };
    VideoInputApp.prototype.Ui_OnStart = function () {
        this.mUiButton.textContent = "Stop";
    };
    VideoInputApp.prototype.Ui_OnCleanup = function () {
        this.mUiButton.textContent = "Join";
        while (this.mUiLocalVideoParent.hasChildNodes()) {
            this.mUiLocalVideoParent.removeChild(this.mUiLocalVideoParent.firstChild);
        }
        while (this.mUiRemoteVideoParent.hasChildNodes()) {
            this.mUiRemoteVideoParent.removeChild(this.mUiRemoteVideoParent.firstChild);
        }
    };
    VideoInputApp.prototype.Ui_OnLog = function (msg) {
    };
    VideoInputApp.prototype.Ui_OnError = function (msg) {
    };
    VideoInputApp.prototype.Ui_OnLocalVideo = function (video) {
        this.mUiLocalVideoParent.appendChild(document.createElement("br"));
        this.mUiLocalVideoParent.appendChild(video);
    };
    VideoInputApp.prototype.Ui_OnRemoteVideo = function (video, id) {
        this.mUiRemoteVideoParent.appendChild(document.createElement("br"));
        this.mUiRemoteVideoParent.appendChild(new Text("connection " + id.id));
        this.mUiRemoteVideoParent.appendChild(document.createElement("br"));
        this.mUiRemoteVideoParent.appendChild(video);
    };
    VideoInputApp.prototype.Ui_Update = function () {
        console.log("UpdateUi");
        this.mUiAddress.value = this.mAddress;
        this.mUiAudio.checked = this.mAudio;
        this.mUiVideo.checked = this.mVideo;
        this.mUiUrl.innerHTML = this.GetUrl();
    };
    VideoInputApp.prototype.GenerateRandomKey = function () {
        var result = "";
        for (var i = 0; i < 7; i++) {
            result += String.fromCharCode(65 + Math.round(Math.random() * 25));
        }
        return result;
    };
    VideoInputApp.prototype.GetUrlParams = function () {
        return "?a=" + this.mAddress + "&audio=" + this.mAudio + "&video=" + this.mVideo + "&" + "autostart=" + true;
    };
    VideoInputApp.prototype.GetUrl = function () {
        return location.protocol + '//' + location.host + location.pathname + this.GetUrlParams();
    };
    VideoInputApp.sVideoDevice = null;
    return VideoInputApp;
}());
exports.VideoInputApp = VideoInputApp;
function videoinputapp(parent, canvas) {
    var callApp;
    console.log("init callapp");
    if (parent == null) {
        console.log("parent was null");
        parent = document.body;
    }
    awrtc.SLog.SetLogLevel(awrtc.SLogLevel.Info);
    callApp = new VideoInputApp();
    var media = new awrtc.Media();
    var devname = "canvas";
    awrtc.Media.SharedInstance.VideoInput.AddCanvasDevice(canvas, devname, canvas.width / 2, canvas.height / 2, 30);
    setInterval(function () {
        awrtc.Media.SharedInstance.VideoInput.UpdateFrame(devname);
    }, 50);
    VideoInputApp.sVideoDevice = devname;
    callApp.setupUi(parent);
}
exports.videoinputapp = videoinputapp;

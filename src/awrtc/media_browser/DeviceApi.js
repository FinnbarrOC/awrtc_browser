"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceApi = exports.DeviceInfo = void 0;
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
var DeviceInfo = /** @class */ (function () {
    function DeviceInfo() {
        this.deviceId = null;
        this.defaultLabel = null;
        this.label = null;
        this.isLabelGuessed = true;
    }
    return DeviceInfo;
}());
exports.DeviceInfo = DeviceInfo;
var DeviceApi = /** @class */ (function () {
    function DeviceApi() {
    }
    Object.defineProperty(DeviceApi, "LastUpdate", {
        get: function () {
            return DeviceApi.sLastUpdate;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DeviceApi, "HasInfo", {
        get: function () {
            return DeviceApi.sLastUpdate > 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DeviceApi, "IsPending", {
        get: function () {
            return DeviceApi.sIsPending;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DeviceApi, "LastError", {
        get: function () {
            return this.sLastError;
        },
        enumerable: false,
        configurable: true
    });
    DeviceApi.AddOnChangedHandler = function (evt) {
        DeviceApi.sUpdateEvents.push(evt);
    };
    DeviceApi.RemOnChangedHandler = function (evt) {
        var index = DeviceApi.sUpdateEvents.indexOf(evt);
        if (index >= 0) {
            DeviceApi.sUpdateEvents.splice(index, 1);
        }
        else {
            index_1.SLog.LW("Tried to remove an unknown event handler in DeviceApi.RemOnChangedHandler");
        }
    };
    DeviceApi.TriggerChangedEvent = function () {
        for (var _i = 0, _a = DeviceApi.sUpdateEvents; _i < _a.length; _i++) {
            var v = _a[_i];
            try {
                v();
            }
            catch (e) {
                index_1.SLog.LE("Error in DeviceApi user event handler: " + e);
                console.exception(e);
            }
        }
    };
    Object.defineProperty(DeviceApi, "Devices", {
        get: function () {
            return DeviceApi.sDeviceInfo;
        },
        enumerable: false,
        configurable: true
    });
    DeviceApi.GetVideoDevices = function () {
        var devices = DeviceApi.Devices;
        var keys = Object.keys(devices);
        var labels = keys.map(function (x) { return devices[x].label; });
        return labels;
    };
    DeviceApi.Reset = function () {
        DeviceApi.sUpdateEvents = [];
        DeviceApi.sLastUpdate = 0;
        DeviceApi.sDeviceInfo = {};
        DeviceApi.sVideoDeviceCounter = 1;
        DeviceApi.sAccessStream = null;
        DeviceApi.sLastError = null;
        DeviceApi.sIsPending = false;
    };
    /**Updates the device list based on the current
     * access. Gives the devices numbers if the name isn't known.
     */
    DeviceApi.Update = function () {
        DeviceApi.sLastError = null;
        if (DeviceApi.IsApiAvailable()) {
            DeviceApi.sIsPending = true;
            navigator.mediaDevices.enumerateDevices()
                .then(DeviceApi.InternalOnEnum)
                .catch(DeviceApi.InternalOnErrorCatch);
        }
        else {
            DeviceApi.InternalOnErrorString(DeviceApi.ENUM_FAILED);
        }
    };
    DeviceApi.UpdateAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, fail) {
                        DeviceApi.sLastError = null;
                        if (DeviceApi.IsApiAvailable() == false) {
                            DeviceApi.InternalOnErrorString(DeviceApi.ENUM_FAILED);
                            fail(DeviceApi.ENUM_FAILED);
                        }
                        resolve();
                    }).then(function () {
                        DeviceApi.sIsPending = true;
                        return navigator.mediaDevices.enumerateDevices()
                            .then(DeviceApi.InternalOnEnum)
                            .catch(DeviceApi.InternalOnErrorCatch);
                    })];
            });
        });
    };
    /**Checks if the API is available in the browser.
     * false - browser doesn't support this API
     * true - browser supports the API (might still refuse to give
     * us access later on)
     */
    DeviceApi.IsApiAvailable = function () {
        if (navigator && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)
            return true;
        return false;
    };
    /**Asks the user for access first to get the full
     * device names.
     */
    DeviceApi.RequestUpdate = function () {
        DeviceApi.sLastError = null;
        if (DeviceApi.IsApiAvailable()) {
            DeviceApi.sIsPending = true;
            var constraints = { video: true };
            navigator.mediaDevices.getUserMedia(constraints)
                .then(DeviceApi.InternalOnStream)
                .catch(DeviceApi.InternalOnErrorCatch);
        }
        else {
            DeviceApi.InternalOnErrorString("Can't access mediaDevices or enumerateDevices");
        }
    };
    DeviceApi.GetDeviceId = function (label) {
        var devs = DeviceApi.Devices;
        for (var key in devs) {
            var dev = devs[key];
            if (dev.label == label || dev.defaultLabel == label || dev.deviceId == label) {
                return dev.deviceId;
            }
        }
        return null;
    };
    DeviceApi.IsUserMediaAvailable = function () {
        if (navigator && navigator.mediaDevices)
            return true;
        return false;
    };
    DeviceApi.ToConstraints = function (config) {
        //ugly part starts -> call get user media data (no typescript support)
        //different browsers have different calls...
        //check  getSupportedConstraints()??? 
        //see https://w3c.github.io/mediacapture-main/getusermedia.html#constrainable-interface
        //set default ideal to very common low 320x240 to avoid overloading weak computers
        var constraints = {
            audio: config.Audio
        };
        var width = {};
        var height = {};
        var video = {};
        var fps = {};
        if (config.MinWidth != -1)
            width.min = config.MinWidth;
        if (config.MaxWidth != -1)
            width.max = config.MaxWidth;
        if (config.IdealWidth != -1)
            width.ideal = config.IdealWidth;
        if (config.MinHeight != -1)
            height.min = config.MinHeight;
        if (config.MaxHeight != -1)
            height.max = config.MaxHeight;
        if (config.IdealHeight != -1)
            height.ideal = config.IdealHeight;
        if (config.MinFps != -1)
            fps.min = config.MinFps;
        if (config.MaxFps != -1)
            fps.max = config.MaxFps;
        if (config.IdealFps != -1)
            fps.ideal = config.IdealFps;
        //user requested specific device? get it now to properly add it to the
        //constraints later
        var deviceId = null;
        if (config.Video && config.VideoDeviceName && config.VideoDeviceName !== "") {
            deviceId = DeviceApi.GetDeviceId(config.VideoDeviceName);
            index_1.SLog.L("using device " + config.VideoDeviceName);
            if (deviceId === "") {
                //Workaround for Chrome 81: If no camera access is allowed chrome returns the deviceId ""
                //thus we can only request any video device. We can't select a specific one
                deviceId = null;
            }
            else if (deviceId !== null) {
                //all good
            }
            else {
                index_1.SLog.LE("Failed to find deviceId for label " + config.VideoDeviceName);
                throw new Error("Unknown device " + config.VideoDeviceName);
            }
        }
        //watch out: unity changed behaviour and will now
        //give 0 / 1 instead of false/true
        //using === won't work
        if (config.Video == false) {
            //video is off
            video = false;
        }
        else {
            if (Object.keys(width).length > 0) {
                video.width = width;
            }
            if (Object.keys(height).length > 0) {
                video.height = height;
            }
            if (Object.keys(fps).length > 0) {
                video.frameRate = fps;
            }
            if (deviceId !== null) {
                video.deviceId = { "exact": deviceId };
            }
            //if we didn't add anything we need to set it to true
            //at least (I assume?)
            if (Object.keys(video).length == 0) {
                video = true;
            }
        }
        constraints.video = video;
        return constraints;
    };
    DeviceApi.getBrowserUserMedia = function (constraints) {
        return navigator.mediaDevices.getUserMedia(constraints);
    };
    DeviceApi.getAssetUserMedia = function (config) {
        return new Promise(function (resolve) {
            var res = DeviceApi.ToConstraints(config);
            resolve(res);
        }).then(function (constraints) {
            return DeviceApi.getBrowserUserMedia(constraints);
        });
    };
    DeviceApi.sLastUpdate = 0;
    DeviceApi.sIsPending = false;
    DeviceApi.sLastError = null;
    DeviceApi.sDeviceInfo = {};
    DeviceApi.sVideoDeviceCounter = 1;
    DeviceApi.sAccessStream = null;
    DeviceApi.sUpdateEvents = [];
    DeviceApi.InternalOnEnum = function (devices) {
        DeviceApi.sIsPending = false;
        DeviceApi.sLastUpdate = new Date().getTime();
        var newDeviceInfo = {};
        for (var _i = 0, devices_1 = devices; _i < devices_1.length; _i++) {
            var info = devices_1[_i];
            if (info.kind != "videoinput")
                continue;
            var newInfo = new DeviceInfo();
            newInfo.deviceId = info.deviceId;
            var knownInfo = null;
            if (newInfo.deviceId in DeviceApi.Devices) {
                //known device. reuse the default label
                knownInfo = DeviceApi.Devices[newInfo.deviceId];
            }
            //check if we gave this device a default label already
            //this is used to identify it via a user readable name in case
            //we update multiple times with proper labels / default labels
            if (knownInfo != null) {
                newInfo.defaultLabel = knownInfo.defaultLabel;
            }
            else {
                newInfo.defaultLabel = info.kind + " " + DeviceApi.sVideoDeviceCounter;
                ;
                DeviceApi.sVideoDeviceCounter++;
            }
            //check if we know a proper label or got one this update
            if (knownInfo != null && knownInfo.isLabelGuessed == false) {
                //already have one
                newInfo.label = knownInfo.label;
                newInfo.isLabelGuessed = false;
            }
            else if (info.label) {
                //got a new one
                newInfo.label = info.label;
                newInfo.isLabelGuessed = false;
            }
            else {
                //no known label -> just use the default one
                newInfo.label = newInfo.defaultLabel;
                newInfo.isLabelGuessed = true;
            }
            newDeviceInfo[newInfo.deviceId] = newInfo;
        }
        DeviceApi.sDeviceInfo = newDeviceInfo;
        if (DeviceApi.sAccessStream) {
            var tracks = DeviceApi.sAccessStream.getTracks();
            for (var i = 0; i < tracks.length; i++) {
                tracks[i].stop();
            }
            DeviceApi.sAccessStream = null;
        }
        DeviceApi.TriggerChangedEvent();
    };
    DeviceApi.InternalOnErrorCatch = function (err) {
        var txt = err.toString();
        DeviceApi.InternalOnErrorString(txt);
    };
    DeviceApi.InternalOnErrorString = function (err) {
        DeviceApi.sIsPending = false;
        DeviceApi.sLastError = err;
        index_1.SLog.LE(err);
        DeviceApi.TriggerChangedEvent();
    };
    DeviceApi.InternalOnStream = function (stream) {
        DeviceApi.sAccessStream = stream;
        DeviceApi.Update();
    };
    DeviceApi.ENUM_FAILED = "Can't access mediaDevices or enumerateDevices";
    return DeviceApi;
}());
exports.DeviceApi = DeviceApi;

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
//current setup needs to load everything as a module
import { DeviceApi, CAPI_DeviceApi_Update, CAPI_Media_GetVideoDevices_Length, CAPI_Media_GetVideoDevices, MediaConfig } from "../awrtc/index";
export function DeviceApiTest_export() {
}
describe("DeviceApiTest", function () {
    beforeEach(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        DeviceApi.Reset();
    });
    function printall() {
        console.log("current DeviceApi.Devices:");
        for (var k in DeviceApi.Devices) {
            var v = DeviceApi.Devices[k];
            console.log(v.deviceId + " defaultLabel:" + v.defaultLabel + " label:" + v.label + " guessed:" + v.isLabelGuessed);
        }
    }
    it("update", function (done) {
        var update1complete = false;
        var update2complete = false;
        var deviceCount = 0;
        expect(Object.keys(DeviceApi.Devices).length).toBe(0);
        //first without device labels
        var updatecall1 = function () {
            expect(update1complete).toBe(false);
            expect(update2complete).toBe(false);
            console.debug("updatecall1");
            printall();
            var devices1 = DeviceApi.Devices;
            deviceCount = Object.keys(devices1).length;
            expect(deviceCount).toBeGreaterThan(0);
            var key1 = Object.keys(devices1)[0];
            //these tests don't work anymore due to forcing permissions for devices in
            //unit tests. 
            //In a real browser we don't have access to device names until GetUserMedia
            //returned. Meaning the API will fill in the names using "videoinput 1"
            //"videoinput 2" and so on. 
            //Now the tests force permissions = true so we already have full
            //access at the start
            /*
            expect(devices1[key1].label).toBe("videoinput 1");
            expect(devices1[key1].isLabelGuessed).toBe(true);
            if(deviceCount > 1)
            {
                let key2 = Object.keys(devices1)[1];
                expect(devices1[key2].label).toBe("videoinput 2");
                expect(devices1[key2].isLabelGuessed).toBe(true);
            }
            */
            DeviceApi.RemOnChangedHandler(updatecall1);
            //second call with device labels
            var updatecall2 = function () {
                console.debug("updatecall2");
                printall();
                //check if the handler work properly
                expect(update1complete).toBe(true);
                expect(update2complete).toBe(false);
                //sadly can't simulate fixed device names for testing
                var devices2 = DeviceApi.Devices;
                expect(Object.keys(devices2).length).toBe(deviceCount);
                var key2 = Object.keys(devices2)[0];
                //should have original label now
                expect(devices2[key1].label).not.toBe("videodevice 1");
                //and not be guessed anymore
                expect(devices2[key1].isLabelGuessed).toBe(false, "Chrome fails this now. Likely due to file://. Check for better test setup");
                update2complete = true;
                DeviceApi.Reset();
                expect(Object.keys(DeviceApi.Devices).length).toBe(0);
                done();
            };
            update1complete = true;
            DeviceApi.AddOnChangedHandler(updatecall2);
            DeviceApi.RequestUpdate();
        };
        DeviceApi.AddOnChangedHandler(updatecall1);
        DeviceApi.Update();
    });
    it("capi_update", function (done) {
        var update1complete = false;
        var update2complete = false;
        var deviceCount = 0;
        var devices_length_unitialized = CAPI_Media_GetVideoDevices_Length();
        expect(devices_length_unitialized).toBe(0);
        DeviceApi.AddOnChangedHandler(function () {
            var dev_length = CAPI_Media_GetVideoDevices_Length();
            expect(dev_length).not.toBe(0);
            expect(dev_length).toBe(Object.keys(DeviceApi.Devices).length);
            var keys = Object.keys(DeviceApi.Devices);
            var counter = 0;
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var k = keys_1[_i];
                var expectedVal = DeviceApi.Devices[k].label;
                var actual = CAPI_Media_GetVideoDevices(counter);
                expect(actual).toBe(expectedVal);
                counter++;
            }
            done();
        });
        CAPI_DeviceApi_Update();
    });
    it("isMediaAvailable", function () {
        var res = DeviceApi.IsUserMediaAvailable();
        expect(res).toBe(true);
    });
    it("getUserMedia", function () { return __awaiter(void 0, void 0, void 0, function () {
        var stream;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, DeviceApi.getBrowserUserMedia({ audio: true })];
                case 1:
                    stream = _a.sent();
                    expect(stream).not.toBeNull();
                    expect(stream.getVideoTracks().length).toBe(0);
                    expect(stream.getAudioTracks().length).toBe(1);
                    return [4 /*yield*/, DeviceApi.getBrowserUserMedia({ video: true })];
                case 2:
                    stream = _a.sent();
                    expect(stream).not.toBeNull();
                    expect(stream.getAudioTracks().length).toBe(0);
                    expect(stream.getVideoTracks().length).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
    it("getAssetMedia", function () { return __awaiter(void 0, void 0, void 0, function () {
        var config, stream;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    config = new MediaConfig();
                    config.Audio = true;
                    config.Video = false;
                    return [4 /*yield*/, DeviceApi.getAssetUserMedia(config)];
                case 1:
                    stream = _a.sent();
                    expect(stream).not.toBeNull();
                    expect(stream.getVideoTracks().length).toBe(0);
                    expect(stream.getAudioTracks().length).toBe(1);
                    config = new MediaConfig();
                    config.Audio = false;
                    config.Video = true;
                    return [4 /*yield*/, DeviceApi.getAssetUserMedia(config)];
                case 2:
                    stream = _a.sent();
                    expect(stream).not.toBeNull();
                    expect(stream.getAudioTracks().length).toBe(0);
                    expect(stream.getVideoTracks().length).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
    it("getAssetMedia_invalid", function () { return __awaiter(void 0, void 0, void 0, function () {
        var config, error, stream, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    config = new MediaConfig();
                    config.Audio = false;
                    config.Video = true;
                    config.VideoDeviceName = "invalid name";
                    error = null;
                    stream = null;
                    console.log("Expecting error message: Failed to find deviceId for label invalid name");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, DeviceApi.getAssetUserMedia(config)];
                case 2:
                    stream = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    error = err_1;
                    return [3 /*break*/, 4];
                case 4:
                    expect(stream).toBeNull();
                    expect(error).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    //check for a specific bug causing promise catch not to trigger correctly
    //due to error in ToConstraints
    it("getAssetMedia_invalid_promise", function (done) {
        var config = new MediaConfig();
        config.Audio = false;
        config.Video = true;
        config.VideoDeviceName = "invalid name";
        var result = null;
        result = DeviceApi.getAssetUserMedia(config);
        result.then(function () {
            fail("getAssetUserMedia returned but was expected to fail");
        }).catch(function (error) {
            expect(error).toBeTruthy();
            done();
        });
    });
    it("UpdateAsync", function (done) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expect(DeviceApi.GetVideoDevices().length).toBe(0);
                    return [4 /*yield*/, DeviceApi.UpdateAsync()];
                case 1:
                    _a.sent();
                    expect(DeviceApi.GetVideoDevices().length).toBeGreaterThan(0);
                    expect(DeviceApi.GetVideoDevices().length).toBe(CAPI_Media_GetVideoDevices_Length());
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    /*
    it("Devices", async () => {

        DeviceApi.RequestUpdate

        let config = new MediaConfig();
        config.Audio = false;
        config.Video = true;
        config.VideoDeviceName = "invalid name"
        let error = null;
        let stream :MediaStream = null;
        console.log("Expecting error message: Failed to find deviceId for label invalid name");
        try
        {
            stream = await DeviceApi.getAssetUserMedia(config);
        }catch(err){
            error = err;
        }
        expect(stream).toBeNull();
        expect(error).toBeTruthy();
    });
*/
});
//# sourceMappingURL=DeviceApiTest.js.map
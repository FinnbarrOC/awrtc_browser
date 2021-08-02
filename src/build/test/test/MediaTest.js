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
import { Media, DeviceApi, MediaConfig, CAPI_Media_GetVideoDevices_Length, CAPI_Media_GetVideoDevices, BrowserMediaStream } from "../awrtc/index";
import { MakeTestCanvas } from "VideoInputTest";
export function MediaTest_export() {
}
describe("MediaTest", function () {
    beforeEach(function (done) {
        var handler = function () {
            DeviceApi.RemOnChangedHandler(handler);
            done();
        };
        DeviceApi.AddOnChangedHandler(handler);
        DeviceApi.Update();
        Media.ResetSharedInstance();
    });
    it("SharedInstance", function () {
        expect(Media.SharedInstance).toBeTruthy();
        var instance1 = Media.SharedInstance;
        Media.ResetSharedInstance();
        expect(Media.SharedInstance).not.toBe(instance1);
    });
    it("GetVideoDevices", function () {
        var media = new Media();
        var devs = media.GetVideoDevices();
        expect(devs).toBeTruthy();
        expect(devs.length).toBeGreaterThan(0);
    });
    it("GetUserMedia", function () { return __awaiter(void 0, void 0, void 0, function () {
        var media, config, stream, err, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    media = new Media();
                    config = new MediaConfig();
                    config.Audio = false;
                    return [4 /*yield*/, media.getUserMedia(config)];
                case 1:
                    stream = _a.sent();
                    expect(stream).not.toBeNull();
                    expect(stream.getAudioTracks().length).toBe(0);
                    expect(stream.getVideoTracks().length).toBe(1);
                    stream = null;
                    err = null;
                    config.VideoDeviceName = "invalid name";
                    console.log("Expecting error message: Failed to find deviceId for label invalid name");
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, media.getUserMedia(config)];
                case 3:
                    stream = _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    err = error_1;
                    return [3 /*break*/, 5];
                case 5:
                    expect(err).not.toBeNull();
                    expect(stream).toBeNull();
                    return [2 /*return*/];
            }
        });
    }); });
    it("GetUserMedia_videoinput", function (done) { return __awaiter(void 0, void 0, void 0, function () {
        var name, media, config, canvas, streamCamera, streamCanvas, streamCanvas2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    name = "test_canvas";
                    media = new Media();
                    config = new MediaConfig();
                    config.Audio = false;
                    config.Video = true;
                    canvas = MakeTestCanvas();
                    media.VideoInput.AddCanvasDevice(canvas, name, canvas.width, canvas.height, 30);
                    return [4 /*yield*/, media.getUserMedia(config)];
                case 1:
                    streamCamera = _a.sent();
                    expect(streamCamera).not.toBeNull();
                    expect(streamCamera.getAudioTracks().length).toBe(0);
                    expect(streamCamera.getVideoTracks().length).toBe(1);
                    config.VideoDeviceName = name;
                    return [4 /*yield*/, media.getUserMedia(config)];
                case 2:
                    streamCanvas = _a.sent();
                    expect(streamCanvas).not.toBeNull();
                    expect(streamCanvas.getAudioTracks().length).toBe(0);
                    expect(streamCanvas.getVideoTracks().length).toBe(1);
                    return [4 /*yield*/, media.getUserMedia(config)];
                case 3:
                    streamCanvas2 = _a.sent();
                    expect(streamCanvas2).not.toBeNull();
                    expect(streamCanvas2.getAudioTracks().length).toBe(0);
                    expect(streamCanvas2.getVideoTracks().length).toBe(1);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it("GetUserMedia_videoinput_and_audio", function () { return __awaiter(void 0, void 0, void 0, function () {
        var name, media, config, canvas, stream, err_1, error_result, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    name = "test_canvas";
                    media = new Media();
                    config = new MediaConfig();
                    config.Audio = true;
                    config.Video = true;
                    canvas = MakeTestCanvas();
                    media.VideoInput.AddCanvasDevice(canvas, name, canvas.width, canvas.height, 30);
                    config.VideoDeviceName = name;
                    stream = null;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, media.getUserMedia(config)];
                case 2:
                    stream = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error(err_1);
                    fail(err_1);
                    return [3 /*break*/, 4];
                case 4:
                    expect(stream).not.toBeNull();
                    expect(stream.getAudioTracks().length).toBe(1);
                    expect(stream.getVideoTracks().length).toBe(1);
                    config.VideoDeviceName = "invalid name";
                    stream = null;
                    error_result = null;
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, media.getUserMedia(config)];
                case 6:
                    stream = _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    err_2 = _a.sent();
                    error_result = err_2;
                    return [3 /*break*/, 8];
                case 8:
                    expect(error_result).not.toBeNull();
                    expect(stream).toBeNull();
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    //CAPI needs to be changed to use Media only instead the device API
    it("MediaCapiVideoInput", function (done) { return __awaiter(void 0, void 0, void 0, function () {
        var name, canvas;
        return __generator(this, function (_a) {
            //empty normal device api
            DeviceApi.Reset();
            expect(CAPI_Media_GetVideoDevices_Length()).toBe(0);
            name = "test_canvas";
            canvas = MakeTestCanvas();
            Media.SharedInstance.VideoInput.AddCanvasDevice(canvas, name, canvas.width, canvas.height, 30);
            expect(CAPI_Media_GetVideoDevices_Length()).toBe(1);
            expect(CAPI_Media_GetVideoDevices(0)).toBe(name);
            done();
            return [2 /*return*/];
        });
    }); });
});
describe("MediaStreamTest", function () {
    beforeEach(function (done) {
        var handler = function () {
            DeviceApi.RemOnChangedHandler(handler);
            done();
        };
        DeviceApi.AddOnChangedHandler(handler);
        DeviceApi.Update();
        Media.ResetSharedInstance();
    });
    var TestStreamContainer = /** @class */ (function () {
        function TestStreamContainer() {
            var canvas = document.createElement("canvas");
            canvas.width = 4;
            canvas.height = 4;
            var ctx = canvas.getContext("2d");
            //make blue for debugging purposes
            ctx.fillStyle = "blue";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            this.canvas = canvas;
            this.stream = canvas.captureStream();
        }
        TestStreamContainer.prototype.MakeFrame = function (color) {
            var ctx = this.canvas.getContext("2d");
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            //make blue for debugging purposes
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        };
        return TestStreamContainer;
    }());
    function MakeTestStreamContainer() {
        return new TestStreamContainer();
    }
    //TODO: need proper way to wait and check with async/ await
    function sleep(ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    }
    function WaitFor() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    }
    it("buffer_and_trygetframe", function (done) { return __awaiter(void 0, void 0, void 0, function () {
        var testcontainer, stream, frame, buffer, r, g, b, a;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    testcontainer = MakeTestStreamContainer();
                    stream = new BrowserMediaStream(testcontainer.stream);
                    frame = stream.TryGetFrame();
                    expect(frame).toBeNull();
                    return [4 /*yield*/, sleep(100)];
                case 1:
                    _a.sent();
                    stream.Update();
                    //waited for the internals to get initialized. We should have a frame now
                    frame = stream.TryGetFrame();
                    expect(frame).not.toBeNull();
                    ;
                    buffer = frame.Buffer;
                    expect(buffer).not.toBeNull();
                    ;
                    r = buffer[0];
                    g = buffer[1];
                    b = buffer[2];
                    a = buffer[3];
                    expect(r).toBe(0);
                    expect(g).toBe(0);
                    expect(b).toBe(255);
                    expect(a).toBe(255);
                    //we removed the frame now. this should be null
                    frame = stream.TryGetFrame();
                    expect(frame).toBeNull();
                    //make a new frame with different color
                    testcontainer.MakeFrame("#FFFF00");
                    return [4 /*yield*/, sleep(100)];
                case 2:
                    _a.sent();
                    stream.Update();
                    //get new frame
                    frame = stream.TryGetFrame();
                    expect(frame).not.toBeNull();
                    ;
                    buffer = frame.Buffer;
                    expect(buffer).not.toBeNull();
                    ;
                    //should be different color now
                    r = buffer[0];
                    g = buffer[1];
                    b = buffer[2];
                    a = buffer[3];
                    expect(r).toBe(255);
                    expect(g).toBe(255);
                    expect(b).toBe(0);
                    expect(a).toBe(255);
                    //done
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    function createTexture(gl) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Because images have to be download over the internet
        // they might take a moment until they are ready.
        // Until then put a single pixel in the texture so we can
        // use it immediately. When the image has finished downloading
        // we'll update the texture with the contents of the image.
        var level = 0;
        var internalFormat = gl.RGBA;
        var width = 1;
        var height = 1;
        var border = 0;
        var srcFormat = gl.RGBA;
        var srcType = gl.UNSIGNED_BYTE;
        var pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);
        return texture;
    }
    it("texture", function (done) { return __awaiter(void 0, void 0, void 0, function () {
        var testcontainer, stream, frame, canvas, gl, texture, res, dst_buffer, fb, r, g, b, a;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    testcontainer = MakeTestStreamContainer();
                    stream = new BrowserMediaStream(testcontainer.stream);
                    //document.body.appendChild(testcontainer.canvas);
                    //waited for the internals to get initialized. We should have a frame now
                    return [4 /*yield*/, sleep(100)];
                case 1:
                    //document.body.appendChild(testcontainer.canvas);
                    //waited for the internals to get initialized. We should have a frame now
                    _a.sent();
                    stream.Update();
                    frame = stream.PeekFrame();
                    expect(frame).not.toBeNull();
                    canvas = document.createElement("canvas");
                    canvas.width = testcontainer.canvas.width;
                    canvas.height = testcontainer.canvas.height;
                    gl = canvas.getContext("webgl2");
                    //testing only. draw this one red
                    gl.clearColor(1, 0, 0, 1);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    texture = createTexture(gl);
                    res = frame.ToTexture(gl, texture);
                    expect(res).toBe(true);
                    dst_buffer = new Uint8Array(testcontainer.canvas.width * testcontainer.canvas.height * 4);
                    fb = gl.createFramebuffer();
                    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
                    gl.readPixels(0, 0, testcontainer.canvas.width, testcontainer.canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, dst_buffer);
                    r = dst_buffer[0];
                    g = dst_buffer[1];
                    b = dst_buffer[2];
                    a = dst_buffer[3];
                    expect(r).toBe(0);
                    expect(g).toBe(0);
                    expect(b).toBe(255);
                    expect(a).toBe(255);
                    //TODO: could compare whole src / dst buffer to check if something is cut off
                    //const compare_buffer = frame.Buffer;
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=MediaTest.js.map
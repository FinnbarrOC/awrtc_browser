import { VideoInput, VideoInputType } from "../awrtc/index";
export function VideoInputTest_export() {
}
export function MakeTestCanvas(w, h) {
    if (w == null)
        w = 4;
    if (h == null)
        h = 4;
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext("2d");
    //make blue for debugging purposes
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
}
export function MakeBrokenTestCanvas() {
    var canvas = document.createElement("canvas");
    return canvas;
}
/**Create test image with pattern
 * Black White
 * White Black
 *
 * So each corner can be tested for correct results.
 *
 * @param src_width
 * @param src_height
 */
export function MakeTestImage(src_width, src_height) {
    var src_size = src_width * src_height * 4;
    var src_data = new Uint8ClampedArray(src_size);
    for (var y = 0; y < src_height; y++) {
        for (var x = 0; x < src_width; x++) {
            var pos = y * src_width + x;
            var xp = x >= src_width / 2;
            var yp = y >= src_height / 2;
            var val = 0;
            if (xp || yp)
                val = 255;
            if (xp && yp)
                val = 0;
            src_data[pos * 4 + 0] = val;
            src_data[pos * 4 + 1] = val;
            src_data[pos * 4 + 2] = val;
            src_data[pos * 4 + 3] = 255;
        }
    }
    var src_img = new ImageData(src_data, src_width, src_height);
    return src_img;
}
export function ExtractData(video) {
    var canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    var dst_context = canvas.getContext('2d');
    dst_context.drawImage(video, 0, 0, canvas.width, canvas.height);
    var dst_img = dst_context.getImageData(0, 0, canvas.width, canvas.height);
    return dst_img;
}
describe("VideoInputTest", function () {
    beforeEach(function () {
    });
    it("AddRem", function () {
        var name = "test_canvas";
        var vi = new VideoInput();
        var canvas = document.createElement("canvas");
        expect(vi.HasDevice(name)).toBe(false);
        vi.AddCanvasDevice(canvas, name, canvas.width, canvas.height, 30);
        expect(vi.HasDevice(name)).toBe(true);
        vi.RemoveDevice(name);
        expect(vi.HasDevice(name)).toBe(false);
    });
    it("GetDeviceNames", function () {
        var name = "test_canvas";
        var name2 = "test_canvas2";
        var vi = new VideoInput();
        var canvas = document.createElement("canvas");
        var names = vi.GetDeviceNames();
        expect(names).toBeTruthy();
        expect(names.length).toBe(0);
        vi.AddCanvasDevice(canvas, name, canvas.width, canvas.height, 30);
        names = vi.GetDeviceNames();
        expect(names).toBeTruthy();
        expect(names.length).toBe(1);
        expect(names[0]).toBe(name);
        vi.AddCanvasDevice(canvas, name, canvas.width, canvas.height, 30);
        names = vi.GetDeviceNames();
        expect(names).toBeTruthy();
        expect(names.length).toBe(1);
        expect(names[0]).toBe(name);
        vi.AddCanvasDevice(canvas, name2, canvas.width, canvas.height, 30);
        names = vi.GetDeviceNames();
        expect(names).toBeTruthy();
        expect(names.length).toBe(2);
        expect(names.sort()).toEqual([name, name2].sort());
    });
    it("GetStream", function () {
        var name = "test_canvas";
        var vi = new VideoInput();
        var canvas = MakeTestCanvas();
        var stream = vi.GetStream(name);
        expect(stream).toBeNull();
        vi.AddCanvasDevice(canvas, name, canvas.width, canvas.height, 30);
        stream = vi.GetStream(name);
        expect(stream).toBeTruthy();
    });
    it("AddCanvasDevice_no_scaling", function (done) {
        var name = "test_canvas";
        var vi = new VideoInput();
        var src_width = 40;
        var src_height = 30;
        var canvas = MakeTestCanvas(src_width, src_height);
        vi.AddCanvasDevice(canvas, name, canvas.width, canvas.height, 30);
        var stream = vi.GetStream(name);
        expect(stream).toBeTruthy();
        var videoOutput = document.createElement("video");
        videoOutput.onloadedmetadata = function () {
            expect(videoOutput.videoWidth).toBe(src_width);
            expect(videoOutput.videoHeight).toBe(src_height);
            done();
        };
        videoOutput.srcObject = stream;
    }, 1000);
    it("AddCanvasDevice_scaling", function (done) {
        var debug = false;
        var name = "test_canvas";
        var vi = new VideoInput();
        var src_width = 64;
        var src_height = 64;
        var dst_width = 32;
        var dst_height = 32;
        var canvas = MakeTestCanvas(src_width, src_height);
        var srcContext = canvas.getContext("2d");
        var src_img = MakeTestImage(src_width, src_height);
        srcContext.putImageData(src_img, 0, 0);
        if (debug)
            document.body.appendChild(canvas);
        vi.AddCanvasDevice(canvas, name, dst_width, dst_height, 30);
        var stream = vi.GetStream(name);
        expect(stream).toBeTruthy();
        var videoOutput = document.createElement("video");
        if (debug)
            document.body.appendChild(videoOutput);
        videoOutput.onloadedmetadata = function () {
            expect(videoOutput.videoWidth).toBe(dst_width);
            expect(videoOutput.videoHeight).toBe(dst_height);
            var dst_img_data = ExtractData(videoOutput);
            //upper left
            expect(dst_img_data.data[0]).toBe(0);
            //upper right
            expect(dst_img_data.data[((dst_width - 1) * 4)]).toBe(255);
            //lower left
            expect(dst_img_data.data[((dst_height - 1) * dst_width) * 4]).toBe(255);
            //lower right
            expect(dst_img_data.data[(dst_height * dst_width - 1) * 4]).toBe(0);
            vi.RemoveDevice(name);
            done();
        };
        videoOutput.srcObject = stream;
    }, 1000);
    //not yet clear how this can be handled
    //this test will trigger an error in firefox
    xit("GetStream_no_context", function () {
        var name = "test_canvas";
        var vi = new VideoInput();
        var canvas = MakeBrokenTestCanvas();
        //if we try to record from a canvas before
        //a context was accessed it will fail. 
        //uncommenting this line fixes the bug
        //but this is out of our control / within user code
        //let ctx = canvas.getContext("2d");
        var stream = vi.GetStream(name);
        expect(stream).toBeNull();
        vi.AddCanvasDevice(canvas, name, canvas.width, canvas.height, 30);
        stream = vi.GetStream(name);
        expect(stream).toBeTruthy();
    });
    //not yet clear how this can be handled
    //this test will trigger an error in firefox
    it("AddRemDevice", function () {
        var name = "test_canvas";
        var w = 640;
        var h = 480;
        var fps = 30;
        var vi = new VideoInput();
        var stream = vi.GetStream(name);
        expect(stream).toBeNull();
        vi.AddDevice(name, w, h, fps);
        var res = vi.GetDeviceNames().indexOf(name);
        expect(res).toBe(0);
        vi.RemoveDevice(name);
        var res2 = vi.GetDeviceNames().indexOf(name);
        expect(res2).toBe(-1);
    });
    it("Device_int_array", function () {
        var name = "test_canvas";
        var w = 2;
        var h = 2;
        var fps = 30;
        var arr = new Uint8ClampedArray([
            1, 2, 3, 255,
            4, 5, 6, 255,
            7, 8, 9, 255,
            10, 11, 12, 255,
            13, 14, 15, 255
        ]);
        var vi = new VideoInput();
        vi.AddDevice(name, w, h, fps);
        var stream = vi.GetStream(name);
        expect(stream).toBeTruthy();
        var clamped = new Uint8ClampedArray(arr.buffer, 4, 4 * 4);
        var res = vi.UpdateFrame(name, clamped, w, h, VideoInputType.ARGB, 0, false);
        expect(res).toBe(true);
        var result_canvas = vi.canvasDevices[name].canvas;
        expect(result_canvas.width).toBe(w);
        expect(result_canvas.height).toBe(h);
        var result_img = result_canvas.getContext("2d").getImageData(0, 0, result_canvas.width, result_canvas.height);
        var result_arr = new Uint8Array(result_img.data.buffer);
        var base_arr = new Uint8Array(arr.buffer, 4, 4 * 4);
        expect(base_arr).toEqual(result_arr);
    });
    it("Device_full", function () {
        var src_canvas = MakeTestCanvas();
        var src_ctx = src_canvas.getContext("2d");
        src_ctx.fillStyle = "yellow";
        src_ctx.fillRect(0, 0, src_canvas.width, src_canvas.height);
        var name = "test_canvas";
        var w = 2;
        var h = 2;
        var fps = 30;
        src_canvas.width = w;
        src_canvas.height = h;
        var vi = new VideoInput();
        var src_img = src_ctx.getImageData(0, 0, src_canvas.width, src_canvas.height);
        vi.AddDevice(name, w, h, fps);
        var stream = vi.GetStream(name);
        expect(stream).toBeTruthy();
        var res = vi.UpdateFrame(name, src_img.data, src_img.width, src_img.height, VideoInputType.ARGB, 0, false);
        expect(res).toBe(true);
        //test if the internal array was set correctly
        var result_canvas = vi.canvasDevices[name].canvas;
        expect(result_canvas.width).toBe(src_canvas.width);
        expect(result_canvas.height).toBe(src_canvas.height);
        var result_img = result_canvas.getContext("2d").getImageData(0, 0, result_canvas.width, result_canvas.height);
        expect(result_img.width).toBe(src_img.width);
        expect(result_img.height).toBe(src_img.height);
        expect(result_img.data).toEqual(src_img.data);
    });
});
//# sourceMappingURL=VideoInputTest.js.map
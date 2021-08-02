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
exports.LazyFrame = exports.RawFrame = exports.IFrameData = exports.FramePixelFormat = void 0;
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
var Helper_1 = require("../network/Helper");
var FramePixelFormat;
(function (FramePixelFormat) {
    FramePixelFormat[FramePixelFormat["Invalid"] = 0] = "Invalid";
    FramePixelFormat[FramePixelFormat["Format32bppargb"] = 1] = "Format32bppargb";
})(FramePixelFormat = exports.FramePixelFormat || (exports.FramePixelFormat = {}));
//replace with interface after typescript 2.0 update (properties in interfaces aren't supported yet)
var IFrameData = /** @class */ (function () {
    function IFrameData() {
    }
    Object.defineProperty(IFrameData.prototype, "Format", {
        get: function () {
            return FramePixelFormat.Format32bppargb;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(IFrameData.prototype, "Buffer", {
        get: function () {
            return null;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(IFrameData.prototype, "Width", {
        get: function () {
            return -1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(IFrameData.prototype, "Height", {
        get: function () {
            return -1;
        },
        enumerable: false,
        configurable: true
    });
    IFrameData.prototype.ToTexture = function (gl, texture) {
        return false;
    };
    return IFrameData;
}());
exports.IFrameData = IFrameData;
//Container for the raw bytes of the current frame + height and width.
//Format is currently fixed based on the browser getImageData format
var RawFrame = /** @class */ (function (_super) {
    __extends(RawFrame, _super);
    function RawFrame(buffer, width, height) {
        var _this = _super.call(this) || this;
        _this.mBuffer = null;
        _this.mBuffer = buffer;
        _this.mWidth = width;
        _this.mHeight = height;
        return _this;
    }
    Object.defineProperty(RawFrame.prototype, "Buffer", {
        get: function () {
            return this.mBuffer;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RawFrame.prototype, "Width", {
        get: function () {
            return this.mWidth;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RawFrame.prototype, "Height", {
        get: function () {
            return this.mHeight;
        },
        enumerable: false,
        configurable: true
    });
    return RawFrame;
}(IFrameData));
exports.RawFrame = RawFrame;
/**
 * This class is suppose to increase the speed of the java script implementation.
 * Instead of creating RawFrames every Update call (because the real fps are unknown currently) it will
 * only create a lazy frame which will delay the creation of the RawFrame until the user actually tries
 * to access any data.
 * Thus if the game slows down or the user doesn't access any data the expensive copy is avoided.
 *
 * This comes with the downside of risking a change in Width / Height at the moment. In theory the video could
 * change the resolution causing the values of Width / Height to change over time before Buffer is accessed to create
 * a copy that will be save to use. This should be ok as long as the frame is used at the time it is received.
 */
var LazyFrame = /** @class */ (function (_super) {
    __extends(LazyFrame, _super);
    function LazyFrame(frameGenerator) {
        var _this = _super.call(this) || this;
        _this.mFrameGenerator = frameGenerator;
        return _this;
    }
    Object.defineProperty(LazyFrame.prototype, "FrameGenerator", {
        get: function () {
            return this.mFrameGenerator;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LazyFrame.prototype, "Buffer", {
        get: function () {
            this.GenerateFrame();
            if (this.mRawFrame == null)
                return null;
            return this.mRawFrame.Buffer;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LazyFrame.prototype, "Width", {
        /**Returns the expected width of the frame.
         * Watch out this might change inbetween frames!
         *
         */
        get: function () {
            if (this.mRawFrame == null) {
                return this.mFrameGenerator.VideoElement.videoWidth;
            }
            else {
                return this.mRawFrame.Width;
            }
            /*
            this.GenerateFrame();
            if (this.mRawFrame == null)
                return -1;
            return this.mRawFrame.Width;
            */
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LazyFrame.prototype, "Height", {
        /**Returns the expected height of the frame.
         * Watch out this might change inbetween frames!
         *
         */
        get: function () {
            if (this.mRawFrame == null) {
                return this.mFrameGenerator.VideoElement.videoHeight;
            }
            else {
                return this.mRawFrame.Height;
            }
            /*
            this.GenerateFrame();
            if (this.mRawFrame == null)
                return -1;
            return this.mRawFrame.Height;
            */
        },
        enumerable: false,
        configurable: true
    });
    /**Intendet for use via the Unity plugin.
     * Will copy the image directly into a texture to avoid overhead of a CPU side copy.
     *
     * The given texture should have the correct size before calling this method.
     *
     * @param gl
     * @param texture
     */
    LazyFrame.prototype.ToTexture = function (gl, texture) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        /*
        const level = 0;
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, this.mFrameGenerator.VideoElement);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        */
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGB, gl.UNSIGNED_BYTE, this.mFrameGenerator.VideoElement);
        return true;
    };
    /*
    public ToTexture2(gl: WebGL2RenderingContext) : WebGLTexture{
        let tex = gl.createTexture()
        this.ToTexture(gl, tex)
        return;
    }
    */
    //Called before access of any frame data triggering the creation of the raw frame data
    LazyFrame.prototype.GenerateFrame = function () {
        if (this.mRawFrame == null) {
            try {
                this.mRawFrame = this.mFrameGenerator.CreateFrame();
            }
            catch (exception) {
                this.mRawFrame = null;
                Helper_1.SLog.LogWarning("frame skipped in GenerateFrame due to exception: " + JSON.stringify(exception));
            }
        }
    };
    return LazyFrame;
}(IFrameData));
exports.LazyFrame = LazyFrame;

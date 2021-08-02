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
exports.MediaConfig = void 0;
/// <summary>
/// Configuration for the WebRtcCall class.
/// 
/// Allows to turn on / off video and audio + configure the used servers to initialize the connection and
/// avoid firewalls.
/// </summary>
var MediaConfig = /** @class */ (function () {
    function MediaConfig() {
        this.mAudio = true;
        this.mVideo = true;
        this.mVideoDeviceName = "";
        this.mMinWidth = -1;
        this.mMinHeight = -1;
        this.mMaxWidth = -1;
        this.mMaxHeight = -1;
        this.mIdealWidth = -1;
        this.mIdealHeight = -1;
        this.mMinFps = -1;
        this.mMaxFps = -1;
        this.mIdealFps = -1;
        this.mFrameUpdates = false;
    }
    Object.defineProperty(MediaConfig.prototype, "Audio", {
        get: function () {
            return this.mAudio;
        },
        set: function (value) {
            this.mAudio = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaConfig.prototype, "Video", {
        get: function () {
            return this.mVideo;
        },
        set: function (value) {
            this.mVideo = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaConfig.prototype, "VideoDeviceName", {
        get: function () {
            return this.mVideoDeviceName;
        },
        set: function (value) {
            this.mVideoDeviceName = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaConfig.prototype, "MinWidth", {
        get: function () {
            return this.mMinWidth;
        },
        set: function (value) {
            this.mMinWidth = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaConfig.prototype, "MinHeight", {
        get: function () {
            return this.mMinHeight;
        },
        set: function (value) {
            this.mMinHeight = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaConfig.prototype, "MaxWidth", {
        get: function () {
            return this.mMaxWidth;
        },
        set: function (value) {
            this.mMaxWidth = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaConfig.prototype, "MaxHeight", {
        get: function () {
            return this.mMaxHeight;
        },
        set: function (value) {
            this.mMaxHeight = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaConfig.prototype, "IdealWidth", {
        get: function () {
            return this.mIdealWidth;
        },
        set: function (value) {
            this.mIdealWidth = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaConfig.prototype, "IdealHeight", {
        get: function () {
            return this.mIdealHeight;
        },
        set: function (value) {
            this.mIdealHeight = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaConfig.prototype, "MinFps", {
        get: function () {
            return this.mMinFps;
        },
        set: function (value) {
            this.mMinFps = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaConfig.prototype, "MaxFps", {
        get: function () {
            return this.mMaxFps;
        },
        set: function (value) {
            this.mMaxFps = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaConfig.prototype, "IdealFps", {
        get: function () {
            return this.mIdealFps;
        },
        set: function (value) {
            this.mIdealFps = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaConfig.prototype, "FrameUpdates", {
        /** false - frame updates aren't generated. Useful for browser mode
         *  true  - library will deliver frames as ByteArray
        */
        get: function () {
            return this.mFrameUpdates;
        },
        set: function (value) {
            this.mFrameUpdates = value;
        },
        enumerable: false,
        configurable: true
    });
    return MediaConfig;
}());
exports.MediaConfig = MediaConfig;

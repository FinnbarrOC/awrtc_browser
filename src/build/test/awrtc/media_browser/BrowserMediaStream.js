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
import { RawFrame, LazyFrame } from "../media/RawFrame";
import { SLog } from "../network/Helper";
/**
 * Mostly used for debugging at the moment. Browser API doesn't seem to have a standard way to
 * determine if a frame was updated. This class currently uses several different methods based
 * on availability
 *
 */
var FrameEventMethod;
(function (FrameEventMethod) {
    /**We use a set default framerate. FPS is unknown and we can't recognize if a frame was updated.
     * Used for remote video tracks on firefox as the "framerate" property will not be set.
     */
    FrameEventMethod["DEFAULT_FALLBACK"] = "DEFAULT_FALLBACK";
    /**
     * Using the tracks meta data to decide the framerate. We might drop frames or deliver them twice
     * because we can't tell when exactly they are updated.
     * Some video devices also claim 30 FPS but generate less causing us to waste performance copying the same image
     * multipel times
     *
     * This system works with local video in firefox
     */
    FrameEventMethod["TRACK"] = "TRACK";
    /**
     *  uses frame numbers returned by the browser. This works for webkit based browsers only so far.
     *  Firefox is either missing the needed properties or they return always 0
     */
    FrameEventMethod["EXACT"] = "EXACT";
})(FrameEventMethod || (FrameEventMethod = {}));
/**Internal use only.
 * Bundles all functionality related to MediaStream, Tracks and video processing.
 * It creates two HTML elements: Video and Canvas to interact with the video stream
 * and convert the visible frame data to Uint8Array for compatibility with the
 * unity plugin and all other platforms.
 *
 */
var BrowserMediaStream = /** @class */ (function () {
    function BrowserMediaStream(stream) {
        this.mBufferedFrame = null;
        this.mInstanceId = 0;
        this.mCanvasElement = null;
        this.mIsActive = false;
        this.mMsPerFrame = 1.0 / BrowserMediaStream.DEFAULT_FRAMERATE * 1000;
        this.mFrameEventMethod = FrameEventMethod.DEFAULT_FALLBACK;
        //used to buffer last volume level as part of the
        //autoplat workaround that will mute the audio until it gets the ok from the user
        this.mDefaultVolume = 0.5;
        //Time the last frame was generated
        this.mLastFrameTime = 0;
        this.mNextFrameTime = 0;
        /** Number of the last frame (not yet supported in all browsers)
         * if it remains at <= 0 then we just generate frames based on
         * the timer above
         */
        this.mLastFrameNumber = 0;
        this.mHasVideo = false;
        this.InternalStreamAdded = null;
        this.mStream = stream;
        this.mInstanceId = BrowserMediaStream.sNextInstanceId;
        BrowserMediaStream.sNextInstanceId++;
        this.mMsPerFrame = 1.0 / BrowserMediaStream.DEFAULT_FRAMERATE * 1000;
        this.mFrameEventMethod = FrameEventMethod.DEFAULT_FALLBACK;
        this.SetupElements();
    }
    Object.defineProperty(BrowserMediaStream.prototype, "Stream", {
        get: function () {
            return this.mStream;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BrowserMediaStream.prototype, "VideoElement", {
        get: function () {
            return this.mVideoElement;
        },
        enumerable: false,
        configurable: true
    });
    //must be called from onclick, touchstart, ... event handlers
    BrowserMediaStream.ResolveAutoplay = function () {
        SLog.L("ResolveAutoplay. Trying to restart video / turn on audio after user interaction ");
        var streams = BrowserMediaStream.sBlockedStreams;
        BrowserMediaStream.sBlockedStreams = new Set();
        for (var _i = 0, _a = Array.from(streams); _i < _a.length; _i++) {
            var v = _a[_i];
            v.ResolveAutoplay();
        }
    };
    BrowserMediaStream.prototype.ResolveAutoplay = function () {
        if (BrowserMediaStream.MUTE_IF_AUTOPLAT_BLOCKED) {
            SLog.L("Try to replay video with audio. ");
            //if muted due to autoplay -> unmute
            this.SetVolume(this.mDefaultVolume);
            if (this.mVideoElement.muted) {
                this.mVideoElement.muted = false;
            }
        }
        //call play again if needed
        if (this.mVideoElement.paused)
            this.mVideoElement.play();
    };
    BrowserMediaStream.prototype.CheckFrameRate = function () {
        if (this.mVideoElement) {
            if (this.mStream.getVideoTracks().length > 0) {
                this.mHasVideo = true;
                var vtrack = this.mStream.getVideoTracks()[0];
                var settings = vtrack.getSettings();
                var fps = settings.frameRate;
                if (fps) {
                    if (BrowserMediaStream.VERBOSE) {
                        console.log("Track FPS: " + fps);
                    }
                    this.mMsPerFrame = 1.0 / fps * 1000;
                    this.mFrameEventMethod = FrameEventMethod.TRACK;
                }
            }
            //try to get the video fps via the track
            //fails on firefox if the track comes from a remote source
            if (this.GetFrameNumber() != -1) {
                if (BrowserMediaStream.VERBOSE) {
                    console.log("Get frame available.");
                }
                //browser returns exact frame information
                this.mFrameEventMethod = FrameEventMethod.EXACT;
            }
            //failed to determine any frame rate. This happens on firefox with
            //remote tracks
            if (this.mFrameEventMethod === FrameEventMethod.DEFAULT_FALLBACK) {
                //firefox and co won't tell us the FPS for remote stream
                SLog.LW("Framerate unknown for stream " + this.mInstanceId + ". Using default framerate of " + BrowserMediaStream.DEFAULT_FRAMERATE);
            }
        }
    };
    BrowserMediaStream.prototype.TriggerAutoplayBlockled = function () {
        BrowserMediaStream.sBlockedStreams.add(this);
        if (BrowserMediaStream.onautoplayblocked !== null) {
            BrowserMediaStream.onautoplayblocked();
        }
    };
    BrowserMediaStream.prototype.TryPlay = function () {
        var _this = this;
        var playPromise = this.mVideoElement.play();
        this.mDefaultVolume = this.mVideoElement.volume;
        if (typeof playPromise !== "undefined") {
            playPromise.then(function () {
                //all good
            }).catch(function (error) {
                if (BrowserMediaStream.MUTE_IF_AUTOPLAT_BLOCKED === false) {
                    //browser blocked replay. print error & setup auto play workaround
                    console.error(error);
                    _this.TriggerAutoplayBlockled();
                }
                else {
                    //Below: Safari on Mac is able to just deactivate audio and show the video
                    //once user interacts with the content audio will be activated again via SetVolue
                    //WARNING: This fails on iOS! SetVolume fails and audio won't ever come back
                    //keep MUTE_IF_AUTOPLAT_BLOCKED === false for iOS support
                    console.warn(error);
                    SLog.LW("Replay of video failed. The browser might have blocked the video due to autoplay restrictions. Retrying without audio ...");
                    //try to play without audio enabled
                    _this.SetVolume(0);
                    var promise2 = _this.mVideoElement.play();
                    if (typeof promise2 !== "undefined") {
                        promise2.then(function () {
                            SLog.L("Playing video successful but muted.");
                            //still trigger for unmute on next click
                            _this.TriggerAutoplayBlockled();
                        }).catch(function (error) {
                            SLog.LE("Replay of video failed. This error is likely caused due to autoplay restrictions of the browser. Try allowing autoplay.");
                            console.error(error);
                            _this.TriggerAutoplayBlockled();
                        });
                    }
                }
            });
        }
    };
    BrowserMediaStream.prototype.SetupElements = function () {
        var _this = this;
        this.mVideoElement = this.SetupVideoElement();
        //TOOD: investigate bug here
        //In some cases onloadedmetadata is never called. This might happen due to a 
        //bug in firefox or might be related to a device / driver error
        //So far it only happens randomly (maybe 1 in 10 tries) on a single test device and only
        //with 720p. (video device "BisonCam, NB Pro" on MSI laptop)
        SLog.L("video element created. video tracks: " + this.mStream.getVideoTracks().length);
        this.mVideoElement.onloadedmetadata = function (e) {
            //console.log("onloadedmetadata");
            //we might have shutdown everything by now already
            if (_this.mVideoElement == null)
                return;
            _this.TryPlay();
            if (_this.InternalStreamAdded != null)
                _this.InternalStreamAdded(_this);
            _this.CheckFrameRate();
            var video_log = "Resolution: " + _this.mVideoElement.videoWidth + "x" + _this.mVideoElement.videoHeight
                + " fps method: " + _this.mFrameEventMethod + " " + Math.round(1000 / (_this.mMsPerFrame));
            SLog.L(video_log);
            if (BrowserMediaStream.VERBOSE) {
                console.log(video_log);
            }
            //now create canvas after the meta data of the video are known
            if (_this.mHasVideo) {
                _this.mCanvasElement = _this.SetupCanvas();
                //canvas couldn't be created. set video to false
                if (_this.mCanvasElement == null)
                    _this.mHasVideo = false;
            }
            else {
                _this.mCanvasElement = null;
            }
            _this.mIsActive = true;
        };
        //set the src value and trigger onloadedmetadata above
        try {
            //newer method. not yet supported everywhere
            var element = this.mVideoElement;
            element.srcObject = this.mStream;
        }
        catch (error) {
            //old way of doing it. won't work anymore in firefox and possibly other browsers
            this.mVideoElement.src = window.URL.createObjectURL(this.mStream);
        }
    };
    /** Returns the current frame number.
     *  Treat a return value of 0 or smaller as unknown.
     * (Browsers might have the property but
     * always return 0)
     */
    BrowserMediaStream.prototype.GetFrameNumber = function () {
        var frameNumber;
        if (this.mVideoElement) {
            if (this.mVideoElement.webkitDecodedFrameCount) {
                frameNumber = this.mVideoElement.webkitDecodedFrameCount;
            }
            /*
            None of these work and future versions might return numbers that are only
            updated once a second or so. For now it is best to ignore these.

            TODO: Check if any of these will work in the future. this.mVideoElement.getVideoPlaybackQuality().totalVideoFrames;
            might also help in the future (so far always 0)
            this.mVideoElement.currentTime also won't work because this is updated faster than the framerate (would result in >100+ framerate)
            else if((this.mVideoElement as any).mozParsedFrames)
            {
                frameNumber = (this.mVideoElement as any).mozParsedFrames;
            }else if((this.mVideoElement as any).mozDecodedFrames)
            {
                frameNumber = (this.mVideoElement as any).mozDecodedFrames;
            }else if((this.mVideoElement as any).decodedFrameCount)
            {
                frameNumber = (this.mVideoElement as any).decodedFrameCount;
            }
            */
            else {
                frameNumber = -1;
            }
        }
        else {
            frameNumber = -1;
        }
        return frameNumber;
    };
    BrowserMediaStream.prototype.TryGetFrame = function () {
        //make sure we get the newest frame
        //this.EnsureLatestFrame();
        //remove the buffered frame if any
        var result = this.mBufferedFrame;
        this.mBufferedFrame = null;
        return result;
    };
    BrowserMediaStream.prototype.SetMute = function (mute) {
        this.mVideoElement.muted = mute;
    };
    BrowserMediaStream.prototype.PeekFrame = function () {
        //this.EnsureLatestFrame();
        return this.mBufferedFrame;
    };
    /** Ensures we have the latest frame ready
     * for the next PeekFrame / TryGetFrame calls
     */
    BrowserMediaStream.prototype.EnsureLatestFrame = function () {
        if (this.HasNewerFrame()) {
            this.GenerateFrame();
            return true;
        }
        return false;
    };
    /** checks if the html tag has a newer frame available
     * (or if 1/30th of a second passed since last frame if
     * this info isn't available)
     */
    BrowserMediaStream.prototype.HasNewerFrame = function () {
        if (this.mIsActive
            && this.mHasVideo
            && this.mCanvasElement != null) {
            if (this.mLastFrameNumber > 0) {
                this.mFrameEventMethod = FrameEventMethod.EXACT;
                //we are getting frame numbers. use those to 
                //check if we have a new one
                if (this.GetFrameNumber() > this.mLastFrameNumber) {
                    return true;
                }
            }
            else {
                //many browsers do not share the frame info
                var now = new Date().getTime();
                if (this.mNextFrameTime <= now) {
                    {
                        return true;
                    }
                }
            }
        }
        return false;
    };
    BrowserMediaStream.prototype.Update = function () {
        this.EnsureLatestFrame();
    };
    BrowserMediaStream.prototype.DestroyCanvas = function () {
        if (this.mCanvasElement != null && this.mCanvasElement.parentElement != null) {
            this.mCanvasElement.parentElement.removeChild(this.mCanvasElement);
        }
    };
    BrowserMediaStream.prototype.Dispose = function () {
        this.mIsActive = false;
        BrowserMediaStream.sBlockedStreams.delete(this);
        this.DestroyCanvas();
        if (this.mVideoElement != null && this.mVideoElement.parentElement != null) {
            this.mVideoElement.parentElement.removeChild(this.mVideoElement);
        }
        //track cleanup is probably not needed but
        //it might help ensure it properly stops
        //in case there are other references out there
        var tracks = this.mStream.getTracks();
        for (var i = 0; i < tracks.length; i++) {
            tracks[i].stop();
        }
        this.mStream = null;
        this.mVideoElement = null;
        this.mCanvasElement = null;
    };
    BrowserMediaStream.prototype.CreateFrame = function () {
        this.mCanvasElement.width = this.mVideoElement.videoWidth;
        this.mCanvasElement.height = this.mVideoElement.videoHeight;
        var ctx = this.mCanvasElement.getContext("2d");
        /*
        var fillBackgroundFirst = true;
        if (fillBackgroundFirst) {
            ctx.clearRect(0, 0, this.mCanvasElement.width, this.mCanvasElement.height);
        }
        */
        ctx.drawImage(this.mVideoElement, 0, 0);
        try {
            //risk of security exception in firefox
            var imgData = ctx.getImageData(0, 0, this.mCanvasElement.width, this.mCanvasElement.height);
            var imgRawData = imgData.data;
            var array = new Uint8Array(imgRawData.buffer);
            return new RawFrame(array, this.mCanvasElement.width, this.mCanvasElement.height);
        }
        catch (exception) {
            //show white frame for now
            var array = new Uint8Array(this.mCanvasElement.width * this.mCanvasElement.height * 4);
            array.fill(255, 0, array.length - 1);
            var res = new RawFrame(array, this.mCanvasElement.width, this.mCanvasElement.height);
            //attempted workaround for firefox bug / suspected cause: 
            // * root cause seems to be an internal origin-clean flag within the canvas. If set to false reading from the
            //   canvas triggers a security exceptions. This is usually used if the canvas contains data that isn't 
            //   suppose to be accessible e.g. a picture from another domain
            // * while moving the image to the canvas the origin-clean flag seems to be set to false but only 
            //   during the first few frames. (maybe a race condition within firefox? A higher CPU workload increases the risk)
            // * the canvas will work and look just fine but calling getImageData isn't allowed anymore
            // * After a few frames the video is back to normal but the canvas will still have the flag set to false
            // 
            //Solution:
            // * Recreate the canvas if the exception is triggered. During the next few frames firefox should get its flag right
            //   and then stop causing the error. It might recreate the canvas multiple times until it finally works as we
            //   can't detect if the video element will trigger the issue until we tried to access the data
            SLog.LogWarning("Firefox workaround: Refused access to the remote video buffer. Retrying next frame...");
            this.DestroyCanvas();
            this.mCanvasElement = this.SetupCanvas();
            return res;
        }
    };
    //Old buffed frame was replaced with a wrapepr that avoids buffering internally
    //Only point of generate frame is now to ensure a consistent framerate
    BrowserMediaStream.prototype.GenerateFrame = function () {
        this.mLastFrameNumber = this.GetFrameNumber();
        var now = new Date().getTime();
        //js timing is very inaccurate. reduce time until next frame if we are
        //late with this one.
        var diff = now - this.mNextFrameTime;
        var delta = (this.mMsPerFrame - diff);
        delta = Math.min(this.mMsPerFrame, Math.max(1, delta));
        this.mLastFrameTime = now;
        this.mNextFrameTime = now + delta;
        //console.log("last frame , new frame", this.mLastFrameTime, this.mNextFrameTime, delta);
        this.mBufferedFrame = new LazyFrame(this);
    };
    BrowserMediaStream.prototype.SetupVideoElement = function () {
        var videoElement = document.createElement("video");
        //width/doesn't seem to be important
        videoElement.width = 320;
        videoElement.height = 240;
        videoElement.controls = true;
        videoElement.setAttribute("playsinline", "");
        videoElement.id = "awrtc_mediastream_video_" + this.mInstanceId;
        //videoElement.muted = true;
        if (BrowserMediaStream.DEBUG_SHOW_ELEMENTS)
            document.body.appendChild(videoElement);
        return videoElement;
    };
    BrowserMediaStream.prototype.SetupCanvas = function () {
        if (this.mVideoElement == null || this.mVideoElement.videoWidth <= 0 ||
            this.mVideoElement.videoHeight <= 0)
            return null;
        var canvas = document.createElement("canvas");
        canvas.width = this.mVideoElement.videoWidth;
        canvas.height = this.mVideoElement.videoHeight;
        canvas.id = "awrtc_mediastream_canvas_" + this.mInstanceId;
        if (BrowserMediaStream.DEBUG_SHOW_ELEMENTS)
            document.body.appendChild(canvas);
        return canvas;
    };
    BrowserMediaStream.prototype.SetVolume = function (volume) {
        if (this.mVideoElement == null) {
            return;
        }
        if (volume < 0)
            volume = 0;
        if (volume > 1)
            volume = 1;
        this.mVideoElement.volume = volume;
    };
    BrowserMediaStream.prototype.HasAudioTrack = function () {
        if (this.mStream != null && this.mStream.getAudioTracks() != null
            && this.mStream.getAudioTracks().length > 0) {
            return true;
        }
        return false;
    };
    BrowserMediaStream.prototype.HasVideoTrack = function () {
        if (this.mStream != null && this.mStream.getVideoTracks() != null
            && this.mStream.getVideoTracks().length > 0) {
            return true;
        }
        return false;
    };
    //no double buffering in java script as it forces us to create a new frame each time
    //for debugging. Will attach the HTMLVideoElement used to play the local and remote
    //video streams to the document.
    BrowserMediaStream.DEBUG_SHOW_ELEMENTS = false;
    BrowserMediaStream.MUTE_IF_AUTOPLAT_BLOCKED = false;
    //Gives each FrameBuffer and its HTMLVideoElement a fixed id for debugging purposes.
    BrowserMediaStream.sNextInstanceId = 1;
    BrowserMediaStream.VERBOSE = false;
    //Framerate used as a workaround if
    //the actual framerate is unknown due to browser restrictions
    BrowserMediaStream.DEFAULT_FRAMERATE = 30;
    BrowserMediaStream.sBlockedStreams = new Set();
    BrowserMediaStream.onautoplayblocked = null;
    return BrowserMediaStream;
}());
export { BrowserMediaStream };
//# sourceMappingURL=BrowserMediaStream.js.map
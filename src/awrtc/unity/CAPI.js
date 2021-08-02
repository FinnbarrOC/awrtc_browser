"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUnityContext = exports.GetUnityCanvas = exports.CAPI_VideoInput_UpdateFrame = exports.CAPI_VideoInput_RemoveDevice = exports.CAPI_VideoInput_AddDevice = exports.CAPI_VideoInput_AddCanvasDevice = exports.CAPI_Media_GetVideoDevices = exports.CAPI_Media_GetVideoDevices_Length = exports.CAPI_DeviceApi_LastUpdate = exports.CAPI_DeviceApi_RequestUpdate = exports.CAPI_DeviceApi_Update = exports.CAPI_MediaNetwork_IsMute = exports.CAPI_MediaNetwork_SetMute = exports.CAPI_MediaNetwork_HasVideoTrack = exports.CAPI_MediaNetwork_HasAudioTrack = exports.CAPI_MediaNetwork_SetVolume = exports.CAPI_MediaNetwork_TryGetFrameDataLength = exports.CAPI_MediaNetwork_TryGetFrame_Resolution = exports.CAPI_MediaNetwork_TryGetFrame_ToTexture = exports.CAPI_MediaNetwork_TryGetFrame = exports.CAPI_MediaNetwork_ResetConfiguration = exports.CAPI_MediaNetwork_GetConfigurationError = exports.CAPI_MediaNetwork_GetConfigurationState = exports.CAPI_MediaNetwork_Configure = exports.CAPI_MediaNetwork_Create = exports.CAPI_MediaNetwork_HasUserMedia = exports.CAPI_MediaNetwork_IsAvailable = exports.CAPI_WebRtcNetwork_PeekEm = exports.CAPI_WebRtcNetwork_DequeueEm = exports.CAPI_WebRtcNetwork_EventDataToUint8Array = exports.CAPI_WebRtcNetwork_CheckEventLength = exports.CAPI_WebRtcNetwork_PeekEventDataLength = exports.CAPI_WebRtcNetwork_Peek = exports.CAPI_WebRtcNetwork_Dequeue = exports.CAPI_WebRtcNetwork_GetBufferedAmount = exports.CAPI_WebRtcNetwork_SendDataEm = exports.CAPI_WebRtcNetwork_SendData = exports.CAPI_WebRtcNetwork_Flush = exports.CAPI_WebRtcNetwork_Update = exports.CAPI_WebRtcNetwork_Shutdown = exports.CAPI_WebRtcNetwork_Disconnect = exports.CAPI_WebRtcNetwork_StopServer = exports.CAPI_WebRtcNetwork_StartServer = exports.CAPI_WebRtcNetwork_Connect = exports.CAPI_WebRtcNetwork_Release = exports.CAPI_WebRtcNetwork_Create = exports.CAPI_WebRtcNetwork_IsBrowserSupported = exports.CAPI_WebRtcNetwork_IsAvailable = exports.CAPI_SLog_SetLogLevel = exports.CAPI_PollInitState = exports.CAPI_InitAsync = void 0;
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
/**This file contains the mapping between the awrtc_browser library and
 * Unitys WebGL support. Not needed for regular use.
 */
var index_1 = require("../network/index");
var index_2 = require("../media/index");
var index_3 = require("../media_browser/index");
var CAPI_InitMode = {
    //Original mode. Devices will be unknown after startup
    Default: 0,
    //Waits for the desvice info to come in
    //names might be missing though (browser security thing)
    WaitForDevices: 1,
    //Asks the user for camera / audio access to be able to
    //get accurate device information
    RequestAccess: 2
};
var CAPI_InitState = {
    Uninitialized: 0,
    Initializing: 1,
    Initialized: 2,
    Failed: 3
};
var gCAPI_InitState = CAPI_InitState.Uninitialized;
var gCAPI_Canvas = null;
function CAPI_InitAsync(initmode) {
    console.debug("CAPI_InitAsync mode: " + initmode);
    gCAPI_InitState = CAPI_InitState.Initializing;
    if (GLctx && GLctx.canvas) {
        gCAPI_Canvas = GLctx.canvas;
    }
    InitAutoplayWorkaround();
    var hasDevApi = index_3.DeviceApi.IsApiAvailable();
    if (hasDevApi && initmode == CAPI_InitMode.WaitForDevices) {
        index_3.DeviceApi.Update();
    }
    else if (hasDevApi && initmode == CAPI_InitMode.RequestAccess) {
        index_3.DeviceApi.RequestUpdate();
    }
    else {
        //either no device access available or not requested. Switch
        //to init state immediately without device info
        gCAPI_InitState = CAPI_InitState.Initialized;
        if (hasDevApi == false) {
            console.debug("Initialized without accessible DeviceAPI");
        }
    }
}
exports.CAPI_InitAsync = CAPI_InitAsync;
function InitAutoplayWorkaround() {
    if (gCAPI_Canvas == null) {
        index_1.SLog.LW("Autoplay workaround inactive. No canvas object known to register click & touch event handlers.");
        return;
    }
    var listener = null;
    listener = function () {
        //called during user input event
        index_3.BrowserMediaStream.ResolveAutoplay();
        gCAPI_Canvas.removeEventListener("click", listener, false);
        gCAPI_Canvas.removeEventListener("touchstart", listener, false);
    };
    //If a stream runs into autoplay issues we add a listener for the next on click / touchstart event
    //and resolve it on the next incoming event
    index_3.BrowserMediaStream.onautoplayblocked = function () {
        gCAPI_Canvas.addEventListener("click", listener, false);
        gCAPI_Canvas.addEventListener("touchstart", listener, false);
    };
}
function CAPI_PollInitState() {
    //keep checking if the DeviceApi left pending state
    //Once completed init is finished.
    //Later we might do more here
    if (index_3.DeviceApi.IsPending == false && gCAPI_InitState == CAPI_InitState.Initializing) {
        gCAPI_InitState = CAPI_InitState.Initialized;
        console.debug("Init completed.");
    }
    return gCAPI_InitState;
}
exports.CAPI_PollInitState = CAPI_PollInitState;
/**
 *
 * @param loglevel
 * None = 0,
 * Errors = 1,
 * Warnings = 2,
 * Verbose = 3
 */
function CAPI_SLog_SetLogLevel(loglevel) {
    if (loglevel < 0 || loglevel > 3) {
        index_1.SLog.LogError("Invalid log level " + loglevel);
        return;
    }
    index_1.SLog.SetLogLevel(loglevel);
}
exports.CAPI_SLog_SetLogLevel = CAPI_SLog_SetLogLevel;
var gCAPI_WebRtcNetwork_Instances = {};
var gCAPI_WebRtcNetwork_InstancesNextIndex = 1;
function CAPI_WebRtcNetwork_IsAvailable() {
    //used by C# component to check if this plugin is loaded.
    //can only go wrong due to programming error / packaging
    if (index_1.WebRtcNetwork && index_1.WebsocketNetwork)
        return true;
    return false;
}
exports.CAPI_WebRtcNetwork_IsAvailable = CAPI_WebRtcNetwork_IsAvailable;
function CAPI_WebRtcNetwork_IsBrowserSupported() {
    if (RTCPeerConnection && RTCDataChannel)
        return true;
    return false;
}
exports.CAPI_WebRtcNetwork_IsBrowserSupported = CAPI_WebRtcNetwork_IsBrowserSupported;
function CAPI_WebRtcNetwork_Create(lConfiguration) {
    var lIndex = gCAPI_WebRtcNetwork_InstancesNextIndex;
    gCAPI_WebRtcNetwork_InstancesNextIndex++;
    var signaling_class = "LocalNetwork";
    var signaling_param = null;
    var iceServers;
    if (lConfiguration == null || typeof lConfiguration !== 'string' || lConfiguration.length === 0) {
        index_1.SLog.LogError("invalid configuration. Returning -1! Config: " + lConfiguration);
        return -1;
    }
    else {
        var conf = JSON.parse(lConfiguration);
        if (conf) {
            if (conf.signaling) {
                signaling_class = conf.signaling.class;
                signaling_param = conf.signaling.param;
            }
            if (conf.iceServers) {
                iceServers = conf.iceServers;
            }
            index_1.SLog.L(signaling_class);
            //this seems to be broken after switch to modules
            //let signalingNetworkClass = window[signaling_class];
            //let signalingNetworkClass =  new (<any>window)["awrtc.LocalNetwork"];
            //console.debug(signalingNetworkClass);
            var signalingNetworkClass = void 0;
            if (signaling_class === "LocalNetwork") {
                signalingNetworkClass = index_1.LocalNetwork;
            }
            else {
                signalingNetworkClass = index_1.WebsocketNetwork;
            }
            var signalingConfig = new index_1.SignalingConfig(new signalingNetworkClass(signaling_param));
            var rtcConfiguration = { iceServers: iceServers };
            gCAPI_WebRtcNetwork_Instances[lIndex] = new index_1.WebRtcNetwork(signalingConfig, rtcConfiguration);
        }
        else {
            index_1.SLog.LogWarning("Parsing configuration failed. Configuration: " + lConfiguration);
            return -1;
        }
    }
    //gCAPI_WebRtcNetwork_Instances[lIndex].OnLog = function (lMsg) {
    //    console.debug(lMsg);
    //};
    return lIndex;
}
exports.CAPI_WebRtcNetwork_Create = CAPI_WebRtcNetwork_Create;
function CAPI_WebRtcNetwork_Release(lIndex) {
    if (lIndex in gCAPI_WebRtcNetwork_Instances) {
        gCAPI_WebRtcNetwork_Instances[lIndex].Dispose();
        delete gCAPI_WebRtcNetwork_Instances[lIndex];
    }
}
exports.CAPI_WebRtcNetwork_Release = CAPI_WebRtcNetwork_Release;
function CAPI_WebRtcNetwork_Connect(lIndex, lRoom) {
    return gCAPI_WebRtcNetwork_Instances[lIndex].Connect(lRoom);
}
exports.CAPI_WebRtcNetwork_Connect = CAPI_WebRtcNetwork_Connect;
function CAPI_WebRtcNetwork_StartServer(lIndex, lRoom) {
    gCAPI_WebRtcNetwork_Instances[lIndex].StartServer(lRoom);
}
exports.CAPI_WebRtcNetwork_StartServer = CAPI_WebRtcNetwork_StartServer;
function CAPI_WebRtcNetwork_StopServer(lIndex) {
    gCAPI_WebRtcNetwork_Instances[lIndex].StopServer();
}
exports.CAPI_WebRtcNetwork_StopServer = CAPI_WebRtcNetwork_StopServer;
function CAPI_WebRtcNetwork_Disconnect(lIndex, lConnectionId) {
    gCAPI_WebRtcNetwork_Instances[lIndex].Disconnect(new index_1.ConnectionId(lConnectionId));
}
exports.CAPI_WebRtcNetwork_Disconnect = CAPI_WebRtcNetwork_Disconnect;
function CAPI_WebRtcNetwork_Shutdown(lIndex) {
    gCAPI_WebRtcNetwork_Instances[lIndex].Shutdown();
}
exports.CAPI_WebRtcNetwork_Shutdown = CAPI_WebRtcNetwork_Shutdown;
function CAPI_WebRtcNetwork_Update(lIndex) {
    gCAPI_WebRtcNetwork_Instances[lIndex].Update();
}
exports.CAPI_WebRtcNetwork_Update = CAPI_WebRtcNetwork_Update;
function CAPI_WebRtcNetwork_Flush(lIndex) {
    gCAPI_WebRtcNetwork_Instances[lIndex].Flush();
}
exports.CAPI_WebRtcNetwork_Flush = CAPI_WebRtcNetwork_Flush;
function CAPI_WebRtcNetwork_SendData(lIndex, lConnectionId, lUint8ArrayData, lReliable) {
    gCAPI_WebRtcNetwork_Instances[lIndex].SendData(new index_1.ConnectionId(lConnectionId), lUint8ArrayData, lReliable);
}
exports.CAPI_WebRtcNetwork_SendData = CAPI_WebRtcNetwork_SendData;
//helper for emscripten
function CAPI_WebRtcNetwork_SendDataEm(lIndex, lConnectionId, lUint8ArrayData, lUint8ArrayDataOffset, lUint8ArrayDataLength, lReliable) {
    //console.debug("SendDataEm: " + lReliable + " length " + lUint8ArrayDataLength + " to " + lConnectionId);
    var arrayBuffer = new Uint8Array(lUint8ArrayData.buffer, lUint8ArrayDataOffset, lUint8ArrayDataLength);
    return gCAPI_WebRtcNetwork_Instances[lIndex].SendData(new index_1.ConnectionId(lConnectionId), arrayBuffer, lReliable);
}
exports.CAPI_WebRtcNetwork_SendDataEm = CAPI_WebRtcNetwork_SendDataEm;
function CAPI_WebRtcNetwork_GetBufferedAmount(lIndex, lConnectionId, lReliable) {
    return gCAPI_WebRtcNetwork_Instances[lIndex].GetBufferedAmount(new index_1.ConnectionId(lConnectionId), lReliable);
}
exports.CAPI_WebRtcNetwork_GetBufferedAmount = CAPI_WebRtcNetwork_GetBufferedAmount;
function CAPI_WebRtcNetwork_Dequeue(lIndex) {
    return gCAPI_WebRtcNetwork_Instances[lIndex].Dequeue();
}
exports.CAPI_WebRtcNetwork_Dequeue = CAPI_WebRtcNetwork_Dequeue;
function CAPI_WebRtcNetwork_Peek(lIndex) {
    return gCAPI_WebRtcNetwork_Instances[lIndex].Peek();
}
exports.CAPI_WebRtcNetwork_Peek = CAPI_WebRtcNetwork_Peek;
/**Allows to peek into the next event to figure out its length and allocate
 * the memory needed to store it before calling
 *      CAPI_WebRtcNetwork_DequeueEm
 *
 * @param {type} lIndex
 * @returns {Number}
 */
function CAPI_WebRtcNetwork_PeekEventDataLength(lIndex) {
    var lNetEvent = gCAPI_WebRtcNetwork_Instances[lIndex].Peek();
    return CAPI_WebRtcNetwork_CheckEventLength(lNetEvent);
}
exports.CAPI_WebRtcNetwork_PeekEventDataLength = CAPI_WebRtcNetwork_PeekEventDataLength;
//helper
function CAPI_WebRtcNetwork_CheckEventLength(lNetEvent) {
    if (lNetEvent == null) {
        //invalid event
        return -1;
    }
    else if (lNetEvent.RawData == null) {
        //no data
        return 0;
    }
    else if (typeof lNetEvent.RawData === "string") {
        //no user strings are allowed thus we get away with counting the characters
        //(ASCII only!)
        return lNetEvent.RawData.length;
    }
    else //message event types 1 and 2 only? check for it?
     {
        //its not null and not a string. can only be a Uint8Array if we didn't
        //mess something up in the implementation
        return lNetEvent.RawData.length;
    }
}
exports.CAPI_WebRtcNetwork_CheckEventLength = CAPI_WebRtcNetwork_CheckEventLength;
function CAPI_WebRtcNetwork_EventDataToUint8Array(data, dataUint8Array, dataOffset, dataLength) {
    //data can be null, string or Uint8Array
    //return value will be the length of data we used
    if (data == null) {
        return 0;
    }
    else if ((typeof data) === "string") {
        //in case we don't get a large enough array we need to cut off the string
        var i = 0;
        for (i = 0; i < data.length && i < dataLength; i++) {
            dataUint8Array[dataOffset + i] = data.charCodeAt(i);
        }
        return i;
    }
    else {
        var i = 0;
        //in case we don't get a large enough array we need to cut off the string
        for (i = 0; i < data.length && i < dataLength; i++) {
            dataUint8Array[dataOffset + i] = data[i];
        }
        return i;
    }
}
exports.CAPI_WebRtcNetwork_EventDataToUint8Array = CAPI_WebRtcNetwork_EventDataToUint8Array;
//Version for emscripten or anything that doesn't have a garbage collector.
// The memory for everything needs to be allocated before the call.
function CAPI_WebRtcNetwork_DequeueEm(lIndex, lTypeIntArray, lTypeIntIndex, lConidIntArray, lConidIndex, lDataUint8Array, lDataOffset, lDataLength, lDataLenIntArray, lDataLenIntIndex) {
    var nEvt = CAPI_WebRtcNetwork_Dequeue(lIndex);
    if (nEvt == null)
        return false;
    lTypeIntArray[lTypeIntIndex] = nEvt.Type;
    lConidIntArray[lConidIndex] = nEvt.ConnectionId.id;
    //console.debug("event" + nEvt.netEventType);
    var length = CAPI_WebRtcNetwork_EventDataToUint8Array(nEvt.RawData, lDataUint8Array, lDataOffset, lDataLength);
    lDataLenIntArray[lDataLenIntIndex] = length; //return the length if so the user knows how much of the given array is used
    return true;
}
exports.CAPI_WebRtcNetwork_DequeueEm = CAPI_WebRtcNetwork_DequeueEm;
function CAPI_WebRtcNetwork_PeekEm(lIndex, lTypeIntArray, lTypeIntIndex, lConidIntArray, lConidIndex, lDataUint8Array, lDataOffset, lDataLength, lDataLenIntArray, lDataLenIntIndex) {
    var nEvt = CAPI_WebRtcNetwork_Peek(lIndex);
    if (nEvt == null)
        return false;
    lTypeIntArray[lTypeIntIndex] = nEvt.Type;
    lConidIntArray[lConidIndex] = nEvt.ConnectionId.id;
    //console.debug("event" + nEvt.netEventType);
    var length = CAPI_WebRtcNetwork_EventDataToUint8Array(nEvt.RawData, lDataUint8Array, lDataOffset, lDataLength);
    lDataLenIntArray[lDataLenIntIndex] = length; //return the length if so the user knows how much of the given array is used
    return true;
}
exports.CAPI_WebRtcNetwork_PeekEm = CAPI_WebRtcNetwork_PeekEm;
function CAPI_MediaNetwork_IsAvailable() {
    if (index_3.BrowserMediaNetwork && index_3.BrowserWebRtcCall)
        return true;
    return false;
}
exports.CAPI_MediaNetwork_IsAvailable = CAPI_MediaNetwork_IsAvailable;
function CAPI_MediaNetwork_HasUserMedia() {
    if (navigator && navigator.mediaDevices)
        return true;
    return false;
}
exports.CAPI_MediaNetwork_HasUserMedia = CAPI_MediaNetwork_HasUserMedia;
function CAPI_MediaNetwork_Create(lJsonConfiguration) {
    var config = new index_2.NetworkConfig();
    config = JSON.parse(lJsonConfiguration);
    var mediaNetwork = new index_3.BrowserMediaNetwork(config);
    var lIndex = gCAPI_WebRtcNetwork_InstancesNextIndex;
    gCAPI_WebRtcNetwork_InstancesNextIndex++;
    gCAPI_WebRtcNetwork_Instances[lIndex] = mediaNetwork;
    return lIndex;
}
exports.CAPI_MediaNetwork_Create = CAPI_MediaNetwork_Create;
//Configure(config: MediaConfig): void;
function CAPI_MediaNetwork_Configure(lIndex, audio, video, minWidth, minHeight, maxWidth, maxHeight, idealWidth, idealHeight, minFps, maxFps, idealFps, deviceName) {
    if (deviceName === void 0) { deviceName = ""; }
    var config = new index_2.MediaConfig();
    config.Audio = audio;
    config.Video = video;
    config.MinWidth = minWidth;
    config.MinHeight = minHeight;
    config.MaxWidth = maxWidth;
    config.MaxHeight = maxHeight;
    config.IdealWidth = idealWidth;
    config.IdealHeight = idealHeight;
    config.MinFps = minFps;
    config.MaxFps = maxFps;
    config.IdealFps = idealFps;
    config.VideoDeviceName = deviceName;
    config.FrameUpdates = true;
    var mediaNetwork = gCAPI_WebRtcNetwork_Instances[lIndex];
    mediaNetwork.Configure(config);
}
exports.CAPI_MediaNetwork_Configure = CAPI_MediaNetwork_Configure;
//GetConfigurationState(): MediaConfigurationState;
function CAPI_MediaNetwork_GetConfigurationState(lIndex) {
    var mediaNetwork = gCAPI_WebRtcNetwork_Instances[lIndex];
    return mediaNetwork.GetConfigurationState();
}
exports.CAPI_MediaNetwork_GetConfigurationState = CAPI_MediaNetwork_GetConfigurationState;
//Note: not yet glued to the C# version!
//GetConfigurationError(): string;
function CAPI_MediaNetwork_GetConfigurationError(lIndex) {
    var mediaNetwork = gCAPI_WebRtcNetwork_Instances[lIndex];
    return mediaNetwork.GetConfigurationError();
}
exports.CAPI_MediaNetwork_GetConfigurationError = CAPI_MediaNetwork_GetConfigurationError;
//ResetConfiguration(): void;
function CAPI_MediaNetwork_ResetConfiguration(lIndex) {
    var mediaNetwork = gCAPI_WebRtcNetwork_Instances[lIndex];
    return mediaNetwork.ResetConfiguration();
}
exports.CAPI_MediaNetwork_ResetConfiguration = CAPI_MediaNetwork_ResetConfiguration;
//TryGetFrame(id: ConnectionId): RawFrame;
function CAPI_MediaNetwork_TryGetFrame(lIndex, lConnectionId, lWidthInt32Array, lWidthIntArrayIndex, lHeightInt32Array, lHeightIntArrayIndex, lBufferUint8Array, lBufferUint8ArrayOffset, lBufferUint8ArrayLength) {
    var mediaNetwork = gCAPI_WebRtcNetwork_Instances[lIndex];
    var frame = mediaNetwork.TryGetFrame(new index_1.ConnectionId(lConnectionId));
    if (frame == null || frame.Buffer == null) {
        return false;
    }
    else {
        lWidthInt32Array[lWidthIntArrayIndex] = frame.Width;
        lHeightInt32Array[lHeightIntArrayIndex] = frame.Height;
        for (var i = 0; i < lBufferUint8ArrayLength && i < frame.Buffer.length; i++) {
            lBufferUint8Array[lBufferUint8ArrayOffset + i] = frame.Buffer[i];
        }
        return true;
    }
}
exports.CAPI_MediaNetwork_TryGetFrame = CAPI_MediaNetwork_TryGetFrame;
function CAPI_MediaNetwork_TryGetFrame_ToTexture(lIndex, lConnectionId, lWidth, lHeight, gl, texture) {
    //console.log("CAPI_MediaNetwork_TryGetFrame_ToTexture");
    var mediaNetwork = gCAPI_WebRtcNetwork_Instances[lIndex];
    var frame = mediaNetwork.TryGetFrame(new index_1.ConnectionId(lConnectionId));
    if (frame == null) {
        return false;
    }
    else if (frame.Width != lWidth || frame.Height != lHeight) {
        index_1.SLog.LW("CAPI_MediaNetwork_TryGetFrame_ToTexture failed. Width height expected: " + frame.Width + "x" + frame.Height + " but received " + lWidth + "x" + lHeight);
        return false;
    }
    else {
        frame.ToTexture(gl, texture);
        return true;
    }
}
exports.CAPI_MediaNetwork_TryGetFrame_ToTexture = CAPI_MediaNetwork_TryGetFrame_ToTexture;
/*
export function CAPI_MediaNetwork_TryGetFrame_ToTexture2(lIndex: number, lConnectionId: number,
    lWidthInt32Array: Int32Array, lWidthIntArrayIndex: number,
    lHeightInt32Array: Int32Array, lHeightIntArrayIndex: number,
    gl:WebGL2RenderingContext): WebGLTexture
{
    //console.log("CAPI_MediaNetwork_TryGetFrame_ToTexture");
    let mediaNetwork = gCAPI_WebRtcNetwork_Instances[lIndex] as BrowserMediaNetwork;
    let frame = mediaNetwork.TryGetFrame(new ConnectionId(lConnectionId));

    if (frame == null) {
        return false;
    } else {
        lWidthInt32Array[lWidthIntArrayIndex] = frame.Width;
        lHeightInt32Array[lHeightIntArrayIndex] = frame.Height;
        let texture  = frame.ToTexture2(gl);
        return texture;
    }
}
*/
function CAPI_MediaNetwork_TryGetFrame_Resolution(lIndex, lConnectionId, lWidthInt32Array, lWidthIntArrayIndex, lHeightInt32Array, lHeightIntArrayIndex) {
    var mediaNetwork = gCAPI_WebRtcNetwork_Instances[lIndex];
    var frame = mediaNetwork.PeekFrame(new index_1.ConnectionId(lConnectionId));
    if (frame == null) {
        return false;
    }
    else {
        lWidthInt32Array[lWidthIntArrayIndex] = frame.Width;
        lHeightInt32Array[lHeightIntArrayIndex] = frame.Height;
        return true;
    }
}
exports.CAPI_MediaNetwork_TryGetFrame_Resolution = CAPI_MediaNetwork_TryGetFrame_Resolution;
//Returns the frame buffer size or -1 if no frame is available
function CAPI_MediaNetwork_TryGetFrameDataLength(lIndex, connectionId) {
    var mediaNetwork = gCAPI_WebRtcNetwork_Instances[lIndex];
    var frame = mediaNetwork.PeekFrame(new index_1.ConnectionId(connectionId));
    var length = -1;
    //added frame.Buffer != null as the frame might be a LazyFrame just creating a copy of the html video element
    //in the moment frame.Buffer is called. if this fails for any reasion it might return null despite
    //the frame object itself being available
    if (frame != null && frame.Buffer != null) {
        length = frame.Buffer.length;
    }
    //SLog.L("data length:" + length);
    return length;
}
exports.CAPI_MediaNetwork_TryGetFrameDataLength = CAPI_MediaNetwork_TryGetFrameDataLength;
function CAPI_MediaNetwork_SetVolume(lIndex, volume, connectionId) {
    var mediaNetwork = gCAPI_WebRtcNetwork_Instances[lIndex];
    mediaNetwork.SetVolume(volume, new index_1.ConnectionId(connectionId));
}
exports.CAPI_MediaNetwork_SetVolume = CAPI_MediaNetwork_SetVolume;
function CAPI_MediaNetwork_HasAudioTrack(lIndex, connectionId) {
    var mediaNetwork = gCAPI_WebRtcNetwork_Instances[lIndex];
    return mediaNetwork.HasAudioTrack(new index_1.ConnectionId(connectionId));
}
exports.CAPI_MediaNetwork_HasAudioTrack = CAPI_MediaNetwork_HasAudioTrack;
function CAPI_MediaNetwork_HasVideoTrack(lIndex, connectionId) {
    var mediaNetwork = gCAPI_WebRtcNetwork_Instances[lIndex];
    return mediaNetwork.HasVideoTrack(new index_1.ConnectionId(connectionId));
}
exports.CAPI_MediaNetwork_HasVideoTrack = CAPI_MediaNetwork_HasVideoTrack;
function CAPI_MediaNetwork_SetMute(lIndex, value) {
    var mediaNetwork = gCAPI_WebRtcNetwork_Instances[lIndex];
    mediaNetwork.SetMute(value);
}
exports.CAPI_MediaNetwork_SetMute = CAPI_MediaNetwork_SetMute;
function CAPI_MediaNetwork_IsMute(lIndex) {
    var mediaNetwork = gCAPI_WebRtcNetwork_Instances[lIndex];
    return mediaNetwork.IsMute();
}
exports.CAPI_MediaNetwork_IsMute = CAPI_MediaNetwork_IsMute;
function CAPI_DeviceApi_Update() {
    index_3.DeviceApi.Update();
}
exports.CAPI_DeviceApi_Update = CAPI_DeviceApi_Update;
function CAPI_DeviceApi_RequestUpdate() {
    index_3.DeviceApi.RequestUpdate();
}
exports.CAPI_DeviceApi_RequestUpdate = CAPI_DeviceApi_RequestUpdate;
function CAPI_DeviceApi_LastUpdate() {
    return index_3.DeviceApi.LastUpdate;
}
exports.CAPI_DeviceApi_LastUpdate = CAPI_DeviceApi_LastUpdate;
function CAPI_Media_GetVideoDevices_Length() {
    return index_3.Media.SharedInstance.GetVideoDevices().length;
}
exports.CAPI_Media_GetVideoDevices_Length = CAPI_Media_GetVideoDevices_Length;
function CAPI_Media_GetVideoDevices(index) {
    var devs = index_3.Media.SharedInstance.GetVideoDevices();
    if (devs.length > index) {
        return devs[index];
    }
    else {
        index_1.SLog.LE("Requested device with index " + index + " does not exist.");
        //it needs to be "" to behave the same to the C++ API. std::string can't be null
        return "";
    }
}
exports.CAPI_Media_GetVideoDevices = CAPI_Media_GetVideoDevices;
function CAPI_VideoInput_AddCanvasDevice(query, name, width, height, fps) {
    var canvas = document.querySelector(query);
    if (canvas) {
        console.debug("CAPI_VideoInput_AddCanvasDevice", { query: query, name: name, width: width, height: height, fps: fps });
        if (width <= 0 || height <= 0) {
            width = canvas.width;
            height = canvas.height;
        }
        index_3.Media.SharedInstance.VideoInput.AddCanvasDevice(canvas, name, width, height, fps); //, width, height, fps);
        return true;
    }
    return false;
}
exports.CAPI_VideoInput_AddCanvasDevice = CAPI_VideoInput_AddCanvasDevice;
function CAPI_VideoInput_AddDevice(name, width, height, fps) {
    index_3.Media.SharedInstance.VideoInput.AddDevice(name, width, height, fps);
}
exports.CAPI_VideoInput_AddDevice = CAPI_VideoInput_AddDevice;
function CAPI_VideoInput_RemoveDevice(name) {
    index_3.Media.SharedInstance.VideoInput.RemoveDevice(name);
}
exports.CAPI_VideoInput_RemoveDevice = CAPI_VideoInput_RemoveDevice;
function CAPI_VideoInput_UpdateFrame(name, lBufferUint8Array, lBufferUint8ArrayOffset, lBufferUint8ArrayLength, width, height, rotation, firstRowIsBottom) {
    var dataPtrClamped = null;
    if (lBufferUint8Array && lBufferUint8ArrayLength > 0) {
        dataPtrClamped = new Uint8ClampedArray(lBufferUint8Array.buffer, lBufferUint8ArrayOffset, lBufferUint8ArrayLength);
    }
    return index_3.Media.SharedInstance.VideoInput.UpdateFrame(name, dataPtrClamped, width, height, index_3.VideoInputType.ARGB, rotation, firstRowIsBottom);
}
exports.CAPI_VideoInput_UpdateFrame = CAPI_VideoInput_UpdateFrame;
function GetUnityCanvas() {
    if (gCAPI_Canvas !== null)
        return gCAPI_Canvas;
    index_1.SLog.LogWarning("Using GetUnityCanvas without a known cavans reference.");
    return document.querySelector("canvas");
}
exports.GetUnityCanvas = GetUnityCanvas;
function GetUnityContext() {
    return GetUnityCanvas().getContext("webgl2");
}
exports.GetUnityContext = GetUnityContext;

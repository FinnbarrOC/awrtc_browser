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
exports.AWebRtcCall = void 0;
var IMediaNetwork_1 = require("./IMediaNetwork");
var CallEventArgs_1 = require("./CallEventArgs");
var Helper_1 = require("../network/Helper");
var NetworkConfig_1 = require("./NetworkConfig");
var MediaConfig_1 = require("./MediaConfig");
var index_1 = require("../network/index");
var CallException = /** @class */ (function () {
    function CallException(errorMsg) {
        this.mErrorMsg = errorMsg;
    }
    CallException.prototype.ErrorMsg = function () {
    };
    return CallException;
}());
var InvalidOperationException = /** @class */ (function (_super) {
    __extends(InvalidOperationException, _super);
    function InvalidOperationException() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return InvalidOperationException;
}(CallException));
/// <summary>
/// State of the call. Mainly used to check for bugs / invalid states.
/// </summary>
var CallState;
(function (CallState) {
    /// <summary>
    /// Not yet initialized / bug
    /// </summary>
    CallState[CallState["Invalid"] = 0] = "Invalid";
    /// <summary>
    /// Object is initialized but local media not yet configured
    /// </summary>
    CallState[CallState["Initialized"] = 1] = "Initialized";
    /// <summary>
    /// In process of accessing the local media devices.
    /// </summary>
    CallState[CallState["Configuring"] = 2] = "Configuring";
    /// <summary>
    /// Configured. Video/Audio can be accessed and call is ready to start
    /// </summary>
    CallState[CallState["Configured"] = 3] = "Configured";
    /// <summary>
    /// In process of requesting an address from the server to then listen and wait for
    /// an incoming call.
    /// </summary>
    CallState[CallState["RequestingAddress"] = 4] = "RequestingAddress";
    /// <summary>
    /// Call is listening on an address and waiting for an incoming call
    /// </summary>
    CallState[CallState["WaitingForIncomingCall"] = 5] = "WaitingForIncomingCall";
    /// <summary>
    /// Call is in the process of connecting to another call object.
    /// </summary>
    CallState[CallState["WaitingForOutgoingCall"] = 6] = "WaitingForOutgoingCall";
    /// <summary>
    /// Indicating that the call object is at least connected to another object
    /// </summary>
    CallState[CallState["InCall"] = 7] = "InCall";
    //CallAcceptedIncoming,
    //CallAcceptedOutgoing,
    /// <summary>
    /// Call ended / conference room closed
    /// </summary>
    CallState[CallState["Closed"] = 8] = "Closed";
})(CallState || (CallState = {}));
/*
class ConnectionMetaData
{
}
*/
var ConnectionInfo = /** @class */ (function () {
    function ConnectionInfo() {
        this.mConnectionIds = new Array();
        //public GetMeta(id:ConnectionId) : ConnectionMetaData
        //{
        //    return this.mConnectionMeta[id.id];
        //}
    }
    //private mConnectionMeta: { [id: number]: ConnectionMetaData } = {};
    ConnectionInfo.prototype.AddConnection = function (id, incoming) {
        this.mConnectionIds.push(id.id);
        //this.mConnectionMeta[id.id] = new ConnectionMetaData();
    };
    ConnectionInfo.prototype.RemConnection = function (id) {
        var index = this.mConnectionIds.indexOf(id.id);
        if (index >= 0) {
            this.mConnectionIds.splice(index, 1);
        }
        else {
            Helper_1.SLog.LE("tried to remove an unknown connection with id " + id.id);
        }
        //delete this.mConnectionMeta[id.id];
    };
    ConnectionInfo.prototype.HasConnection = function (id) {
        return this.mConnectionIds.indexOf(id.id) != -1;
    };
    ConnectionInfo.prototype.GetIds = function () {
        return this.mConnectionIds;
    };
    return ConnectionInfo;
}());
/**This class wraps an implementation of
 * IMediaStream and converts its polling system
 * to an easier to use event based system.
 *
 * Ideally use only features defined by
 * ICall to avoid having to deal with internal changes
 * in future updates.
 */
var AWebRtcCall = /** @class */ (function () {
    function AWebRtcCall(config) {
        if (config === void 0) { config = null; }
        this.MESSAGE_TYPE_INVALID = 0;
        this.MESSAGE_TYPE_DATA = 1;
        this.MESSAGE_TYPE_STRING = 2;
        this.MESSAGE_TYPE_CONTROL = 3;
        this.mNetworkConfig = new NetworkConfig_1.NetworkConfig();
        this.mMediaConfig = null;
        this.mCallEventHandlers = [];
        this.mNetwork = null;
        this.mConnectionInfo = new ConnectionInfo();
        this.mConferenceMode = false;
        this.mState = CallState.Invalid;
        this.mIsDisposed = false;
        this.mServerInactive = true;
        this.mPendingListenCall = false;
        this.mPendingCallCall = false;
        this.mPendingAddress = null;
        if (config != null) {
            this.mNetworkConfig = config;
            this.mConferenceMode = config.IsConference;
        }
    }
    AWebRtcCall.prototype.addEventListener = function (listener) {
        this.mCallEventHandlers.push(listener);
    };
    AWebRtcCall.prototype.removeEventListener = function (listener) {
        this.mCallEventHandlers = this.mCallEventHandlers.filter(function (h) { return h !== listener; });
    };
    Object.defineProperty(AWebRtcCall.prototype, "State", {
        get: function () {
            return this.mState;
        },
        enumerable: false,
        configurable: true
    });
    AWebRtcCall.prototype.Initialize = function (network) {
        this.mNetwork = network;
        this.mState = CallState.Initialized;
    };
    AWebRtcCall.prototype.Configure = function (config) {
        this.CheckDisposed();
        if (this.mState != CallState.Initialized) {
            throw new InvalidOperationException("Method can't be used in state " + this.mState);
        }
        this.mState = CallState.Configuring;
        Helper_1.SLog.Log("Enter state CallState.Configuring");
        this.mMediaConfig = config;
        this.mNetwork.Configure(this.mMediaConfig);
    };
    AWebRtcCall.prototype.Call = function (address) {
        this.CheckDisposed();
        if (this.mState != CallState.Initialized
            && this.mState != CallState.Configuring
            && this.mState != CallState.Configured) {
            throw new InvalidOperationException("Method can't be used in state " + this.mState);
        }
        if (this.mConferenceMode) {
            throw new InvalidOperationException("Method can't be used in conference calls.");
        }
        Helper_1.SLog.Log("Call to " + address);
        this.EnsureConfiguration();
        if (this.mState == CallState.Configured) {
            this.ProcessCall(address);
        }
        else {
            this.PendingCall(address);
        }
    };
    AWebRtcCall.prototype.Listen = function (address) {
        this.CheckDisposed();
        if (this.mState != CallState.Initialized
            && this.mState != CallState.Configuring
            && this.mState != CallState.Configured) {
            throw new InvalidOperationException("Method can't be used in state " + this.mState);
        }
        this.EnsureConfiguration();
        if (this.mState == CallState.Configured) {
            this.ProcessListen(address);
        }
        else {
            this.PendingListen(address);
        }
    };
    AWebRtcCall.prototype.Send = function (message, reliable, id) {
        this.CheckDisposed();
        if (reliable == null)
            reliable = true;
        if (id) {
            this.InternalSendTo(message, reliable, id);
        }
        else {
            this.InternalSendToAll(message, reliable);
        }
    };
    AWebRtcCall.prototype.InternalSendToAll = function (message, reliable) {
        var data = this.PackStringMsg(message);
        ;
        for (var _i = 0, _a = this.mConnectionInfo.GetIds(); _i < _a.length; _i++) {
            var id = _a[_i];
            Helper_1.SLog.L("Send message to " + id + "! " + message);
            this.InternalSendRawTo(data, new index_1.ConnectionId(id), reliable);
        }
    };
    AWebRtcCall.prototype.InternalSendTo = function (message, reliable, id) {
        var data = this.PackStringMsg(message);
        this.InternalSendRawTo(data, id, reliable);
    };
    AWebRtcCall.prototype.SendData = function (message, reliable, id) {
        this.CheckDisposed();
        var data = this.PackDataMsg(message);
        this.InternalSendRawTo(data, id, reliable);
    };
    AWebRtcCall.prototype.PackStringMsg = function (message) {
        var data = Helper_1.Encoding.UTF16.GetBytes(message);
        var buff = new Uint8Array(data.length + 1);
        buff[0] = this.MESSAGE_TYPE_STRING;
        for (var i = 0; i < data.length; i++) {
            buff[i + 1] = data[i];
        }
        return buff;
    };
    AWebRtcCall.prototype.UnpackStringMsg = function (message) {
        var buff = new Uint8Array(message.length - 1);
        for (var i = 0; i < buff.length; i++) {
            buff[i] = message[i + 1];
        }
        var res = Helper_1.Encoding.UTF16.GetString(buff);
        return res;
    };
    AWebRtcCall.prototype.PackDataMsg = function (data) {
        var buff = new Uint8Array(data.length + 1);
        buff[0] = this.MESSAGE_TYPE_DATA;
        for (var i = 0; i < data.length; i++) {
            buff[i + 1] = data[i];
        }
        return buff;
    };
    AWebRtcCall.prototype.UnpackDataMsg = function (message) {
        var buff = new Uint8Array(message.length - 1);
        for (var i = 0; i < buff.length; i++) {
            buff[i] = message[i + 1];
        }
        return buff;
    };
    AWebRtcCall.prototype.InternalSendRawTo = function (rawdata, id, reliable) {
        this.mNetwork.SendData(id, rawdata, reliable);
    };
    AWebRtcCall.prototype.Update = function () {
        if (this.mIsDisposed)
            return;
        if (this.mNetwork == null)
            return;
        this.mNetwork.Update();
        //waiting for the media configuration?
        if (this.mState == CallState.Configuring) {
            var configState = this.mNetwork.GetConfigurationState();
            if (configState == IMediaNetwork_1.MediaConfigurationState.Failed) {
                this.OnConfigurationFailed(this.mNetwork.GetConfigurationError());
                //bugfix: user might dispose the call during the event above
                if (this.mIsDisposed)
                    return;
                if (this.mNetwork != null)
                    this.mNetwork.ResetConfiguration();
            }
            else if (configState == IMediaNetwork_1.MediaConfigurationState.Successful) {
                this.OnConfigurationComplete();
                if (this.mIsDisposed)
                    return;
            }
        }
        var evt;
        while ((evt = this.mNetwork.Dequeue()) != null) {
            switch (evt.Type) {
                case index_1.NetEventType.NewConnection:
                    if (this.mState == CallState.WaitingForIncomingCall
                        || (this.mConferenceMode && this.mState == CallState.InCall)) //keep accepting connections after 
                     {
                        //remove ability to accept incoming connections
                        if (this.mConferenceMode == false)
                            this.mNetwork.StopServer();
                        this.mState = CallState.InCall;
                        this.mConnectionInfo.AddConnection(evt.ConnectionId, true);
                        this.TriggerCallEvent(new CallEventArgs_1.CallAcceptedEventArgs(evt.ConnectionId));
                        if (this.mIsDisposed)
                            return;
                    }
                    else if (this.mState == CallState.WaitingForOutgoingCall) {
                        this.mConnectionInfo.AddConnection(evt.ConnectionId, false);
                        //only possible in 1 on 1 calls
                        this.mState = CallState.InCall;
                        this.TriggerCallEvent(new CallEventArgs_1.CallAcceptedEventArgs(evt.ConnectionId));
                        if (this.mIsDisposed)
                            return;
                    }
                    else {
                        //Debug.Assert(mState == CallState.WaitingForIncomingCall || mState == CallState.WaitingForOutgoingCall);
                        Helper_1.SLog.LogWarning("Received incoming connection during invalid state " + this.mState);
                    }
                    break;
                case index_1.NetEventType.ConnectionFailed:
                    //call failed
                    if (this.mState == CallState.WaitingForOutgoingCall) {
                        this.TriggerCallEvent(new CallEventArgs_1.ErrorEventArgs(CallEventArgs_1.CallEventType.ConnectionFailed));
                        if (this.mIsDisposed)
                            return;
                        this.mState = CallState.Configured;
                    }
                    else {
                        //Debug.Assert(mState == CallState.WaitingForOutgoingCall);
                        Helper_1.SLog.LogError("Received ConnectionFailed during " + this.mState);
                    }
                    break;
                case index_1.NetEventType.Disconnected:
                    if (this.mConnectionInfo.HasConnection(evt.ConnectionId)) {
                        this.mConnectionInfo.RemConnection(evt.ConnectionId);
                        //call ended
                        if (this.mConferenceMode == false && this.mConnectionInfo.GetIds().length == 0) {
                            this.mState = CallState.Closed;
                        }
                        this.TriggerCallEvent(new CallEventArgs_1.CallEndedEventArgs(evt.ConnectionId));
                        if (this.mIsDisposed)
                            return;
                    }
                    break;
                case index_1.NetEventType.ServerInitialized:
                    //incoming calls possible
                    this.mServerInactive = false;
                    this.mState = CallState.WaitingForIncomingCall;
                    this.TriggerCallEvent(new CallEventArgs_1.WaitForIncomingCallEventArgs(evt.Info));
                    if (this.mIsDisposed)
                        return;
                    break;
                case index_1.NetEventType.ServerInitFailed:
                    this.mServerInactive = true;
                    //reset state to the earlier state which is Configured (as without configuration no
                    //listening possible). Local camera/audio will keep running
                    this.mState = CallState.Configured;
                    this.TriggerCallEvent(new CallEventArgs_1.ErrorEventArgs(CallEventArgs_1.CallEventType.ListeningFailed));
                    if (this.mIsDisposed)
                        return;
                    break;
                case index_1.NetEventType.ServerClosed:
                    this.mServerInactive = true;
                    //no incoming calls possible anymore
                    if (this.mState == CallState.WaitingForIncomingCall || this.mState == CallState.RequestingAddress) {
                        this.mState = CallState.Configured;
                        //might need to be handled as a special timeout event?
                        this.TriggerCallEvent(new CallEventArgs_1.ErrorEventArgs(CallEventArgs_1.CallEventType.ListeningFailed, CallEventArgs_1.CallErrorType.Unknown, "Server closed the connection while waiting for incoming calls."));
                        if (this.mIsDisposed)
                            return;
                    }
                    else {
                        //event is normal during other states as the server connection will be closed after receiving a call
                    }
                    break;
                case index_1.NetEventType.ReliableMessageReceived:
                case index_1.NetEventType.UnreliableMessageReceived:
                    var reliable = evt.Type === index_1.NetEventType.ReliableMessageReceived;
                    //chat message received
                    if (evt.MessageData.length >= 2) {
                        if (evt.MessageData[0] == this.MESSAGE_TYPE_STRING) {
                            var message = this.UnpackStringMsg(evt.MessageData);
                            this.TriggerCallEvent(new CallEventArgs_1.MessageEventArgs(evt.ConnectionId, message, reliable));
                        }
                        else if (evt.MessageData[0] == this.MESSAGE_TYPE_DATA) {
                            var message = this.UnpackDataMsg(evt.MessageData);
                            this.TriggerCallEvent(new CallEventArgs_1.DataMessageEventArgs(evt.ConnectionId, message, reliable));
                        }
                        else {
                            //invalid message?
                        }
                    }
                    else {
                        //invalid message?
                    }
                    if (this.mIsDisposed)
                        return;
                    break;
            }
        }
        var handleLocalFrames = true;
        var handleRemoteFrames = true;
        if (this.mMediaConfig.FrameUpdates && handleLocalFrames) {
            var localFrame = this.mNetwork.TryGetFrame(index_1.ConnectionId.INVALID);
            if (localFrame != null) {
                this.FrameToCallEvent(index_1.ConnectionId.INVALID, localFrame);
                if (this.mIsDisposed)
                    return;
            }
        }
        if (this.mMediaConfig.FrameUpdates && handleRemoteFrames) {
            for (var _i = 0, _a = this.mConnectionInfo.GetIds(); _i < _a.length; _i++) {
                var id = _a[_i];
                var conId = new index_1.ConnectionId(id);
                var remoteFrame = this.mNetwork.TryGetFrame(conId);
                if (remoteFrame != null) {
                    this.FrameToCallEvent(conId, remoteFrame);
                    if (this.mIsDisposed)
                        return;
                }
            }
        }
        var mediaEvent = null;
        while ((mediaEvent = this.mNetwork.DequeueMediaEvent()) != null) {
            this.MediaEventToCallEvent(mediaEvent);
        }
        this.mNetwork.Flush();
    };
    AWebRtcCall.prototype.FrameToCallEvent = function (id, frame) {
        var args = new CallEventArgs_1.FrameUpdateEventArgs(id, frame);
        this.TriggerCallEvent(args);
    };
    AWebRtcCall.prototype.MediaEventToCallEvent = function (evt) {
        var videoElement = null;
        if (evt.EventType == evt.EventType) {
            var args = new CallEventArgs_1.MediaUpdatedEventArgs(evt.ConnectionId, evt.Args);
            this.TriggerCallEvent(args);
        }
    };
    AWebRtcCall.prototype.PendingCall = function (address) {
        this.mPendingAddress = address;
        this.mPendingCallCall = true;
        this.mPendingListenCall = false;
    };
    AWebRtcCall.prototype.ProcessCall = function (address) {
        this.mState = CallState.WaitingForOutgoingCall;
        this.mNetwork.Connect(address);
        this.ClearPending();
    };
    AWebRtcCall.prototype.PendingListen = function (address) {
        this.mPendingAddress = address;
        this.mPendingCallCall = false;
        this.mPendingListenCall = true;
    };
    AWebRtcCall.prototype.ProcessListen = function (address) {
        Helper_1.SLog.Log("Listen at " + address);
        this.mServerInactive = false;
        this.mState = CallState.RequestingAddress;
        this.mNetwork.StartServer(address);
        this.ClearPending();
    };
    AWebRtcCall.prototype.DoPending = function () {
        if (this.mPendingCallCall) {
            this.ProcessCall(this.mPendingAddress);
        }
        else if (this.mPendingListenCall) {
            this.ProcessListen(this.mPendingAddress);
        }
        this.ClearPending();
    };
    AWebRtcCall.prototype.ClearPending = function () {
        this.mPendingAddress = null;
        this.mPendingCallCall = null;
        this.mPendingListenCall = null;
    };
    AWebRtcCall.prototype.CheckDisposed = function () {
        if (this.mIsDisposed)
            throw new InvalidOperationException("Object is disposed. No method calls possible.");
    };
    AWebRtcCall.prototype.EnsureConfiguration = function () {
        if (this.mState == CallState.Initialized) {
            Helper_1.SLog.Log("Use default configuration");
            this.Configure(new MediaConfig_1.MediaConfig());
        }
        else {
        }
    };
    AWebRtcCall.prototype.TriggerCallEvent = function (args) {
        var arr = this.mCallEventHandlers.slice();
        for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
            var callback = arr_1[_i];
            callback(this, args);
        }
    };
    AWebRtcCall.prototype.OnConfigurationComplete = function () {
        if (this.mIsDisposed)
            return;
        this.mState = CallState.Configured;
        Helper_1.SLog.Log("Enter state CallState.Configured");
        this.TriggerCallEvent(new CallEventArgs_1.CallEventArgs(CallEventArgs_1.CallEventType.ConfigurationComplete));
        if (this.mIsDisposed == false)
            this.DoPending();
    };
    AWebRtcCall.prototype.OnConfigurationFailed = function (error) {
        Helper_1.SLog.LogWarning("Configuration failed: " + error);
        if (this.mIsDisposed)
            return;
        this.mState = CallState.Initialized;
        this.TriggerCallEvent(new CallEventArgs_1.ErrorEventArgs(CallEventArgs_1.CallEventType.ConfigurationFailed, CallEventArgs_1.CallErrorType.Unknown, error));
        //bugfix: user might dispose the call during the event above
        if (this.mIsDisposed == false)
            this.ClearPending();
    };
    AWebRtcCall.prototype.DisposeInternal = function (disposing) {
        //nothing to dispose but subclasses overwrite this
        if (!this.mIsDisposed) {
            if (disposing) {
            }
            this.mIsDisposed = true;
        }
    };
    AWebRtcCall.prototype.Dispose = function () {
        this.DisposeInternal(true);
    };
    return AWebRtcCall;
}());
exports.AWebRtcCall = AWebRtcCall;

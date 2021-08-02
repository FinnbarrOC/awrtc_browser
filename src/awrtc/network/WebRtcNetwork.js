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
exports.WebRtcNetwork = exports.WebRtcNetworkServerState = void 0;
//import {ConnectionId, NetworkEvent, NetEventType, IBasicNetwork} from './INetwork'
var index_1 = require("./index");
var Helper_1 = require("./Helper");
var WebRtcNetworkServerState;
(function (WebRtcNetworkServerState) {
    WebRtcNetworkServerState[WebRtcNetworkServerState["Invalid"] = 0] = "Invalid";
    WebRtcNetworkServerState[WebRtcNetworkServerState["Offline"] = 1] = "Offline";
    WebRtcNetworkServerState[WebRtcNetworkServerState["Starting"] = 2] = "Starting";
    WebRtcNetworkServerState[WebRtcNetworkServerState["Online"] = 3] = "Online";
})(WebRtcNetworkServerState = exports.WebRtcNetworkServerState || (exports.WebRtcNetworkServerState = {}));
/// <summary>
/// Native version of WebRtc
/// 
/// Make sure to use Shutdown before unity quits! (unity will probably get stuck without it)
/// 
/// 
/// </summary>
var WebRtcNetwork = /** @class */ (function () {
    //public
    function WebRtcNetwork(signalingConfig, lRtcConfig) {
        this.mTimeout = 60000;
        this.mInSignaling = {};
        this.mNextId = new index_1.ConnectionId(1);
        this.mSignaling = null;
        this.mEvents = new Helper_1.Queue();
        this.mIdToConnection = {};
        //must be the same as the hashmap and later returned read only (avoids copies)
        this.mConnectionIds = new Array();
        this.mServerState = WebRtcNetworkServerState.Offline;
        this.mIsDisposed = false;
        this.mSignaling = signalingConfig;
        this.mSignalingNetwork = this.mSignaling.GetNetwork();
        this.mRtcConfig = lRtcConfig;
    }
    Object.defineProperty(WebRtcNetwork.prototype, "IdToConnection", {
        get: function () {
            return this.mIdToConnection;
        },
        enumerable: false,
        configurable: true
    });
    //only for internal use
    WebRtcNetwork.prototype.GetConnections = function () {
        return this.mConnectionIds;
    };
    //just for debugging / testing
    WebRtcNetwork.prototype.SetLog = function (logDel) {
        this.mLogDelegate = logDel;
    };
    WebRtcNetwork.prototype.StartServer = function (address) {
        this.StartServerInternal(address);
    };
    WebRtcNetwork.prototype.StartServerInternal = function (address) {
        this.mServerState = WebRtcNetworkServerState.Starting;
        this.mSignalingNetwork.StartServer(address);
    };
    WebRtcNetwork.prototype.StopServer = function () {
        if (this.mServerState == WebRtcNetworkServerState.Starting) {
            this.mSignalingNetwork.StopServer();
            //removed. the underlaying sygnaling network should set those values
            //this.mServerState = WebRtcNetworkServerState.Offline;
            //this.mEvents.Enqueue(new NetworkEvent(NetEventType.ServerInitFailed, ConnectionId.INVALID, null));
        }
        else if (this.mServerState == WebRtcNetworkServerState.Online) {
            //dont wait for confirmation
            this.mSignalingNetwork.StopServer();
            //removed. the underlaying sygnaling network should set those values
            //this.mServerState = WebRtcNetworkServerState.Offline;
            //this.mEvents.Enqueue(new NetworkEvent(NetEventType.ServerClosed, ConnectionId.INVALID, null));
        }
    };
    WebRtcNetwork.prototype.Connect = function (address) {
        return this.AddOutgoingConnection(address);
    };
    WebRtcNetwork.prototype.Update = function () {
        this.CheckSignalingState();
        this.UpdateSignalingNetwork();
        this.UpdatePeers();
    };
    WebRtcNetwork.prototype.Dequeue = function () {
        if (this.mEvents.Count() > 0)
            return this.mEvents.Dequeue();
        return null;
    };
    WebRtcNetwork.prototype.Peek = function () {
        if (this.mEvents.Count() > 0)
            return this.mEvents.Peek();
        return null;
    };
    WebRtcNetwork.prototype.Flush = function () {
        this.mSignalingNetwork.Flush();
    };
    WebRtcNetwork.prototype.SendData = function (id, data /*, offset : number, length : number*/, reliable) {
        if (id == null || data == null || data.length == 0)
            return;
        var peer = this.mIdToConnection[id.id];
        if (peer) {
            return peer.SendData(data, /* offset, length,*/ reliable);
        }
        else {
            Helper_1.SLog.LogWarning("unknown connection id");
            return false;
        }
    };
    WebRtcNetwork.prototype.GetBufferedAmount = function (id, reliable) {
        var peer = this.mIdToConnection[id.id];
        if (peer) {
            return peer.GetBufferedAmount(reliable);
        }
        else {
            Helper_1.SLog.LogWarning("unknown connection id");
            return -1;
        }
    };
    WebRtcNetwork.prototype.Disconnect = function (id) {
        var peer = this.mIdToConnection[id.id];
        if (peer) {
            this.HandleDisconnect(id);
        }
    };
    WebRtcNetwork.prototype.Shutdown = function () {
        //bugfix. Make copy before the loop as Disconnect changes the original mConnectionIds array
        var ids = this.mConnectionIds.slice();
        for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
            var id = ids_1[_i];
            this.Disconnect(id);
        }
        this.StopServer();
        this.mSignalingNetwork.Shutdown();
    };
    WebRtcNetwork.prototype.DisposeInternal = function () {
        if (this.mIsDisposed == false) {
            this.Shutdown();
            this.mIsDisposed = true;
        }
    };
    WebRtcNetwork.prototype.Dispose = function () {
        this.DisposeInternal();
    };
    //protected
    WebRtcNetwork.prototype.CreatePeer = function (peerId, rtcConfig) {
        var peer = new index_1.WebRtcDataPeer(peerId, rtcConfig);
        return peer;
    };
    //private
    WebRtcNetwork.prototype.CheckSignalingState = function () {
        var connected = new Array();
        var failed = new Array();
        //update the signaling channels
        for (var key in this.mInSignaling) {
            var peer = this.mInSignaling[key];
            peer.Update();
            var timeAlive = peer.SignalingInfo.GetCreationTimeMs();
            var msg = new Helper_1.Output();
            while (peer.DequeueSignalingMessage(msg)) {
                var buffer = this.StringToBuffer(msg.val);
                this.mSignalingNetwork.SendData(new index_1.ConnectionId(+key), buffer, true);
            }
            if (peer.GetState() == index_1.WebRtcPeerState.Connected) {
                connected.push(peer.SignalingInfo.ConnectionId);
            }
            else if (peer.GetState() == index_1.WebRtcPeerState.SignalingFailed || timeAlive > this.mTimeout) {
                failed.push(peer.SignalingInfo.ConnectionId);
            }
        }
        for (var _i = 0, connected_1 = connected; _i < connected_1.length; _i++) {
            var v = connected_1[_i];
            this.ConnectionEstablished(v);
        }
        for (var _a = 0, failed_1 = failed; _a < failed_1.length; _a++) {
            var v = failed_1[_a];
            this.SignalingFailed(v);
        }
    };
    WebRtcNetwork.prototype.UpdateSignalingNetwork = function () {
        //update the signaling system
        this.mSignalingNetwork.Update();
        var evt;
        while ((evt = this.mSignalingNetwork.Dequeue()) != null) {
            if (evt.Type == index_1.NetEventType.ServerInitialized) {
                this.mServerState = WebRtcNetworkServerState.Online;
                this.mEvents.Enqueue(new index_1.NetworkEvent(index_1.NetEventType.ServerInitialized, index_1.ConnectionId.INVALID, evt.RawData));
            }
            else if (evt.Type == index_1.NetEventType.ServerInitFailed) {
                this.mServerState = WebRtcNetworkServerState.Offline;
                this.mEvents.Enqueue(new index_1.NetworkEvent(index_1.NetEventType.ServerInitFailed, index_1.ConnectionId.INVALID, evt.RawData));
            }
            else if (evt.Type == index_1.NetEventType.ServerClosed) {
                this.mServerState = WebRtcNetworkServerState.Offline;
                this.mEvents.Enqueue(new index_1.NetworkEvent(index_1.NetEventType.ServerClosed, index_1.ConnectionId.INVALID, evt.RawData));
            }
            else if (evt.Type == index_1.NetEventType.NewConnection) {
                //check if new incoming connection or an outgoing was established
                var peer = this.mInSignaling[evt.ConnectionId.id];
                if (peer) {
                    peer.StartSignaling();
                }
                else {
                    this.AddIncomingConnection(evt.ConnectionId);
                }
            }
            else if (evt.Type == index_1.NetEventType.ConnectionFailed) {
                //Outgoing connection failed
                this.SignalingFailed(evt.ConnectionId);
            }
            else if (evt.Type == index_1.NetEventType.Disconnected) {
                var peer = this.mInSignaling[evt.ConnectionId.id];
                if (peer) {
                    peer.SignalingInfo.SignalingDisconnected();
                }
                //if signaling was completed this isn't a problem
                //SignalingDisconnected(evt.ConnectionId);
                //do nothing. either webrtc has enough information to connect already
                //or it will wait forever for the information -> after 30 sec we give up
            }
            else if (evt.Type == index_1.NetEventType.ReliableMessageReceived) {
                var peer = this.mInSignaling[evt.ConnectionId.id];
                if (peer) {
                    var msg = this.BufferToString(evt.MessageData);
                    peer.AddSignalingMessage(msg);
                }
                else {
                    Helper_1.SLog.LogWarning("Signaling message from unknown connection received");
                }
            }
        }
    };
    WebRtcNetwork.prototype.UpdatePeers = function () {
        //every peer has a queue storing incoming messages to avoid multi threading problems -> handle it now
        var disconnected = new Array();
        for (var key in this.mIdToConnection) {
            var peer = this.mIdToConnection[key];
            peer.Update();
            var ev = new Helper_1.Output();
            while (peer.DequeueEvent(/*out*/ ev)) {
                this.mEvents.Enqueue(ev.val);
            }
            if (peer.GetState() == index_1.WebRtcPeerState.Closed) {
                disconnected.push(peer.ConnectionId);
            }
        }
        for (var _i = 0, disconnected_1 = disconnected; _i < disconnected_1.length; _i++) {
            var key_1 = disconnected_1[_i];
            this.HandleDisconnect(key_1);
        }
    };
    WebRtcNetwork.prototype.AddOutgoingConnection = function (address) {
        var signalingConId = this.mSignalingNetwork.Connect(address);
        Helper_1.SLog.L("new outgoing connection");
        var info = new index_1.SignalingInfo(signalingConId, false, Date.now());
        var peer = this.CreatePeer(this.NextConnectionId(), this.mRtcConfig);
        peer.SetSignalingInfo(info);
        this.mInSignaling[signalingConId.id] = peer;
        return peer.ConnectionId;
    };
    WebRtcNetwork.prototype.AddIncomingConnection = function (signalingConId) {
        Helper_1.SLog.L("new incoming connection");
        var info = new index_1.SignalingInfo(signalingConId, true, Date.now());
        var peer = this.CreatePeer(this.NextConnectionId(), this.mRtcConfig);
        peer.SetSignalingInfo(info);
        this.mInSignaling[signalingConId.id] = peer;
        //passive way of starting signaling -> send out random number. if the other one does the same
        //the one with the highest number starts signaling
        peer.NegotiateSignaling();
        return peer.ConnectionId;
    };
    WebRtcNetwork.prototype.ConnectionEstablished = function (signalingConId) {
        var peer = this.mInSignaling[signalingConId.id];
        delete this.mInSignaling[signalingConId.id];
        this.mSignalingNetwork.Disconnect(signalingConId);
        this.mConnectionIds.push(peer.ConnectionId);
        this.mIdToConnection[peer.ConnectionId.id] = peer;
        this.mEvents.Enqueue(new index_1.NetworkEvent(index_1.NetEventType.NewConnection, peer.ConnectionId, null));
    };
    WebRtcNetwork.prototype.SignalingFailed = function (signalingConId) {
        var peer = this.mInSignaling[signalingConId.id];
        if (peer) {
            //connection was still believed to be in signaling -> notify the user of the event
            delete this.mInSignaling[signalingConId.id];
            this.mEvents.Enqueue(new index_1.NetworkEvent(index_1.NetEventType.ConnectionFailed, peer.ConnectionId, null));
            if (peer.SignalingInfo.IsSignalingConnected()) {
                this.mSignalingNetwork.Disconnect(signalingConId);
            }
            peer.Dispose();
        }
    };
    WebRtcNetwork.prototype.HandleDisconnect = function (id) {
        var peer = this.mIdToConnection[id.id];
        if (peer) {
            peer.Dispose();
        }
        //search for the index to remove the id (user might provide a different object with the same id
        //don't use indexOf!
        var index = this.mConnectionIds.findIndex(function (e) { return e.id == id.id; });
        if (index != -1) {
            this.mConnectionIds.splice(index, 1);
            delete this.mIdToConnection[id.id];
        }
        var ev = new index_1.NetworkEvent(index_1.NetEventType.Disconnected, id, null);
        this.mEvents.Enqueue(ev);
    };
    WebRtcNetwork.prototype.NextConnectionId = function () {
        var id = new index_1.ConnectionId(this.mNextId.id);
        this.mNextId.id++;
        return id;
    };
    WebRtcNetwork.prototype.StringToBuffer = function (str) {
        var buf = new ArrayBuffer(str.length * 2);
        var bufView = new Uint16Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        var result = new Uint8Array(buf);
        return result;
    };
    WebRtcNetwork.prototype.BufferToString = function (buffer) {
        var arr = new Uint16Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 2);
        return String.fromCharCode.apply(null, arr);
    };
    return WebRtcNetwork;
}());
exports.WebRtcNetwork = WebRtcNetwork;

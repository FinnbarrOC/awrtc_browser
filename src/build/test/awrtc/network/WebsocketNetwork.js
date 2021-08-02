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
import { ConnectionId, NetworkEvent, NetEventType } from './INetwork';
import { SLog } from './Helper';
export var WebsocketConnectionStatus;
(function (WebsocketConnectionStatus) {
    WebsocketConnectionStatus[WebsocketConnectionStatus["Uninitialized"] = 0] = "Uninitialized";
    WebsocketConnectionStatus[WebsocketConnectionStatus["NotConnected"] = 1] = "NotConnected";
    WebsocketConnectionStatus[WebsocketConnectionStatus["Connecting"] = 2] = "Connecting";
    WebsocketConnectionStatus[WebsocketConnectionStatus["Connected"] = 3] = "Connected";
    WebsocketConnectionStatus[WebsocketConnectionStatus["Disconnecting"] = 4] = "Disconnecting"; //server will shut down, all clients disconnect, ...
})(WebsocketConnectionStatus || (WebsocketConnectionStatus = {}));
export var WebsocketServerStatus;
(function (WebsocketServerStatus) {
    WebsocketServerStatus[WebsocketServerStatus["Offline"] = 0] = "Offline";
    WebsocketServerStatus[WebsocketServerStatus["Starting"] = 1] = "Starting";
    WebsocketServerStatus[WebsocketServerStatus["Online"] = 2] = "Online";
    WebsocketServerStatus[WebsocketServerStatus["ShuttingDown"] = 3] = "ShuttingDown";
})(WebsocketServerStatus || (WebsocketServerStatus = {}));
//TODO: handle errors if the socket connection failed
//+ send back failed events for connected / serverstart events that are buffered
var WebsocketNetwork = /** @class */ (function () {
    function WebsocketNetwork(url, configuration) {
        //currents status. will be updated based on update call
        this.mStatus = WebsocketConnectionStatus.Uninitialized;
        //queue to hold buffered outgoing messages
        this.mOutgoingQueue = new Array();
        //buffer for incoming messages
        this.mIncomingQueue = new Array();
        //Status of the server for incoming connections
        this.mServerStatus = WebsocketServerStatus.Offline;
        //outgoing connections (just need to be stored to allow to send out a failed message
        //if the whole signaling connection fails
        this.mConnecting = new Array();
        this.mConnections = new Array();
        //next free connection id
        this.mNextOutgoingConnectionId = new ConnectionId(1);
        /// <summary>
        /// Assume 1 until message received
        /// </summary>
        this.mRemoteProtocolVersion = 1;
        this.mUrl = null;
        this.mHeartbeatReceived = true;
        this.mIsDisposed = false;
        this.mUrl = url;
        this.mStatus = WebsocketConnectionStatus.NotConnected;
        this.mConfig = configuration;
        if (!this.mConfig)
            this.mConfig = new WebsocketNetwork.Configuration();
        this.mConfig.Lock();
    }
    WebsocketNetwork.prototype.getStatus = function () { return this.mStatus; };
    ;
    WebsocketNetwork.prototype.WebsocketConnect = function () {
        var _this = this;
        this.mStatus = WebsocketConnectionStatus.Connecting;
        this.mSocket = new WebSocket(this.mUrl);
        this.mSocket.binaryType = "arraybuffer";
        this.mSocket.onopen = function () { _this.OnWebsocketOnOpen(); };
        this.mSocket.onerror = function (error) { _this.OnWebsocketOnError(error); };
        this.mSocket.onmessage = function (e) { _this.OnWebsocketOnMessage(e); };
        this.mSocket.onclose = function (e) { _this.OnWebsocketOnClose(e); };
    };
    WebsocketNetwork.prototype.WebsocketCleanup = function () {
        this.mSocket.onopen = null;
        this.mSocket.onerror = null;
        this.mSocket.onmessage = null;
        this.mSocket.onclose = null;
        if (this.mSocket.readyState == this.mSocket.OPEN
            || this.mSocket.readyState == this.mSocket.CONNECTING) {
            this.mSocket.close();
        }
        this.mSocket = null;
    };
    WebsocketNetwork.prototype.EnsureServerConnection = function () {
        if (this.mStatus == WebsocketConnectionStatus.NotConnected) {
            //no server
            //no connection about to be established
            //no current connections
            //-> disconnect the server connection
            this.WebsocketConnect();
        }
    };
    WebsocketNetwork.prototype.UpdateHeartbeat = function () {
        if (this.mStatus == WebsocketConnectionStatus.Connected && this.mConfig.Heartbeat > 0) {
            var diff = Date.now() - this.mLastHeartbeat;
            if (diff > (this.mConfig.Heartbeat * 1000)) {
                //We trigger heatbeat timeouts only for protocol V2
                //protocol 1 can receive the heatbeats but 
                //won't send a reply
                //(still helpful to trigger TCP ACK timeout)
                if (this.mRemoteProtocolVersion > 1
                    && this.mHeartbeatReceived == false) {
                    this.TriggerHeartbeatTimeout();
                    return;
                }
                this.mLastHeartbeat = Date.now();
                this.mHeartbeatReceived = false;
                this.SendHeartbeat();
            }
        }
    };
    WebsocketNetwork.prototype.TriggerHeartbeatTimeout = function () {
        SLog.L("Closing due to heartbeat timeout. Server didn't respond in time.", WebsocketNetwork.LOGTAG);
        this.Cleanup();
    };
    WebsocketNetwork.prototype.CheckSleep = function () {
        if (this.mStatus == WebsocketConnectionStatus.Connected
            && this.mServerStatus == WebsocketServerStatus.Offline
            && this.mConnecting.length == 0
            && this.mConnections.length == 0) {
            //no server
            //no connection about to be established
            //no current connections
            //-> disconnect the server connection
            this.Cleanup();
        }
    };
    WebsocketNetwork.prototype.OnWebsocketOnOpen = function () {
        SLog.L('onWebsocketOnOpen', WebsocketNetwork.LOGTAG);
        this.mStatus = WebsocketConnectionStatus.Connected;
        this.mLastHeartbeat = Date.now();
        this.SendVersion();
    };
    WebsocketNetwork.prototype.OnWebsocketOnClose = function (event) {
        SLog.L('Closed: ' + JSON.stringify(event), WebsocketNetwork.LOGTAG);
        if (event.code != 1000) {
            SLog.LE("Websocket closed with code: " + event.code + " " + event.reason);
        }
        //ignore closed event if it was caused due to a shutdown (as that means we cleaned up already)
        if (this.mStatus == WebsocketConnectionStatus.Disconnecting
            || this.mStatus == WebsocketConnectionStatus.NotConnected)
            return;
        this.Cleanup();
        this.mStatus = WebsocketConnectionStatus.NotConnected;
    };
    WebsocketNetwork.prototype.OnWebsocketOnMessage = function (event) {
        if (this.mStatus == WebsocketConnectionStatus.Disconnecting
            || this.mStatus == WebsocketConnectionStatus.NotConnected)
            return;
        //browsers will have ArrayBuffer in event.data -> change to byte array
        var msg = new Uint8Array(event.data);
        this.ParseMessage(msg);
    };
    WebsocketNetwork.prototype.OnWebsocketOnError = function (error) {
        //the error event doesn't seem to have any useful information?
        //browser is expected to call OnClose after this
        SLog.LE('WebSocket Error ' + error);
    };
    /// <summary>
    /// called during Disconnecting state either trough server connection failed or due to Shutdown
    /// 
    /// Also used to switch to sleeping mode. In this case there connection isn't used as
    /// server and doesn't have any connections (established or connecting) thus
    /// only WebsocketCleanup is in effect.
    /// 
    /// WebsocketNetwork has to be still usable after this call like a newly
    /// created connections (except with events in the message queue)
    /// </summary>
    WebsocketNetwork.prototype.Cleanup = function () {
        //check if this was done already (or we are in the process of cleanup already)
        if (this.mStatus == WebsocketConnectionStatus.Disconnecting
            || this.mStatus == WebsocketConnectionStatus.NotConnected)
            return;
        this.mStatus = WebsocketConnectionStatus.Disconnecting;
        //throw connection failed events for each connection in mConnecting
        for (var _i = 0, _a = this.mConnecting; _i < _a.length; _i++) {
            var conId = _a[_i];
            //all connection it tries to establish right now fail due to shutdown
            this.EnqueueIncoming(new NetworkEvent(NetEventType.ConnectionFailed, new ConnectionId(conId), null));
        }
        this.mConnecting = new Array();
        //throw disconnect events for all NewConnection events in the outgoing queue
        //ignore messages and everything else
        for (var _b = 0, _c = this.mConnections; _b < _c.length; _b++) {
            var conId = _c[_b];
            //all connection it tries to establish right now fail due to shutdown
            this.EnqueueIncoming(new NetworkEvent(NetEventType.Disconnected, new ConnectionId(conId), null));
        }
        this.mConnections = new Array();
        if (this.mServerStatus == WebsocketServerStatus.Starting) {
            //if server was Starting -> throw failed event
            this.EnqueueIncoming(new NetworkEvent(NetEventType.ServerInitFailed, ConnectionId.INVALID, null));
        }
        else if (this.mServerStatus == WebsocketServerStatus.Online) {
            //if server was Online -> throw close event
            this.EnqueueIncoming(new NetworkEvent(NetEventType.ServerClosed, ConnectionId.INVALID, null));
        }
        else if (this.mServerStatus == WebsocketServerStatus.ShuttingDown) {
            //if server was ShuttingDown -> throw close event (don't think this can happen)
            this.EnqueueIncoming(new NetworkEvent(NetEventType.ServerClosed, ConnectionId.INVALID, null));
        }
        this.mServerStatus = WebsocketServerStatus.Offline;
        this.mOutgoingQueue = new Array();
        this.WebsocketCleanup();
        this.mStatus = WebsocketConnectionStatus.NotConnected;
    };
    WebsocketNetwork.prototype.EnqueueOutgoing = function (evt) {
        this.mOutgoingQueue.push(evt);
    };
    WebsocketNetwork.prototype.EnqueueIncoming = function (evt) {
        this.mIncomingQueue.push(evt);
    };
    WebsocketNetwork.prototype.TryRemoveConnecting = function (id) {
        var index = this.mConnecting.indexOf(id.id);
        if (index != -1) {
            this.mConnecting.splice(index, 1);
        }
    };
    WebsocketNetwork.prototype.TryRemoveConnection = function (id) {
        var index = this.mConnections.indexOf(id.id);
        if (index != -1) {
            this.mConnections.splice(index, 1);
        }
    };
    WebsocketNetwork.prototype.ParseMessage = function (msg) {
        if (msg.length == 0) {
        }
        else if (msg[0] == NetEventType.MetaVersion) {
            if (msg.length > 1) {
                this.mRemoteProtocolVersion = msg[1];
            }
            else {
                SLog.LW("Received an invalid MetaVersion header without content.");
            }
        }
        else if (msg[0] == NetEventType.MetaHeartbeat) {
            this.mHeartbeatReceived = true;
        }
        else {
            var evt = NetworkEvent.fromByteArray(msg);
            this.HandleIncomingEvent(evt);
        }
    };
    WebsocketNetwork.prototype.HandleIncomingEvent = function (evt) {
        if (evt.Type == NetEventType.NewConnection) {
            //removing connecting info
            this.TryRemoveConnecting(evt.ConnectionId);
            //add connection
            this.mConnections.push(evt.ConnectionId.id);
        }
        else if (evt.Type == NetEventType.ConnectionFailed) {
            //remove connecting info
            this.TryRemoveConnecting(evt.ConnectionId);
        }
        else if (evt.Type == NetEventType.Disconnected) {
            //remove from connections
            this.TryRemoveConnection(evt.ConnectionId);
        }
        else if (evt.Type == NetEventType.ServerInitialized) {
            this.mServerStatus = WebsocketServerStatus.Online;
        }
        else if (evt.Type == NetEventType.ServerInitFailed) {
            this.mServerStatus = WebsocketServerStatus.Offline;
        }
        else if (evt.Type == NetEventType.ServerClosed) {
            this.mServerStatus = WebsocketServerStatus.ShuttingDown;
            //any cleaning up to do?
            this.mServerStatus = WebsocketServerStatus.Offline;
        }
        this.EnqueueIncoming(evt);
    };
    WebsocketNetwork.prototype.HandleOutgoingEvents = function () {
        while (this.mOutgoingQueue.length > 0) {
            var evt = this.mOutgoingQueue.shift();
            this.SendNetworkEvent(evt);
        }
    };
    WebsocketNetwork.prototype.SendHeartbeat = function () {
        var msg = new Uint8Array(1);
        msg[0] = NetEventType.MetaHeartbeat;
        this.InternalSend(msg);
    };
    WebsocketNetwork.prototype.SendVersion = function () {
        var msg = new Uint8Array(2);
        msg[0] = NetEventType.MetaVersion;
        msg[1] = WebsocketNetwork.PROTOCOL_VERSION;
        this.InternalSend(msg);
    };
    WebsocketNetwork.prototype.SendNetworkEvent = function (evt) {
        var msg = NetworkEvent.toByteArray(evt);
        this.InternalSend(msg);
    };
    WebsocketNetwork.prototype.InternalSend = function (msg) {
        this.mSocket.send(msg);
    };
    WebsocketNetwork.prototype.NextConnectionId = function () {
        var result = this.mNextOutgoingConnectionId;
        this.mNextOutgoingConnectionId = new ConnectionId(this.mNextOutgoingConnectionId.id + 1);
        return result;
    };
    WebsocketNetwork.prototype.GetRandomKey = function () {
        var result = "";
        for (var i = 0; i < 7; i++) {
            result += String.fromCharCode(65 + Math.round(Math.random() * 25));
        }
        return result;
    };
    //interface implementation
    WebsocketNetwork.prototype.Dequeue = function () {
        if (this.mIncomingQueue.length > 0)
            return this.mIncomingQueue.shift();
        return null;
    };
    WebsocketNetwork.prototype.Peek = function () {
        if (this.mIncomingQueue.length > 0)
            return this.mIncomingQueue[0];
        return null;
    };
    WebsocketNetwork.prototype.Update = function () {
        this.UpdateHeartbeat();
        this.CheckSleep();
    };
    WebsocketNetwork.prototype.Flush = function () {
        //ideally we buffer everything and then flush when it is connected as
        //websockets aren't suppose to be used for realtime communication anyway
        if (this.mStatus == WebsocketConnectionStatus.Connected)
            this.HandleOutgoingEvents();
    };
    WebsocketNetwork.prototype.SendData = function (id, data, /*offset: number, length: number,*/ reliable) {
        if (id == null || id.id == ConnectionId.INVALID.id) {
            SLog.LW("Ignored message. Invalid connection id.");
            return;
        }
        if (data == null || data.length == 0) {
            SLog.LW("Ignored message. Invalid data.");
            return;
        }
        var evt;
        if (reliable) {
            evt = new NetworkEvent(NetEventType.ReliableMessageReceived, id, data);
        }
        else {
            evt = new NetworkEvent(NetEventType.UnreliableMessageReceived, id, data);
        }
        this.EnqueueOutgoing(evt);
        return true;
    };
    WebsocketNetwork.prototype.Disconnect = function (id) {
        var evt = new NetworkEvent(NetEventType.Disconnected, id, null);
        this.EnqueueOutgoing(evt);
    };
    WebsocketNetwork.prototype.Shutdown = function () {
        this.Cleanup();
        this.mStatus = WebsocketConnectionStatus.NotConnected;
    };
    WebsocketNetwork.prototype.Dispose = function () {
        if (this.mIsDisposed == false) {
            this.Shutdown();
            this.mIsDisposed = true;
        }
    };
    WebsocketNetwork.prototype.StartServer = function (address) {
        if (address == null) {
            address = "" + this.GetRandomKey();
        }
        if (this.mServerStatus == WebsocketServerStatus.Offline) {
            this.EnsureServerConnection();
            this.mServerStatus = WebsocketServerStatus.Starting;
            //TODO: address is a string but ubytearray is defined. will fail if binary
            this.EnqueueOutgoing(new NetworkEvent(NetEventType.ServerInitialized, ConnectionId.INVALID, address));
        }
        else {
            this.EnqueueIncoming(new NetworkEvent(NetEventType.ServerInitFailed, ConnectionId.INVALID, address));
        }
    };
    WebsocketNetwork.prototype.StopServer = function () {
        this.EnqueueOutgoing(new NetworkEvent(NetEventType.ServerClosed, ConnectionId.INVALID, null));
    };
    WebsocketNetwork.prototype.Connect = function (address) {
        this.EnsureServerConnection();
        var newConId = this.NextConnectionId();
        this.mConnecting.push(newConId.id);
        var evt = new NetworkEvent(NetEventType.NewConnection, newConId, address);
        this.EnqueueOutgoing(evt);
        return newConId;
    };
    WebsocketNetwork.LOGTAG = "WebsocketNetwork";
    /// <summary>
    /// Version of the protocol implemented here
    /// </summary>
    WebsocketNetwork.PROTOCOL_VERSION = 2;
    /// <summary>
    /// Minimal protocol version that is still supported.
    /// V 1 servers won't understand heartbeat and version
    /// messages but would just log an unknown message and
    /// continue normally.
    /// </summary>
    WebsocketNetwork.PROTOCOL_VERSION_MIN = 1;
    return WebsocketNetwork;
}());
export { WebsocketNetwork };
(function (WebsocketNetwork) {
    var Configuration = /** @class */ (function () {
        function Configuration() {
            this.mHeartbeat = 30;
            this.mLocked = false;
        }
        Object.defineProperty(Configuration.prototype, "Heartbeat", {
            get: function () {
                return this.mHeartbeat;
            },
            set: function (value) {
                if (this.mLocked) {
                    throw new Error("Can't change configuration once used.");
                }
                this.mHeartbeat = value;
            },
            enumerable: false,
            configurable: true
        });
        Configuration.prototype.Lock = function () {
            this.mLocked = true;
        };
        return Configuration;
    }());
    WebsocketNetwork.Configuration = Configuration;
})(WebsocketNetwork || (WebsocketNetwork = {}));
//Below tests only. Move out later
function bufferToString(buffer) {
    var arr = new Uint16Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 2);
    return String.fromCharCode.apply(null, arr);
}
function stringToBuffer(str) {
    var buf = new ArrayBuffer(str.length * 2);
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    var result = new Uint8Array(buf);
    return result;
}
//# sourceMappingURL=WebsocketNetwork.js.map
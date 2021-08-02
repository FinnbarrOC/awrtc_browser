"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalNetwork = void 0;
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
var index_1 = require("./index");
var Helper_1 = require("./Helper");
/**Helper to simulate the WebsocketNetwork or WebRtcNetwork
 * within a local application without
 * any actual network components.
 *
 * This implementation might lack some features.
 */
var LocalNetwork = /** @class */ (function () {
    function LocalNetwork() {
        this.mNextNetworkId = new index_1.ConnectionId(1);
        this.mServerAddress = null;
        this.mEvents = new Helper_1.Queue();
        this.mConnectionNetwork = {};
        this.mIsDisposed = false;
        this.mId = LocalNetwork.sNextId;
        LocalNetwork.sNextId++;
    }
    Object.defineProperty(LocalNetwork.prototype, "IsServer", {
        get: function () {
            return this.mServerAddress != null;
        },
        enumerable: false,
        configurable: true
    });
    LocalNetwork.prototype.StartServer = function (serverAddress) {
        if (serverAddress === void 0) { serverAddress = null; }
        if (serverAddress == null)
            serverAddress = "" + this.mId;
        if (serverAddress in LocalNetwork.mServers) {
            this.Enqueue(index_1.NetEventType.ServerInitFailed, index_1.ConnectionId.INVALID, serverAddress);
            return;
        }
        LocalNetwork.mServers[serverAddress] = this;
        this.mServerAddress = serverAddress;
        this.Enqueue(index_1.NetEventType.ServerInitialized, index_1.ConnectionId.INVALID, serverAddress);
    };
    LocalNetwork.prototype.StopServer = function () {
        if (this.IsServer) {
            this.Enqueue(index_1.NetEventType.ServerClosed, index_1.ConnectionId.INVALID, this.mServerAddress);
            delete LocalNetwork.mServers[this.mServerAddress];
            this.mServerAddress = null;
        }
    };
    LocalNetwork.prototype.Connect = function (address) {
        var connectionId = this.NextConnectionId();
        var sucessful = false;
        if (address in LocalNetwork.mServers) {
            var server = LocalNetwork.mServers[address];
            if (server != null) {
                server.ConnectClient(this);
                //add the server as local connection
                this.mConnectionNetwork[connectionId.id] = LocalNetwork.mServers[address];
                this.Enqueue(index_1.NetEventType.NewConnection, connectionId, null);
                sucessful = true;
            }
        }
        if (sucessful == false) {
            this.Enqueue(index_1.NetEventType.ConnectionFailed, connectionId, "Couldn't connect to the given server with id " + address);
        }
        return connectionId;
    };
    LocalNetwork.prototype.Shutdown = function () {
        for (var id in this.mConnectionNetwork) //can be changed while looping?
         {
            this.Disconnect(new index_1.ConnectionId(+id));
        }
        //this.mConnectionNetwork.Clear();
        this.StopServer();
    };
    LocalNetwork.prototype.Dispose = function () {
        if (this.mIsDisposed == false) {
            this.Shutdown();
        }
    };
    LocalNetwork.prototype.SendData = function (userId, data, reliable) {
        if (userId.id in this.mConnectionNetwork) {
            var net = this.mConnectionNetwork[userId.id];
            net.ReceiveData(this, data, reliable);
            return true;
        }
        return false;
    };
    LocalNetwork.prototype.Update = function () {
        //work around for the GarbageCollection bug
        //usually weak references are removed during garbage collection but that
        //fails sometimes as others weak references get null to even though
        //the objects still exist!
        this.CleanupWreakReferences();
    };
    LocalNetwork.prototype.Dequeue = function () {
        return this.mEvents.Dequeue();
    };
    LocalNetwork.prototype.Peek = function () {
        return this.mEvents.Peek();
    };
    LocalNetwork.prototype.Flush = function () {
    };
    LocalNetwork.prototype.Disconnect = function (id) {
        if (id.id in this.mConnectionNetwork) {
            var other = this.mConnectionNetwork[id.id];
            if (other != null) {
                other.InternalDisconnectNetwork(this);
                this.InternalDisconnect(id);
            }
            else {
                //this is suppose to never happen but it does
                //if a server is destroyed by the garbage collector the client
                //weak reference appears to be NULL even though it still exists
                //bug?
                this.CleanupWreakReferences();
            }
        }
    };
    LocalNetwork.prototype.FindConnectionId = function (network) {
        for (var kvp in this.mConnectionNetwork) {
            var network_1 = this.mConnectionNetwork[kvp];
            if (network_1 != null) {
                return new index_1.ConnectionId(+kvp);
            }
        }
        return index_1.ConnectionId.INVALID;
    };
    LocalNetwork.prototype.NextConnectionId = function () {
        var res = this.mNextNetworkId;
        this.mNextNetworkId = new index_1.ConnectionId(res.id + 1);
        return res;
    };
    LocalNetwork.prototype.ConnectClient = function (client) {
        //if (this.IsServer == false)
        //    throw new InvalidOperationException();
        var nextId = this.NextConnectionId();
        //server side only
        this.mConnectionNetwork[nextId.id] = client;
        this.Enqueue(index_1.NetEventType.NewConnection, nextId, null);
    };
    LocalNetwork.prototype.Enqueue = function (type, id, data) {
        var ev = new index_1.NetworkEvent(type, id, data);
        this.mEvents.Enqueue(ev);
    };
    LocalNetwork.prototype.ReceiveData = function (network, data, reliable) {
        var userId = this.FindConnectionId(network);
        var buffer = new Uint8Array(data.length);
        for (var i = 0; i < buffer.length; i++) {
            buffer[i] = data[i];
        }
        var type = index_1.NetEventType.UnreliableMessageReceived;
        if (reliable)
            type = index_1.NetEventType.ReliableMessageReceived;
        this.Enqueue(type, userId, buffer);
    };
    LocalNetwork.prototype.InternalDisconnect = function (id) {
        if (id.id in this.mConnectionNetwork) {
            this.Enqueue(index_1.NetEventType.Disconnected, id, null);
            delete this.mConnectionNetwork[id.id];
        }
    };
    LocalNetwork.prototype.InternalDisconnectNetwork = function (ln) {
        //if it can't be found it will return invalid which is ignored in internal disconnect
        this.InternalDisconnect(this.FindConnectionId(ln));
    };
    LocalNetwork.prototype.CleanupWreakReferences = function () {
        //foreach(var kvp in mConnectionNetwork.Keys.ToList())
        //{
        //    var val = mConnectionNetwork[kvp];
        //    if (val.Get() == null) {
        //        InternalDisconnect(kvp);
        //    }
        //}
    };
    LocalNetwork.sNextId = 1;
    LocalNetwork.mServers = {};
    return LocalNetwork;
}());
exports.LocalNetwork = LocalNetwork;

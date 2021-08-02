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
exports.WebsocketTest = void 0;
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
var index_1 = require("../awrtc/index");
var IBasicNetworkTest_1 = require("helper/IBasicNetworkTest");
var WebsocketTest = /** @class */ (function (_super) {
    __extends(WebsocketTest, _super);
    function WebsocketTest() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WebsocketTest.prototype.setup = function () {
        var _this = this;
        _super.prototype.setup.call(this);
        //special tests
        beforeEach(function () {
            _this.mUrl = WebsocketTest.sUrl;
        });
        //can only be done manually so far
        xit("Timeout", function (done) {
            //this needs to be a local test server
            //that can be disconnected to test the timeout
            _this.mUrl = "ws://192.168.1.3:12776";
            var evt;
            var srv;
            var address;
            _this.thenAsync(function (finished) {
                _this._CreateServerNetwork(function (rsrv, raddress) {
                    srv = rsrv;
                    address = raddress;
                    finished();
                });
            });
            _this.thenAsync(function (finished) {
                console.log("Server ready at " + address);
                expect(srv).not.toBeNull();
                expect(address).not.toBeNull();
                console.debug("Waiting for timeout");
                _this.waitForEvent(srv, finished, 120000);
            });
            _this.then(function () {
                console.log("Timeout over");
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(index_1.NetEventType.ServerClosed);
                expect(srv.getStatus()).toBe(index_1.WebsocketConnectionStatus.NotConnected);
                done();
            });
            _this.start();
        }, 130000);
        it("SharedAddress", function (done) {
            _this.mUrl = WebsocketTest.sUrlShared;
            var sharedAddress = "sharedtestaddress";
            var evt;
            var net1;
            var net2;
            _this.thenAsync(function (finished) {
                net1 = _this._CreateNetwork();
                net1.StartServer(sharedAddress);
                _this.waitForEvent(net1, finished);
            });
            _this.thenAsync(function (finished) {
                evt = net1.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(index_1.NetEventType.ServerInitialized);
                net2 = _this._CreateNetwork();
                net2.StartServer(sharedAddress);
                _this.waitForEvent(net2, finished);
            });
            _this.thenAsync(function (finished) {
                evt = net2.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(index_1.NetEventType.ServerInitialized);
                _this.waitForEvent(net1, finished);
            });
            _this.thenAsync(function (finished) {
                evt = net1.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(index_1.NetEventType.NewConnection);
                _this.waitForEvent(net2, finished);
            });
            _this.then(function () {
                evt = net2.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(index_1.NetEventType.NewConnection);
                done();
            });
            _this.start();
        });
        it("BadUrlStartServer", function (done) {
            _this.mUrl = WebsocketTest.sBadUrl;
            var evt;
            var srv;
            _this.thenAsync(function (finished) {
                srv = _this._CreateNetwork();
                expect(srv.getStatus()).toBe(index_1.WebsocketConnectionStatus.NotConnected);
                srv.StartServer();
                expect(srv.getStatus()).toBe(index_1.WebsocketConnectionStatus.Connecting);
                _this.waitForEvent(srv, finished);
            });
            _this.then(function () {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(index_1.NetEventType.ServerInitFailed);
                expect(srv.getStatus()).toBe(index_1.WebsocketConnectionStatus.NotConnected);
                done();
            });
            _this.start();
        });
        it("BadUrlConnect", function (done) {
            _this.mUrl = WebsocketTest.sBadUrl;
            var evt;
            var clt;
            var cltId;
            _this.thenAsync(function (finished) {
                clt = _this._CreateNetwork();
                expect(clt.getStatus()).toBe(index_1.WebsocketConnectionStatus.NotConnected);
                cltId = clt.Connect("invalid address");
                expect(clt.getStatus()).toBe(index_1.WebsocketConnectionStatus.Connecting);
                _this.waitForEvent(clt, finished);
            });
            _this.then(function () {
                evt = clt.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(index_1.NetEventType.ConnectionFailed);
                expect(clt.getStatus()).toBe(index_1.WebsocketConnectionStatus.NotConnected);
                done();
            });
            _this.start();
        });
        it("WebsocketState", function (done) {
            var srv;
            var address;
            var srvToCltId;
            var clt;
            var cltToSrvId;
            var evt;
            _this.thenAsync(function (finished) {
                _this._CreateServerClient(function (rsrv, raddress, rsrvToCltId, rclt, rcltToSrvId) {
                    srv = rsrv;
                    address = raddress;
                    srvToCltId = rsrvToCltId;
                    clt = rclt;
                    cltToSrvId = rcltToSrvId;
                    finished();
                });
            });
            _this.thenAsync(function (finished) {
                //both should be connected
                expect(srv.getStatus()).toBe(index_1.WebsocketConnectionStatus.Connected);
                expect(clt.getStatus()).toBe(index_1.WebsocketConnectionStatus.Connected);
                srv.Disconnect(srvToCltId);
                _this.waitForEvent(srv, finished);
            });
            _this.thenAsync(function (finished) {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(index_1.NetEventType.Disconnected);
                _this.waitForEvent(clt, finished);
            });
            _this.thenAsync(function (finished) {
                evt = clt.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(index_1.NetEventType.Disconnected);
                expect(cltToSrvId.id).toBe(evt.ConnectionId.id);
                //after disconnect the client doesn't have any active connections -> expect disconnected
                expect(srv.getStatus()).toBe(index_1.WebsocketConnectionStatus.Connected);
                expect(clt.getStatus()).toBe(index_1.WebsocketConnectionStatus.NotConnected);
                srv.StopServer();
                _this.waitForEvent(srv, finished);
            });
            _this.thenAsync(function (finished) {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(index_1.NetEventType.ServerClosed);
                expect(srv.getStatus()).toBe(index_1.WebsocketConnectionStatus.NotConnected);
                srv.StartServer(address);
                _this.waitForEvent(srv, finished);
            });
            _this.thenAsync(function (finished) {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(index_1.NetEventType.ServerInitialized);
                _this._Connect(srv, address, clt, function (srvToCltIdOut, cltToSrvIdOut) {
                    finished();
                });
            });
            _this.then(function () {
                done();
            });
            _this.start();
        });
    };
    WebsocketTest.prototype._CreateNetworkImpl = function () {
        //let url = 'ws://because-why-not.com:12776';
        return new index_1.WebsocketNetwork(this.mUrl);
    };
    //replace with valid url that has a server behind it
    //public static sUrl = 'ws://localhost:12776/test';
    //public static sUrlShared = 'ws://localhost:12776/testshared';
    WebsocketTest.sUrl = 'ws://signaling.because-why-not.com';
    //public static sUrl = 'ws://192.168.1.3:12776';
    WebsocketTest.sUrlShared = 'ws://signaling.because-why-not.com/testshared';
    //any url to simulate offline server
    WebsocketTest.sBadUrl = 'ws://localhost:13776';
    return WebsocketTest;
}(IBasicNetworkTest_1.IBasicNetworkTest));
exports.WebsocketTest = WebsocketTest;
describe("WebsocketNetworkTest", function () {
    it("TestEnvironment", function () {
        expect(null).toBeNull();
    });
    beforeEach(function () {
    });
    var test = new WebsocketTest();
    test.setup();
});

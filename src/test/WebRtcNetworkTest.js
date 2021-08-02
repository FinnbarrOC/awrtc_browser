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
exports.WebRtcNetworkTest = void 0;
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
var WebsocketNetworkTest_1 = require("WebsocketNetworkTest");
var IBasicNetworkTest_1 = require("helper/IBasicNetworkTest");
var index_1 = require("../awrtc/index");
var WebRtcNetworkTest = /** @class */ (function (_super) {
    __extends(WebRtcNetworkTest, _super);
    function WebRtcNetworkTest() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.mUrl = WebsocketNetworkTest_1.WebsocketTest.sUrl;
        //allows each test to overwrite the default behaviour
        _this.mUseWebsockets = false;
        return _this;
    }
    WebRtcNetworkTest.prototype.setup = function () {
        var _this = this;
        beforeEach(function () {
            _this.mUrl = WebsocketNetworkTest_1.WebsocketTest.sUrl;
            _this.mUseWebsockets = WebRtcNetworkTest.mAlwaysUseWebsockets;
        });
        it("GetBufferedAmount", function (done) {
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
            _this.then(function () {
                //TODO: more detailed testing by actually triggering the buffer to fill?
                //might be tricky as this is very system dependent
                var buf;
                buf = srv.GetBufferedAmount(srvToCltId, false);
                expect(buf).toBe(0);
                buf = srv.GetBufferedAmount(srvToCltId, true);
                expect(buf).toBe(0);
                buf = clt.GetBufferedAmount(cltToSrvId, false);
                expect(buf).toBe(0);
                buf = clt.GetBufferedAmount(cltToSrvId, true);
                expect(buf).toBe(0);
                done();
            });
            _this.start();
        });
        it("SharedAddress", function (done) {
            //turn off websockets and use shared websockets for this test as local network doesn't support shared mode
            _this.mUseWebsockets = true;
            _this.mUrl = WebsocketNetworkTest_1.WebsocketTest.sUrlShared;
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
        //connect using only direct local connections (give no ice servers)
        it("ConnectLocalOnly", function (done) {
            var srv;
            var address;
            var clt;
            var cltId;
            var evt;
            _this.thenAsync(function (finished) {
                srv = _this._CreateNetwork();
                _this._CreateServerNetwork(function (rsrv, raddress) {
                    srv = rsrv;
                    address = raddress;
                    finished();
                });
            });
            _this.thenAsync(function (finished) {
                clt = _this._CreateNetwork();
                cltId = clt.Connect(address);
                _this.waitForEvent(clt, finished);
            });
            _this.then(function () {
                evt = clt.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(index_1.NetEventType.NewConnection);
                expect(evt.ConnectionId.id).toBe(cltId.id);
            });
            _this.thenAsync(function (finished) {
                _this.waitForEvent(srv, finished);
            });
            _this.then(function () {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(index_1.NetEventType.NewConnection);
                expect(evt.ConnectionId.id).not.toBe(index_1.ConnectionId.INVALID.id);
                done();
            });
            _this.start();
        });
        _super.prototype.setup.call(this);
        //special tests
    };
    WebRtcNetworkTest.prototype._CreateNetworkImpl = function () {
        var rtcConfig = { iceServers: [WebRtcNetworkTest.sDefaultIceServer] };
        var sigConfig;
        if (this.mUseWebsockets) {
            sigConfig = new index_1.SignalingConfig(new index_1.WebsocketNetwork(this.mUrl));
        }
        else {
            sigConfig = new index_1.SignalingConfig(new index_1.LocalNetwork());
        }
        return new index_1.WebRtcNetwork(sigConfig, rtcConfig);
    };
    WebRtcNetworkTest.sUrl = 'ws://localhost:12776/test';
    WebRtcNetworkTest.sUrlShared = 'ws://localhost:12776/testshared';
    WebRtcNetworkTest.sDefaultIceServer = { urls: ["stun:stun.l.google.com:19302"] };
    //will set use websocket flag for each test
    WebRtcNetworkTest.mAlwaysUseWebsockets = false;
    return WebRtcNetworkTest;
}(IBasicNetworkTest_1.IBasicNetworkTest));
exports.WebRtcNetworkTest = WebRtcNetworkTest;
describe("WebRtcNetworkTest", function () {
    it("TestEnvironment", function () {
        expect(null).toBeNull();
    });
    var test = new WebRtcNetworkTest();
    test.mDefaultWaitTimeout = 5000;
    test.setup();
});

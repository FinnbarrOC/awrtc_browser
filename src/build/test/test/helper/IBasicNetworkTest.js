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
import { BasicNetworkTestBase } from "./BasicNetworkTestBase";
import { NetEventType, ConnectionId, Encoding, SLog, SLogLevel } from "../../awrtc/network/index";
var IBasicNetworkTest = /** @class */ (function (_super) {
    __extends(IBasicNetworkTest, _super);
    function IBasicNetworkTest() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    IBasicNetworkTest.prototype.setup = function () {
        var _this = this;
        _super.prototype.setup.call(this);
        var originalTimeout = 5000;
        beforeEach(function () {
            SLog.RequestLogLevel(SLogLevel.Info);
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = _this.mDefaultWaitTimeout + 5000;
        });
        afterEach(function () {
            console.debug("Test shutting down ...");
            _this.ShutdownAll();
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = _this.mDefaultWaitTimeout + 5000;
        });
        //add all reusable tests here
        //TODO: check how to find the correct line where it failed
        it("TestEnvironmentAsync", function (done) {
            var value1 = false;
            var value2 = false;
            _this.then(function () {
                expect(value1).toBe(false);
                expect(value2).toBe(false);
                value1 = true;
            });
            _this.thenAsync(function (finished) {
                expect(value1).toBe(true);
                expect(value2).toBe(false);
                value2 = true;
                finished();
            });
            _this.then(function () {
                expect(value1).toBe(true);
                expect(value2).toBe(true);
                done();
            });
            _this.start();
        });
        it("Create", function () {
            var clt;
            clt = _this._CreateNetwork();
            expect(clt).not.toBe(null);
        });
        it("StartServer", function (done) {
            var evt;
            var srv;
            _this.thenAsync(function (finished) {
                srv = _this._CreateNetwork();
                srv.StartServer();
                _this.waitForEvent(srv, finished);
            });
            _this.then(function () {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ServerInitialized);
                expect(evt.ConnectionId.id).toBe(ConnectionId.INVALID.id);
                expect(evt.Info).not.toBe(null);
                done();
            });
            _this.start();
        });
        it("StartServerNamed", function (done) {
            var name = "StartServerNamedTest";
            var evt;
            var srv1;
            var srv2;
            srv1 = _this._CreateNetwork();
            srv2 = _this._CreateNetwork();
            _this.thenAsync(function (finished) {
                srv1.StartServer(name);
                _this.waitForEvent(srv1, finished);
            });
            _this.then(function () {
                evt = srv1.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ServerInitialized);
                expect(evt.ConnectionId.id).toBe(ConnectionId.INVALID.id);
                expect(evt.Info).toBe(name);
            });
            _this.thenAsync(function (finished) {
                srv2.StartServer(name);
                _this.waitForEvent(srv2, finished);
            });
            _this.thenAsync(function (finished) {
                //expect the server start to fail because the address is in use
                evt = srv2.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ServerInitFailed);
                expect(evt.ConnectionId.id).toBe(ConnectionId.INVALID.id);
                expect(evt.Info).toBe(name);
                //stop the other server to free the address
                srv1.StopServer();
                _this.waitForEvent(srv1, finished);
            });
            _this.thenAsync(function (finished) {
                //expect the server start to fail because the address is in use
                evt = srv1.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ServerClosed);
                expect(evt.ConnectionId.id).toBe(ConnectionId.INVALID.id);
                //stop the other server to free the address
                srv2.StartServer(name);
                _this.waitForEvent(srv2, finished);
            });
            _this.thenAsync(function (finished) {
                //expect the server start to fail because the address is in use
                evt = srv2.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ServerInitialized);
                done();
            });
            _this.start();
        });
        it("StopServer", function (done) {
            var evt;
            var srv;
            _this.thenAsync(function (finished) {
                srv = _this._CreateNetwork();
                srv.StopServer();
                _this.waitForEvent(srv, finished, 100);
            });
            _this.then(function () {
                evt = srv.Dequeue();
                expect(evt).toBeNull();
                done();
            });
            _this.start();
        });
        it("StopServer2", function (done) {
            var evt;
            var srv;
            _this.thenAsync(function (finished) {
                srv = _this._CreateNetwork();
                srv.StartServer();
                _this.waitForEvent(srv, finished);
            });
            _this.then(function () {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ServerInitialized);
                expect(evt.ConnectionId.id).toBe(ConnectionId.INVALID.id);
                expect(evt.Info).not.toBe(null);
            });
            _this.thenAsync(function (finished) {
                srv.StopServer();
                _this.waitForEvent(srv, finished);
            });
            _this.then(function () {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ServerClosed);
                expect(evt.ConnectionId.id).toBe(ConnectionId.INVALID.id);
                //enforce address in this to prepare having multiple addresses?
                //expect(evt.Info).not.toBe(null);
                done();
            });
            _this.start();
        });
        it("_CreateServerNetwork", function (done) {
            var srv;
            var address;
            _this.thenAsync(function (finished) {
                _this._CreateServerNetwork(function (rsrv, raddress) {
                    srv = rsrv;
                    address = raddress;
                    finished();
                });
            });
            _this.then(function () {
                expect(srv).not.toBeNull();
                expect(address).not.toBeNull();
                done();
            });
            _this.start();
        });
        it("ConnectFail", function (done) {
            var evt;
            var clt;
            var cltId;
            _this.thenAsync(function (finished) {
                clt = _this._CreateNetwork();
                cltId = clt.Connect("invalid address");
                _this.waitForEvent(clt, finished);
            });
            _this.then(function () {
                evt = clt.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ConnectionFailed);
                expect(evt.ConnectionId.id).toBe(cltId.id);
                done();
            });
            _this.start();
        });
        it("ConnectTwo", function (done) {
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
                expect(evt.Type).toBe(NetEventType.NewConnection);
                expect(evt.ConnectionId.id).toBe(cltId.id);
            });
            _this.thenAsync(function (finished) {
                _this.waitForEvent(srv, finished);
            });
            _this.then(function () {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.NewConnection);
                expect(evt.ConnectionId.id).not.toBe(ConnectionId.INVALID.id);
                done();
            });
            _this.start();
        });
        it("ConnectHelper", function (done) {
            var srv;
            var address;
            var clt;
            var cltToSrvId;
            var srvToCltId;
            var evt;
            _this.thenAsync(function (finished) {
                _this._CreateServerClient(function (rsrv, raddress, rsrvToCltId, rclt, rcltToSrvId) {
                    srv = rsrv;
                    address = raddress;
                    srvToCltId = rsrvToCltId;
                    clt = rclt;
                    cltToSrvId = rcltToSrvId;
                    done();
                });
            });
            _this.start();
        });
        it("Peek", function (done) {
            var evt;
            var net = _this._CreateNetwork();
            var cltId1 = net.Connect("invalid address1");
            var cltId2 = net.Connect("invalid address2");
            var cltId3 = net.Connect("invalid address3");
            _this.thenAsync(function (finished) {
                _this.waitForEvent(net, finished);
            });
            _this.thenAsync(function (finished) {
                evt = net.Peek();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ConnectionFailed);
                expect(evt.ConnectionId.id).toBe(cltId1.id);
                evt = net.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ConnectionFailed);
                expect(evt.ConnectionId.id).toBe(cltId1.id);
                _this.waitForEvent(net, finished);
            });
            _this.thenAsync(function (finished) {
                evt = net.Peek();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ConnectionFailed);
                expect(evt.ConnectionId.id).toBe(cltId2.id);
                evt = net.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ConnectionFailed);
                expect(evt.ConnectionId.id).toBe(cltId2.id);
                _this.waitForEvent(net, finished);
            });
            _this.thenAsync(function (finished) {
                evt = net.Peek();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ConnectionFailed);
                expect(evt.ConnectionId.id).toBe(cltId3.id);
                evt = net.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ConnectionFailed);
                expect(evt.ConnectionId.id).toBe(cltId3.id);
                done();
            });
            _this.start();
        });
        it("Disconnect", function (done) {
            var evt;
            var clt = _this._CreateNetwork();
            _this.thenAsync(function (finished) {
                clt.Disconnect(ConnectionId.INVALID);
                _this.waitForEvent(clt, finished, 100);
            });
            _this.thenAsync(function (finished) {
                evt = clt.Dequeue();
                expect(evt).toBeNull();
                clt.Disconnect(new ConnectionId(1234));
                _this.waitForEvent(clt, finished, 100);
            });
            _this.then(function () {
                evt = clt.Dequeue();
                expect(evt).toBeNull();
                done();
            });
            _this.start();
        });
        it("DisconnectClient", function (done) {
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
                clt.Disconnect(cltToSrvId);
                _this.waitForEvent(clt, finished);
            });
            _this.thenAsync(function (finished) {
                evt = clt.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.Disconnected);
                expect(cltToSrvId.id).toBe(evt.ConnectionId.id);
                _this.waitForEvent(srv, finished);
            });
            _this.then(function () {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.Disconnected);
                expect(srvToCltId.id).toBe(evt.ConnectionId.id);
                done();
            });
            _this.start();
        });
        it("DisconnectServer", function (done) {
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
                srv.Disconnect(srvToCltId);
                _this.waitForEvent(srv, finished);
            });
            _this.thenAsync(function (finished) {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.Disconnected);
                expect(srvToCltId.id).toBe(evt.ConnectionId.id);
                _this.waitForEvent(clt, finished);
            });
            _this.then(function () {
                evt = clt.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.Disconnected);
                expect(cltToSrvId.id).toBe(evt.ConnectionId.id);
                done();
            });
            _this.start();
        });
        it("DisconnectServerMulti", function (done) {
            var srv;
            var address;
            var srvToClt1Id;
            var srvToClt2Id;
            var clt1;
            var clt1ToSrvId;
            var clt2;
            var clt2ToSrvId;
            var evt;
            _this.thenAsync(function (finished) {
                _this._CreateServerClient(function (rsrv, raddress, rsrvToCltId, rclt, rcltToSrvId) {
                    srv = rsrv;
                    address = raddress;
                    srvToClt1Id = rsrvToCltId;
                    clt1 = rclt;
                    clt1ToSrvId = rcltToSrvId;
                    finished();
                });
            });
            _this.thenAsync(function (finished) {
                clt2 = _this._CreateNetwork();
                _this._Connect(srv, address, clt2, function (rsrvToCltId, rcltToSrvId) {
                    srvToClt2Id = rsrvToCltId;
                    clt2ToSrvId = rcltToSrvId;
                    finished();
                });
            });
            _this.thenAsync(function (finished) {
                srv.Disconnect(srvToClt1Id);
                srv.Disconnect(srvToClt2Id);
                _this.waitForEvent(srv, finished);
            });
            _this.thenAsync(function (finished) {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.Disconnected);
                expect(srvToClt1Id.id).toBe(evt.ConnectionId.id);
                _this.waitForEvent(srv, finished);
            });
            _this.thenAsync(function (finished) {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.Disconnected);
                expect(srvToClt2Id.id).toBe(evt.ConnectionId.id);
                _this.waitForEvent(clt1, finished);
            });
            _this.thenAsync(function (finished) {
                evt = clt1.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.Disconnected);
                expect(clt1ToSrvId.id).toBe(evt.ConnectionId.id);
                _this.waitForEvent(clt2, finished);
            });
            _this.then(function () {
                evt = clt2.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.Disconnected);
                expect(clt2ToSrvId.id).toBe(evt.ConnectionId.id);
                done();
            });
            _this.start();
        });
        it("ShutdownEmpty", function (done) {
            var net;
            var evt;
            net = _this._CreateNetwork();
            _this.thenAsync(function (finished) {
                net.Shutdown();
                _this.waitForEvent(net, finished);
            });
            _this.then(function () {
                evt = net.Dequeue();
                expect(evt).toBeNull();
                done();
            });
            _this.start();
        });
        it("ShutdownServer", function (done) {
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
                srv.Shutdown();
                _this.waitForEvent(clt, finished);
            });
            _this.thenAsync(function (finished) {
                evt = clt.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.Disconnected);
                expect(cltToSrvId.id).toBe(evt.ConnectionId.id);
                _this.waitForEvent(srv, finished);
            });
            _this.thenAsync(function (finished) {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.Disconnected);
                expect(srvToCltId.id).toBe(evt.ConnectionId.id);
                _this.waitForEvent(srv, finished);
            });
            _this.thenAsync(function (finished) {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ServerClosed);
                expect(evt.ConnectionId).toBe(ConnectionId.INVALID);
                _this.waitForEvent(srv, finished, 100);
            });
            _this.then(function () {
                //no further events are suppose to be triggered after shutdown
                evt = srv.Dequeue();
                expect(evt).toBeNull();
                done();
            });
            _this.start();
        });
        it("ShutdownClient", function (done) {
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
                clt.Shutdown();
                _this.waitForEvent(clt, finished);
            });
            _this.thenAsync(function (finished) {
                evt = clt.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.Disconnected);
                expect(cltToSrvId.id).toBe(evt.ConnectionId.id);
                _this.waitForEvent(srv, finished);
            });
            _this.thenAsync(function (finished) {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.Disconnected);
                expect(srvToCltId.id).toBe(evt.ConnectionId.id);
                _this.waitForEvent(srv, finished, 100);
            });
            _this.then(function () {
                evt = srv.Dequeue();
                expect(evt).toBeNull();
                done();
            });
            _this.start();
        });
        it("DisconnectInvalid", function (done) {
            var evt;
            var clt = _this._CreateNetwork();
            clt.Disconnect(ConnectionId.INVALID);
            clt.Disconnect(new ConnectionId(1234));
            _this.thenAsync(function (finished) {
                _this.waitForEvent(clt, finished, 100);
            });
            _this.then(function () {
                evt = clt.Dequeue();
                expect(evt).toBeNull();
            });
            _this.then(function () {
                done();
            });
            _this.start();
        });
        it("SendDataTolerateInvalidDestination", function (done) {
            var evt;
            var clt = _this._CreateNetwork();
            var testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            _this.thenAsync(function (finished) {
                clt.SendData(ConnectionId.INVALID, testData, true);
                _this.waitForEvent(clt, finished, 100);
            });
            _this.then(function () {
                evt = clt.Dequeue();
                expect(evt).toBeNull();
            });
            _this.thenAsync(function (finished) {
                clt.SendData(ConnectionId.INVALID, testData, false);
                _this.waitForEvent(clt, finished, 100);
            });
            _this.then(function () {
                evt = clt.Dequeue();
                expect(evt).toBeNull();
            });
            _this.then(function () {
                done();
            });
            _this.start();
        });
        it("SendDataReliable", function (done) {
            var srv;
            var address;
            var srvToCltId;
            var clt;
            var cltToSrvId;
            var evt;
            var testMessage = "SendDataReliable_testmessage1234";
            var testMessageBytes = Encoding.UTF16.GetBytes(testMessage);
            var receivedTestMessage;
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
                clt.SendData(cltToSrvId, testMessageBytes, true);
                _this.waitForEvent(srv, finished);
            });
            _this.thenAsync(function (finished) {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ReliableMessageReceived);
                expect(srvToCltId.id).toBe(evt.ConnectionId.id);
                receivedTestMessage = Encoding.UTF16.GetString(evt.MessageData);
                expect(receivedTestMessage).toBe(testMessage);
                srv.SendData(srvToCltId, testMessageBytes, true);
                _this.waitForEvent(clt, finished);
            });
            _this.then(function () {
                evt = clt.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.ReliableMessageReceived);
                expect(cltToSrvId.id).toBe(evt.ConnectionId.id);
                receivedTestMessage = Encoding.UTF16.GetString(evt.MessageData);
                expect(receivedTestMessage).toBe(testMessage);
                done();
            });
            _this.start();
        });
        it("SendDataUnreliable", function (done) {
            var srv;
            var address;
            var srvToCltId;
            var clt;
            var cltToSrvId;
            var evt;
            var testMessage = "SendDataUnreliable_testmessage1234";
            var testMessageBytes = Encoding.UTF16.GetBytes(testMessage);
            var receivedTestMessage;
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
                clt.SendData(cltToSrvId, testMessageBytes, false);
                _this.waitForEvent(srv, finished);
            });
            _this.thenAsync(function (finished) {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.UnreliableMessageReceived);
                expect(srvToCltId.id).toBe(evt.ConnectionId.id);
                receivedTestMessage = Encoding.UTF16.GetString(evt.MessageData);
                expect(receivedTestMessage).toBe(testMessage);
                srv.SendData(srvToCltId, testMessageBytes, false);
                _this.waitForEvent(clt, finished);
            });
            _this.then(function () {
                evt = clt.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.UnreliableMessageReceived);
                expect(cltToSrvId.id).toBe(evt.ConnectionId.id);
                receivedTestMessage = Encoding.UTF16.GetString(evt.MessageData);
                expect(receivedTestMessage).toBe(testMessage);
                done();
            });
            _this.start();
        });
    };
    return IBasicNetworkTest;
}(BasicNetworkTestBase));
export { IBasicNetworkTest };
//# sourceMappingURL=IBasicNetworkTest.js.map
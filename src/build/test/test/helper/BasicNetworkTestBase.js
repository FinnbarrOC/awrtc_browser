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
import { ConnectionId, NetEventType } from "../../awrtc/network/index";
var TestTaskRunner = /** @class */ (function () {
    function TestTaskRunner() {
        this._toDoList = new Array();
    }
    TestTaskRunner.prototype.then = function (syncTask) {
        var wrap = function (finished) {
            syncTask();
            finished();
        };
        this._toDoList.push(wrap);
    };
    TestTaskRunner.prototype.thenAsync = function (task) {
        this._toDoList.push(task);
    };
    TestTaskRunner.prototype.start = function () {
        var task = this._toDoList.shift();
        this._run(task);
    };
    TestTaskRunner.prototype.stop = function () {
    };
    TestTaskRunner.prototype._run = function (task) {
        var _this = this;
        task(function () {
            if (_this._toDoList.length > 0) {
                setTimeout(function () {
                    _this._run(_this._toDoList.shift());
                }, 1);
            }
        });
    };
    return TestTaskRunner;
}());
export { TestTaskRunner };
var BasicNetworkTestBase = /** @class */ (function () {
    function BasicNetworkTestBase() {
        this.mTestRunner = new TestTaskRunner();
        this.mCreatedNetworks = new Array();
        this.mDefaultWaitTimeout = 5000;
    }
    BasicNetworkTestBase.prototype.setup = function () {
        var _this = this;
        beforeEach(function () {
            _this.mTestRunner.stop();
            _this.mTestRunner = new TestTaskRunner();
            _this.mCreatedNetworks = new Array();
        });
    };
    BasicNetworkTestBase.prototype._CreateNetwork = function () {
        var net = this._CreateNetworkImpl();
        this.mCreatedNetworks.push(net);
        return net;
    };
    BasicNetworkTestBase.prototype.then = function (syncTask) {
        this.mTestRunner.then(syncTask);
    };
    BasicNetworkTestBase.prototype.thenAsync = function (task) {
        this.mTestRunner.thenAsync(task);
    };
    BasicNetworkTestBase.prototype.start = function () {
        this.mTestRunner.start();
    };
    //public waitForEvent(net: IBasicNetwork) {
    //    var wrap = (finished: Task) => {
    //        var timeout = 1000;
    //        var interval = 100;
    //        var intervalHandle;
    //        intervalHandle = setInterval(() => {
    //            this.UpdateAll();
    //            this.FlushAll();
    //            timeout -= interval;
    //            if (net.Peek() != null) {
    //                clearInterval(intervalHandle);
    //                finished();
    //            } else if (timeout <= 0) {
    //                clearInterval(intervalHandle);
    //                finished();
    //            }
    //        }, interval);
    //    };
    //    this.mTestRunner.thenAsync(wrap);
    //}
    BasicNetworkTestBase.prototype.waitForEvent = function (net, finished, timeout) {
        var _this = this;
        if (timeout == null)
            timeout = this.mDefaultWaitTimeout;
        var interval = 50;
        var intervalHandle;
        intervalHandle = setInterval(function () {
            _this.UpdateAll();
            _this.FlushAll();
            timeout -= interval;
            if (net.Peek() != null) {
                clearInterval(intervalHandle);
                finished();
            }
            else if (timeout <= 0) {
                clearInterval(intervalHandle);
                finished();
            }
        }, interval);
    };
    BasicNetworkTestBase.prototype.UpdateAll = function () {
        for (var _i = 0, _a = this.mCreatedNetworks; _i < _a.length; _i++) {
            var v = _a[_i];
            v.Update();
        }
    };
    BasicNetworkTestBase.prototype.FlushAll = function () {
        for (var _i = 0, _a = this.mCreatedNetworks; _i < _a.length; _i++) {
            var v = _a[_i];
            v.Flush();
        }
    };
    BasicNetworkTestBase.prototype.ShutdownAll = function () {
        for (var _i = 0, _a = this.mCreatedNetworks; _i < _a.length; _i++) {
            var v = _a[_i];
            v.Shutdown();
        }
        this.mCreatedNetworks = new Array();
    };
    BasicNetworkTestBase.prototype._CreateServerNetwork = function (result) {
        var srv = this._CreateNetwork();
        srv.StartServer();
        this.waitForEvent(srv, function () {
            var evt = srv.Dequeue();
            expect(evt).not.toBeNull();
            expect(evt.Type).toBe(NetEventType.ServerInitialized);
            expect(evt.Info).not.toBeNull();
            var address = evt.Info;
            result(srv, address);
        });
    };
    BasicNetworkTestBase.prototype._Connect = function (srv, address, clt, result) {
        var _this = this;
        var evt;
        var cltToSrvId = clt.Connect(address);
        var srvToCltId;
        this.waitForEvent(clt, function () {
            evt = clt.Dequeue();
            expect(evt).not.toBeNull();
            expect(evt.Type).toBe(NetEventType.NewConnection);
            expect(evt.ConnectionId.id).toBe(cltToSrvId.id);
            _this.waitForEvent(srv, function () {
                evt = srv.Dequeue();
                expect(evt).not.toBeNull();
                expect(evt.Type).toBe(NetEventType.NewConnection);
                expect(evt.ConnectionId.id).not.toBe(ConnectionId.INVALID.id);
                srvToCltId = evt.ConnectionId;
                result(srvToCltId, cltToSrvId);
            });
        });
    };
    BasicNetworkTestBase.prototype._CreateServerClient = function (result) {
        var _this = this;
        var srv;
        var address;
        var srvToCltId;
        var clt;
        var cltToSrvId;
        this._CreateServerNetwork(function (rsrv, raddress) {
            srv = rsrv;
            address = raddress;
            clt = _this._CreateNetwork();
            _this._Connect(srv, address, clt, function (rsrvToCltId, rcltToSrvId) {
                srvToCltId = rsrvToCltId;
                cltToSrvId = rcltToSrvId;
                result(srv, address, srvToCltId, clt, cltToSrvId);
            });
        });
    };
    return BasicNetworkTestBase;
}());
export { BasicNetworkTestBase };
//# sourceMappingURL=BasicNetworkTestBase.js.map
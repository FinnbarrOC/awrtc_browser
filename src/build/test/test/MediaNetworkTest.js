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
import { BrowserMediaNetwork, NetworkConfig, MediaConfig, ConnectionId, MediaEventType, MediaConfigurationState, NetEventType, BrowserMediaStream } from "../awrtc/index";
var MediaNetworkTest = /** @class */ (function () {
    function MediaNetworkTest() {
        this.createdNetworks = [];
    }
    MediaNetworkTest.prototype.createDefault = function () {
        var netConfig = new NetworkConfig();
        netConfig.SignalingUrl = null;
        var createdNetwork = new BrowserMediaNetwork(netConfig);
        this.createdNetworks.push(createdNetwork);
        return createdNetwork;
    };
    MediaNetworkTest.prototype.setup = function () {
        var _this = this;
        beforeEach(function () {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        });
        afterEach(function () {
            for (var _i = 0, _a = _this.createdNetworks; _i < _a.length; _i++) {
                var net = _a[_i];
                net.Dispose();
            }
            _this.createdNetworks = new Array();
        });
        it("FrameUpdates", function (done) {
            var mediaConfig = new MediaConfig();
            var network = _this.createDefault();
            network.Configure(mediaConfig);
            setInterval(function () {
                network.Update();
                var localFrame = network.TryGetFrame(ConnectionId.INVALID);
                if (localFrame != null) {
                    expect(localFrame.Height).toBeGreaterThan(0);
                    expect(localFrame.Width).toBeGreaterThan(0);
                    expect(localFrame.Buffer).not.toBeNull();
                    done();
                }
                network.Flush();
            }, 10);
        });
        it("MediaEventLocal", function (done) {
            BrowserMediaStream.DEBUG_SHOW_ELEMENTS = true;
            var mediaConfig = new MediaConfig();
            var network = _this.createDefault();
            network.Configure(mediaConfig);
            setInterval(function () {
                network.Update();
                var evt = null;
                while ((evt = network.DequeueMediaEvent()) != null) {
                    console.log("Stream added", evt);
                    expect(evt.EventType).toBe(MediaEventType.StreamAdded);
                    expect(evt.Args.videoHeight).toBeGreaterThan(0);
                    expect(evt.Args.videoWidth).toBeGreaterThan(0);
                    done();
                }
                network.Flush();
            }, 10);
        });
        it("MediaEventRemote", function (done) {
            BrowserMediaStream.DEBUG_SHOW_ELEMENTS = true;
            var testaddress = "testaddress" + Math.random();
            var sender = _this.createDefault();
            var receiver = _this.createDefault();
            var configureComplete = false;
            var senderFrame = false;
            var receiverFrame = false;
            sender.Configure(new MediaConfig());
            setInterval(function () {
                sender.Update();
                receiver.Update();
                if (configureComplete == false) {
                    var state = sender.GetConfigurationState();
                    if (state == MediaConfigurationState.Successful) {
                        configureComplete = true;
                        sender.StartServer(testaddress);
                    }
                    else if (state == MediaConfigurationState.Failed) {
                        fail();
                    }
                }
                var sndEvt = sender.Dequeue();
                if (sndEvt != null) {
                    console.log("sender event: " + sndEvt);
                    if (sndEvt.Type == NetEventType.ServerInitialized) {
                        receiver.Connect(testaddress);
                    }
                }
                var recEvt = receiver.Dequeue();
                if (recEvt != null) {
                    console.log("receiver event: " + recEvt);
                }
                var evt = null;
                while ((evt = sender.DequeueMediaEvent()) != null) {
                    expect(evt.EventType).toBe(MediaEventType.StreamAdded);
                    expect(evt.Args.videoHeight).toBeGreaterThan(0);
                    expect(evt.Args.videoWidth).toBeGreaterThan(0);
                    senderFrame = true;
                    console.log("sender received first frame");
                }
                while ((evt = receiver.DequeueMediaEvent()) != null) {
                    expect(evt.EventType).toBe(MediaEventType.StreamAdded);
                    expect(evt.Args.videoHeight).toBeGreaterThan(0);
                    expect(evt.Args.videoWidth).toBeGreaterThan(0);
                    receiverFrame = true;
                    console.log("receiver received first frame");
                }
                sender.Flush();
                receiver.Flush();
                if (senderFrame && receiverFrame)
                    done();
            }, 40);
        }, 15000);
    };
    return MediaNetworkTest;
}());
export { MediaNetworkTest };
describe("MediaNetworkTest", function () {
    it("TestEnvironment", function () {
        expect(null).toBeNull();
    });
    var test = new MediaNetworkTest();
    test.setup();
});
//# sourceMappingURL=MediaNetworkTest.js.map
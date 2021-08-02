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
/**Contains some helper classes to keep the typescript implementation
 * similar to the C# implementation.
 *
 */
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
exports.SLog = exports.SLogLevel = exports.Helper = exports.Random = exports.Encoding = exports.UTF16Encoding = exports.Encoder = exports.Debug = exports.Output = exports.List = exports.Queue = void 0;
var Queue = /** @class */ (function () {
    function Queue() {
        this.mArr = new Array();
    }
    Queue.prototype.Enqueue = function (val) {
        this.mArr.push(val);
    };
    Queue.prototype.TryDequeue = function (outp) {
        var res = false;
        if (this.mArr.length > 0) {
            outp.val = this.mArr.shift();
            res = true;
        }
        return res;
    };
    Queue.prototype.Dequeue = function () {
        if (this.mArr.length > 0) {
            return this.mArr.shift();
        }
        else {
            return null;
        }
    };
    Queue.prototype.Peek = function () {
        if (this.mArr.length > 0) {
            return this.mArr[0];
        }
        else {
            return null;
        }
    };
    Queue.prototype.Count = function () {
        return this.mArr.length;
    };
    Queue.prototype.Clear = function () {
        this.mArr = new Array();
    };
    return Queue;
}());
exports.Queue = Queue;
var List = /** @class */ (function () {
    function List() {
        this.mArr = new Array();
    }
    Object.defineProperty(List.prototype, "Internal", {
        get: function () {
            return this.mArr;
        },
        enumerable: false,
        configurable: true
    });
    List.prototype.Add = function (val) {
        this.mArr.push(val);
    };
    Object.defineProperty(List.prototype, "Count", {
        get: function () {
            return this.mArr.length;
        },
        enumerable: false,
        configurable: true
    });
    return List;
}());
exports.List = List;
var Output = /** @class */ (function () {
    function Output() {
    }
    return Output;
}());
exports.Output = Output;
var Debug = /** @class */ (function () {
    function Debug() {
    }
    Debug.Log = function (s) {
        SLog.Log(s);
    };
    Debug.LogError = function (s) {
        SLog.LogError(s);
    };
    Debug.LogWarning = function (s) {
        SLog.LogWarning(s);
    };
    return Debug;
}());
exports.Debug = Debug;
var Encoder = /** @class */ (function () {
    function Encoder() {
    }
    return Encoder;
}());
exports.Encoder = Encoder;
var UTF16Encoding = /** @class */ (function (_super) {
    __extends(UTF16Encoding, _super);
    function UTF16Encoding() {
        return _super.call(this) || this;
    }
    UTF16Encoding.prototype.GetBytes = function (text) {
        return this.stringToBuffer(text);
    };
    UTF16Encoding.prototype.GetString = function (buffer) {
        return this.bufferToString(buffer);
    };
    UTF16Encoding.prototype.bufferToString = function (buffer) {
        var arr = new Uint16Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 2);
        return String.fromCharCode.apply(null, arr);
    };
    UTF16Encoding.prototype.stringToBuffer = function (str) {
        var buf = new ArrayBuffer(str.length * 2);
        var bufView = new Uint16Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        var result = new Uint8Array(buf);
        return result;
    };
    return UTF16Encoding;
}(Encoder));
exports.UTF16Encoding = UTF16Encoding;
var Encoding = /** @class */ (function () {
    function Encoding() {
    }
    Object.defineProperty(Encoding, "UTF16", {
        get: function () {
            return new UTF16Encoding();
        },
        enumerable: false,
        configurable: true
    });
    return Encoding;
}());
exports.Encoding = Encoding;
var Random = /** @class */ (function () {
    function Random() {
    }
    Random.getRandomInt = function (min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    };
    return Random;
}());
exports.Random = Random;
var Helper = /** @class */ (function () {
    function Helper() {
    }
    Helper.tryParseInt = function (value) {
        try {
            if (/^(\-|\+)?([0-9]+)$/.test(value)) {
                var result = Number(value);
                if (isNaN(result) == false)
                    return result;
            }
        }
        catch (e) {
        }
        return null;
    };
    return Helper;
}());
exports.Helper = Helper;
var SLogLevel;
(function (SLogLevel) {
    SLogLevel[SLogLevel["None"] = 0] = "None";
    SLogLevel[SLogLevel["Errors"] = 1] = "Errors";
    SLogLevel[SLogLevel["Warnings"] = 2] = "Warnings";
    SLogLevel[SLogLevel["Info"] = 3] = "Info";
})(SLogLevel = exports.SLogLevel || (exports.SLogLevel = {}));
//Simplified logger
var SLog = /** @class */ (function () {
    function SLog() {
    }
    SLog.SetLogLevel = function (level) {
        SLog.sLogLevel = level;
    };
    SLog.RequestLogLevel = function (level) {
        if (level > SLog.sLogLevel)
            SLog.sLogLevel = level;
    };
    SLog.L = function (msg, tag) {
        SLog.Log(msg, tag);
    };
    SLog.LW = function (msg, tag) {
        SLog.LogWarning(msg, tag);
    };
    SLog.LE = function (msg, tag) {
        SLog.LogError(msg, tag);
    };
    SLog.Log = function (msg, tag) {
        if (SLog.sLogLevel >= SLogLevel.Info) {
            if (tag) {
                console.log(msg, tag);
            }
            else {
                console.log(msg);
            }
        }
    };
    SLog.LogWarning = function (msg, tag) {
        if (!tag)
            tag = "";
        if (SLog.sLogLevel >= SLogLevel.Warnings) {
            if (tag) {
                console.warn(msg, tag);
            }
            else {
                console.warn(msg);
            }
        }
    };
    SLog.LogError = function (msg, tag) {
        if (SLog.sLogLevel >= SLogLevel.Errors) {
            if (tag) {
                console.error(msg, tag);
            }
            else {
                console.error(msg);
            }
        }
    };
    SLog.sLogLevel = SLogLevel.Warnings;
    return SLog;
}());
exports.SLog = SLog;

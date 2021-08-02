"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRandomKey = exports.GetParameterByName = exports.DefaultValues = void 0;
/**
 * Contains default values / servers used for example and test apps.
 *
 * Note that these servers might not be online forever. Feel free to
 * run your own servers and update the url's below.
 */
var DefaultValues = /** @class */ (function () {
    function DefaultValues() {
    }
    Object.defineProperty(DefaultValues, "SignalingBase", {
        get: function () {
            if (window.location.protocol != "https:") {
                return DefaultValues.SignalingUrl;
            }
            else {
                return DefaultValues.SecureSignalingUrl;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DefaultValues, "Signaling", {
        /**
         * Returns the signaling server URL using ws for http pages and
         * wss for https. The server url here ends with "test" to avoid
         * clashes with existing callapp.
         */
        get: function () {
            return DefaultValues.SignalingBase + "/test";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DefaultValues, "SignalingShared", {
        /**
         * Returns the signaling server URL using ws for http pages and
         * wss for https. The server url here ends with "testshared" to avoid
         * clashes with existing conference app.
         * This url of the server usually allows shared addresses for
         * n to n connections / conference calls.
         */
        get: function () {
            return DefaultValues.SignalingBase + "/testshared";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DefaultValues, "StunServer", {
        get: function () {
            var res = {
                urls: "stun:stun.l.google.com:19302"
            };
            return res;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DefaultValues, "IceServers", {
        /**
         * Returns ice servers used for testing.
         * Might only return the free google stun server. Without an
         * additional turn server connections might fail due to firewall.
         * Server might be unavailable in China.
         */
        get: function () {
            return [DefaultValues.StunServer];
        },
        enumerable: false,
        configurable: true
    });
    DefaultValues.SignalingUrl = "ws://signaling.because-why-not.com";
    DefaultValues.SecureSignalingUrl = "wss://signaling.because-why-not.com";
    return DefaultValues;
}());
exports.DefaultValues = DefaultValues;
//
function GetParameterByName(name, url) {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
exports.GetParameterByName = GetParameterByName;
//Returns a random string
function GetRandomKey() {
    var result = "";
    for (var i = 0; i < 7; i++) {
        result += String.fromCharCode(65 + Math.round(Math.random() * 25));
    }
    return result;
}
exports.GetRandomKey = GetRandomKey;

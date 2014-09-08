/// <reference path="typings/tsd.d.ts" />
var WebRTCSample;
(function (WebRTCSample) {
    var WebSockManager = (function () {
        function WebSockManager(url) {
            var _this = this;
            this._webSocket = null;
            this.onRecv = function (message) {
            };
            this.onClose = function () {
            };
            // websocket callbacks
            this._onOpen = function () {
            };
            this._onMessage = function (message) {
                var evt = JSON.parse(message.data);
                if (evt.type === 'offer' || evt.type === 'answer' || evt.type === 'candidate') {
                    _this.onRecv(evt);
                } else {
                }
            };
            this._onClose = function () {
                _this.onClose();
            };
            this._onError = function (error) {
                _this.onClose();
            };
            this._webSocket = new WebSocket("ws://localhost:9001/");
            this._webSocket.onopen = this._onOpen;
            this._webSocket.onclose = this._onClose;
            this._webSocket.onmessage = this._onMessage;
            this._webSocket.onerror = this._onError;
        }
        WebSockManager.prototype.send = function (message) {
            this._webSocket.send(JSON.stringify(message));
        };
        return WebSockManager;
    })();
    WebRTCSample.WebSockManager = WebSockManager;
})(WebRTCSample || (WebRTCSample = {}));
//# sourceMappingURL=WebSockManager.js.map

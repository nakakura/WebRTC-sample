/// <reference path="typings/tsd.d.ts" />
/// <reference path="WebSockManager.ts" />
var WebRTCSample;
(function (WebRTCSample) {
    var WebRTCConnector = (function () {
        function WebRTCConnector(socket, mediaConstraints, pcConfig) {
            var _this = this;
            this._socket = null;
            this._peer = null;
            this._mediaConstraits = { mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true } };
            this._onSuccessGetUserMedia = function (stream) {
                try  {
                    _this._localStream = stream;
                    _this._localVideo.src = window.URL.createObjectURL(stream);
                    _this._localVideo.play();

                    _this._peer = new RTCPeerConnection(_this._pcConfig);
                    var dataChannel = _this._peer.createDataChannel('RTCDataChannel');

                    dataChannel.onopen = function (evt) {
                        console.log("ondatachannel");
                    };
                } catch (e) {
                    console.log("Failed to create peerConnection, exception: " + e.message);
                }

                // send any ice candidates to the other peer
                _this._peer.onicecandidate = function (evt) {
                    if (evt.candidate) {
                        _this._socket.send({
                            type: "candidate",
                            sdpMLineIndex: evt.candidate.sdpMLineIndex,
                            sdpMid: evt.candidate.sdpMid,
                            candidate: evt.candidate.candidate });
                    } else {
                    }
                };

                _this._peer.addStream(_this._localStream);

                // when remote adds a stream, hand it on to the local video element
                var onRemoteStreamAdded = function (event) {
                    _this._remoteVideo.src = window.URL.createObjectURL(event.stream);
                };

                // when remote removes a stream, remove it from the local video element
                var onRemoteStreamRemoved = function (event) {
                    _this._remoteVideo.src = "";
                };

                _this._peer.onaddstream = onRemoteStreamAdded;
                _this._peer.onremovestream = onRemoteStreamRemoved;
            };
            // NetworkIf callbacks
            this._onMessage = function (evt) {
                if (evt.type === 'offer') {
                    _this._onOffer(evt);
                } else if (evt.type === 'answer') {
                    _this._onAnswer(evt);
                } else if (evt.type === 'candidate') {
                    _this._onCandidate(evt);
                }
            };
            this._onClose = function () {
            };
            this._localVideo = document.getElementById('local-video');
            this._remoteVideo = document.getElementById('remote-video');
            this._socket = socket;
            this._socket.onRecv = this._onMessage;
            this._socket.onClose = this._onClose;
            this._mediaConstraits = mediaConstraints;
            this._pcConfig = pcConfig;

            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            RTCPeerConnection = window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
            RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
            RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
            navigator.getUserMedia({ audio: true, video: true }, this._onSuccessGetUserMedia, function (error) {
                console.log(error.name + ":" + error.message);
            });
        }
        WebRTCConnector.prototype.startConnecting = function () {
            var _this = this;
            if (this._peer == null || this._peer.signalingState != 'closed') {
                this._peer.createOffer(function (sessionDescription) {
                    _this._peer.setLocalDescription(sessionDescription);
                    _this._socket.send(sessionDescription);
                }, function (errorInformation) {
                    console.log("Create Offer failed");
                }, this._mediaConstraits);
            }
        };

        WebRTCConnector.prototype._onOffer = function (evt) {
            var _this = this;
            try  {
                this._peer.setRemoteDescription(new RTCSessionDescription(evt), function () {
                    _this._peer.createAnswer(function (sessionDescription) {
                        _this._peer.setLocalDescription(sessionDescription, function () {
                            _this._socket.send(sessionDescription);
                        });
                    }, function (errorInformation) {
                        console.log("Create Answer failed " + errorInformation);
                    }, _this._mediaConstraits);
                }, function (error) {
                    console.log(error);
                });
            } catch (e) {
                console.log(e);
            }
        };

        WebRTCConnector.prototype._onCandidate = function (evt) {
            var candidate = new RTCIceCandidate({ sdpMLineIndex: evt.sdpMLineIndex, sdpMid: evt.sdpMid, candidate: evt.candidate });
            this._peer.addIceCandidate(candidate);
        };

        WebRTCConnector.prototype._onAnswer = function (evt) {
            if (!this._peer) {
                console.error('peerConnection NOT exist!');
                return;
            }

            this._peer.setRemoteDescription(new RTCSessionDescription(evt), function () {
            });
        };
        return WebRTCConnector;
    })();
    WebRTCSample.WebRTCConnector = WebRTCConnector;
})(WebRTCSample || (WebRTCSample = {}));
//# sourceMappingURL=WebRtc.js.map

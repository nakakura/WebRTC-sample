/// <reference path="../typings/tsd.d.ts" />
/// <reference path="WebSockManager.ts" />
var RomoRTC;
(function (RomoRTC) {
    var WebRTCConnector = (function () {
        function WebRTCConnector(socket) {
            var _this = this;
            this._socket = null;
            this._peer = null;
            this._mediaConstraits = { mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true } };
            this._onSuccessGetUserMedia = function (stream) {
                _this._localStream = stream;
                _this._localVideo.src = window.URL.createObjectURL(stream);
                _this._localVideo.play();

                var pc_config = { "iceServers": [
                        { "url": "stun:stun.skyway.io:3478" },
                        {
                            "url": 'turn:153.149.7.233:443?transport=udp',
                            'credential': 'wI+8tZRjUllYctlWD/sAvM9yutM=',
                            'username': 'rinrin_1234'
                        },
                        {
                            "url": 'turn:153.149.7.233:443?transport=tcp',
                            'credential': 'wI+8tZRjUllYctlWD/sAvM9yutM=',
                            'username': 'rinrin_1234'
                        }
                    ], optional: [] };

                try  {
                    var RtcPeerConnection = mozRTCPeerConnection;
                    _this._peer = new RtcPeerConnection(pc_config);
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
                        console.log("onicecandidate");
                        _this._sendCandidate({
                            type: "candidate",
                            sdpMLineIndex: evt.candidate.sdpMLineIndex,
                            sdpMid: evt.candidate.sdpMid,
                            candidate: evt.candidate.candidate });
                    } else {
                        console.log("End of candidates. ------------------- phase=" + evt.eventPhase);
                    }
                };

                _this._peer.addStream(_this._localStream);

                // when remote adds a stream, hand it on to the local video element
                var onRemoteStreamAdded = function (event) {
                    console.log("Added remote stream");
                    _this._remoteVideo.src = window.URL.createObjectURL(event.stream);
                };

                // when remote removes a stream, remove it from the local video element
                var onRemoteStreamRemoved = function (event) {
                    console.log("Remove remote stream");
                    _this._remoteVideo.src = "";
                };

                _this._peer.onaddstream = onRemoteStreamAdded;
                _this._peer.onremovestream = onRemoteStreamRemoved;
            };
            // NetworkIf callbacks
            this._onMessage = function (evt) {
                if (evt.type === 'offer') {
                    console.log("offer");
                    _this._onOffer(evt);
                } else if (evt.type === 'answer') {
                    console.log("anser");
                    _this._onAnswer(evt);
                } else if (evt.type === 'candidate') {
                    console.log("candidate");
                    _this._onCandidate(evt);
                } else {
                    console.log("other");
                    console.log(evt);
                }
            };
            this._onClose = function () {
            };
            this._localVideo = document.getElementById('local-video');
            this._remoteVideo = document.getElementById('remote-video');
            this._socket = socket;
            this._socket.onRecv = this._onMessage;
            this._socket.onClose = this._onClose;

            navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);
            navigator.getUserMedia({ audio: true, video: true }, this._onSuccessGetUserMedia, function (error) {
                console.log(error.name + ":" + error.message);
            });
        }
        WebRTCConnector.prototype.startConnecting = function () {
            if (this._peer == null || this._peer.signalingState != 'closed') {
                this._sendOffer();
            }
        };

        WebRTCConnector.prototype._onOffer = function (evt) {
            console.log("Received offer...");
            this._setOffer(evt);
            this._sendAnswer(evt);
        };

        WebRTCConnector.prototype._onAnswer = function (evt) {
            console.log("Received Answer...");
            this._setAnswer(evt);
        };

        WebRTCConnector.prototype._onCandidate = function (evt) {
            var candidate = new RTCIceCandidate({ sdpMLineIndex: evt.sdpMLineIndex, sdpMid: evt.sdpMid, candidate: evt.candidate });
            console.log("Received Candidate...");
            this._peer.addIceCandidate(candidate);
        };

        WebRTCConnector.prototype._sendSDP = function (sdp) {
            var text = JSON.stringify(sdp);
            console.log("---sending sdp text ---");

            // send via socket
            this._socket.send(sdp); // <--- ここを追加
        };

        WebRTCConnector.prototype._sendCandidate = function (candidate) {
            var text = JSON.stringify(candidate);
            console.log("---sending candidate text ---");

            // send via socket
            this._socket.send(candidate); // <--- ここを追加
        };

        WebRTCConnector.prototype._sendOffer = function () {
            var _this = this;
            this._peer.createOffer(function (sessionDescription) {
                _this._peer.setLocalDescription(sessionDescription);
                console.log("Sending: SDP");
                _this._sendSDP(sessionDescription);
            }, function (errorInformation) {
                console.log("Create Offer failed");
            }, this._mediaConstraits);
        };

        WebRTCConnector.prototype._setOffer = function (evt) {
            if (this._peer) {
                console.error('peerConnection alreay exist!');
            }

            this._peer.setRemoteDescription(new RTCSessionDescription(evt));
        };

        WebRTCConnector.prototype._sendAnswer = function (evt) {
            var _this = this;
            console.log('sending Answer. Creating remote session description...');
            if (!this._peer) {
                console.error('peerConnection NOT exist!');
                return;
            }

            this._peer.createAnswer(function (sessionDescription) {
                _this._peer.setLocalDescription(sessionDescription);
                console.log("Sending: SDP");
                _this._sendSDP(sessionDescription);
            }, function (errorInformation) {
                console.log("Create Answer failed");
            }, this._mediaConstraits);
        };

        WebRTCConnector.prototype._setAnswer = function (evt) {
            if (!this._peer) {
                console.error('peerConnection NOT exist!');
                return;
            }
            this._peer.setRemoteDescription(new RTCSessionDescription(evt));
        };
        return WebRTCConnector;
    })();
    RomoRTC.WebRTCConnector = WebRTCConnector;
})(RomoRTC || (RomoRTC = {}));
//# sourceMappingURL=WebRtc.js.map

/// <reference path="typings/tsd.d.ts" />
/// <reference path="WebSockManager.ts" />

module WebRTCSample{
    export class WebRTCConnector{
        private _socket: NetworkIf = null;
        private _peer: RTCPeerConnection = null;
        private _mediaConstraits: RTCMediaConstraints = {mandatory: {OfferToReceiveAudio: true, OfferToReceiveVideo: true }};
        private _localStream: any;
        private _localVideo: any;
        private _remoteVideo: any;
        private _pcConfig: any;

        constructor(socket: NetworkIf, mediaConstraints: RTCMediaConstraints, pcConfig: any) {
            this._localVideo = document.getElementById('local-video');
            this._remoteVideo = document.getElementById('remote-video');
            this._socket = socket;
            this._socket.onRecv = this._onMessage;
            this._socket.onClose = this._onClose;
            this._mediaConstraits = mediaConstraints;
            this._pcConfig = pcConfig;
            
            (<Navigator>navigator).getUserMedia = (<Navigator>navigator).getUserMedia || (<Navigator>navigator).webkitGetUserMedia || (<Navigator>navigator).mozGetUserMedia;
            RTCPeerConnection = (<any>window).webkitRTCPeerConnection || (<any>window).mozRTCPeerConnection;
            RTCSessionDescription = (<any>window).RTCSessionDescription || (<any>window).webkitRTCSessionDescription || (<any>window).mozRTCSessionDescription;
            RTCIceCandidate = (<any>window).RTCIceCandidate || (<any>window).webkitRTCIceCandidate || (<any>window).mozRTCIceCandidate;
            (<Navigator>navigator).getUserMedia(
                { audio: true, video: true },
                this._onSuccessGetUserMedia,
                (error:Error)=> {
                    console.log(error.name + ":" + error.message);
                }
            );
        }

        private _onSuccessGetUserMedia = (stream: any)=>{
            try {
                this._localStream = stream;
                this._localVideo.src = (<any>window).URL.createObjectURL(stream);
                this._localVideo.play();

                this._peer = new RTCPeerConnection(this._pcConfig);
                var dataChannel = this._peer.createDataChannel('RTCDataChannel');

                dataChannel.onopen = function(evt){
                    console.log("ondatachannel");
                };
            } catch (e) {
                console.log("Failed to create peerConnection, exception: " + e.message);
            }

            // send any ice candidates to the other peer
            this._peer.onicecandidate = (evt)=>{
                if (evt.candidate) {
                    this._socket.send({type: "candidate",
                            sdpMLineIndex: evt.candidate.sdpMLineIndex,
                            sdpMid: evt.candidate.sdpMid,
                            candidate: evt.candidate.candidate}
                    );
                } else {
                }
            };

            this._peer.addStream(this._localStream);

            // when remote adds a stream, hand it on to the local video element
            var onRemoteStreamAdded = (event)=>{
                this._remoteVideo.src = (<any>window).URL.createObjectURL(event.stream);
            };

            // when remote removes a stream, remove it from the local video element
            var onRemoteStreamRemoved = (event)=>{
                this._remoteVideo.src = "";
            };

            this._peer.onaddstream = onRemoteStreamAdded;
            this._peer.onremovestream = onRemoteStreamRemoved;
        };

        public startConnecting(){
            if(this._peer == null || this._peer.signalingState != 'closed'){
                this._peer.createOffer((sessionDescription: RTCSessionDescription)=>{ // in case of success
                    this._peer.setLocalDescription(sessionDescription);
                    this._socket.send(sessionDescription);
                }, (errorInformation: DOMError)=>{ // in case of error
                    console.log("Create Offer failed");
                }, this._mediaConstraits);
            }
        }

        private _onOffer(evt: RTCSessionDescriptionInit) {
            try {
                this._peer.setRemoteDescription(new RTCSessionDescription(evt), ()=> {
                    this._peer.createAnswer((sessionDescription: RTCSessionDescription)=>{ // in case of success
                        this._peer.setLocalDescription(sessionDescription, ()=>{
                            this._socket.send(sessionDescription);
                        });
                    }, (errorInformation: DOMError)=>{ // in case of error
                        console.log("Create Answer failed " + errorInformation);
                    }, this._mediaConstraits);
                }, (error)=>{
                    console.log(error);
                });
            } catch (e) {
                console.log(e);
            }
        }

        private _onCandidate(evt: RTCIceCandidate) {
            var candidate = new RTCIceCandidate({sdpMLineIndex:evt.sdpMLineIndex, sdpMid:evt.sdpMid, candidate:evt.candidate});
            this._peer.addIceCandidate(candidate);
        }

        private _onAnswer(evt: RTCSessionDescriptionInit) {
            if (! this._peer) {
                console.error('peerConnection NOT exist!');
                return;
            }

            this._peer.setRemoteDescription(new RTCSessionDescription(evt), ()=>{
            });
        }

        // NetworkIf callbacks
        private _onMessage = (evt: any)=>{
            if (evt.type === 'offer') {
                this._onOffer(evt);
            } else if (evt.type === 'answer') {
                this._onAnswer(evt);
            } else if (evt.type === 'candidate') {
                this._onCandidate(evt);
            }
        };

        private _onClose = ()=>{

        };
    }
}

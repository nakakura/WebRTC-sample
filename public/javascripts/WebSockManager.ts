/// <reference path="typings/tsd.d.ts" />

module WebRTCSample{
    export interface NetworkIf{
        send(message: any);
        onRecv(message: any);
        onClose();
    }

    export class WebSockManager implements NetworkIf{
        private _webSocket: WebSocket = null;

        constructor(url: string){
            this._webSocket = new WebSocket("ws://localhost:9001/");
            this._webSocket.onopen = this._onOpen;
            this._webSocket.onclose = this._onClose;
            this._webSocket.onmessage = this._onMessage;
            this._webSocket.onerror = this._onError;
        }

        public send(message: any){
            this._webSocket.send(JSON.stringify(message));
        }

        public onRecv = (message: any)=>{};

        public onClose = ()=>{};

        // websocket callbacks
        private _onOpen = ()=>{

        };

        private _onMessage = (message: any)=>{
            var evt: any = JSON.parse(message.data);
            if (evt.type === 'offer' || evt.type === 'answer' || evt.type === 'candidate') {
                this.onRecv(evt);
            } else{
            }
        };

        private _onClose = ()=>{
            this.onClose();
        };

        private _onError = (error: any)=>{
            this.onClose();
        };
    }
}

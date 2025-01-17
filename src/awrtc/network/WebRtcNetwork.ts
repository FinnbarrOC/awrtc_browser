﻿/*
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

//import {ConnectionId, NetworkEvent, NetEventType, IBasicNetwork} from './INetwork'
import {
    SignalingInfo, SignalingConfig, WebRtcPeerState, WebRtcDataPeer,
    NetworkEvent, NetEventType, ConnectionId, IBasicNetwork}  from "./index"
import { Queue, SLog, Output } from "./Helper";

export enum WebRtcNetworkServerState {
    Invalid,
    Offline,
    Starting,
    Online
}
/// <summary>
/// Native version of WebRtc
/// 
/// Make sure to use Shutdown before unity quits! (unity will probably get stuck without it)
/// 
/// 
/// </summary>
export class WebRtcNetwork implements IBasicNetwork {
    
    public static SHARE_CONNECTION_IDS: boolean = true;  // Added to be consistent with native class AWebRtcNetwork

    private mTimeout = 60000;

    private mInSignaling: { [id: number]: WebRtcDataPeer } = {}
    private mNextId: ConnectionId = new ConnectionId(1);
    private mSignaling: SignalingConfig = null;
    private mEvents: Queue<NetworkEvent> = new Queue<NetworkEvent>();
    private mIdToConnection: { [id: number]: WebRtcDataPeer } = {};
    protected get IdToConnection() {
        return this.mIdToConnection;
    }
    //must be the same as the hashmap and later returned read only (avoids copies)
    private mConnectionIds: Array<ConnectionId> = new Array<ConnectionId>();
    //only for internal use
    public GetConnections(): Array<ConnectionId> {
        return this.mConnectionIds;
    }

    private mServerState = WebRtcNetworkServerState.Offline;
    private mRtcConfig: RTCConfiguration;
    private mSignalingNetwork: IBasicNetwork;
    private mLogDelegate: (s: string) => void;
    private mIsDisposed = false;

//just for debugging / testing
    public SetLog(logDel: (s: string) => void) {
        this.mLogDelegate = logDel;
    }

    //public
    public constructor(signalingConfig: SignalingConfig, lRtcConfig: RTCConfiguration) {
        this.mSignaling = signalingConfig;
        this.mSignalingNetwork = this.mSignaling.GetNetwork();
        this.mRtcConfig = lRtcConfig;
    }

    public StartServer(): void;
    public StartServer(address: string): void;
    public StartServer(address?: string): void {
        this.StartServerInternal(address);
    }

    protected StartServerInternal(address?: string): void {
        this.mServerState = WebRtcNetworkServerState.Starting;
        this.mSignalingNetwork.StartServer(address);
    }
    
    public GetSignalingNetwork(): IBasicNetwork {
        return this.mSignalingNetwork;
    }

    public StopServer(): void {
        if (this.mServerState == WebRtcNetworkServerState.Starting) {
            this.mSignalingNetwork.StopServer();

            //removed. the underlaying sygnaling network should set those values
            //this.mServerState = WebRtcNetworkServerState.Offline;
            //this.mEvents.Enqueue(new NetworkEvent(NetEventType.ServerInitFailed, ConnectionId.INVALID, null));
        }
        else if (this.mServerState == WebRtcNetworkServerState.Online) {
            //dont wait for confirmation
            this.mSignalingNetwork.StopServer();
            //removed. the underlaying sygnaling network should set those values
            //this.mServerState = WebRtcNetworkServerState.Offline;
            //this.mEvents.Enqueue(new NetworkEvent(NetEventType.ServerClosed, ConnectionId.INVALID, null));

        }
    }

    public Connect(address: string): ConnectionId {
        return this.AddOutgoingConnection(address);
    }

    public Update(): void {
        this.CheckSignalingState();
        this.UpdateSignalingNetwork();
        this.UpdatePeers();
    }

    public Dequeue(): NetworkEvent {
        if (this.mEvents.Count() > 0)
            return this.mEvents.Dequeue();
        return null;
    }

    public Peek(): NetworkEvent {

        if (this.mEvents.Count() > 0)
            return this.mEvents.Peek();
        return null;
    }

    public Flush(): void {
        this.mSignalingNetwork.Flush();
    }

    public SendData(id: ConnectionId, data: Uint8Array/*, offset : number, length : number*/, reliable: boolean): boolean {
        if (id == null || data == null || data.length == 0)
            return;
        let peer = this.mIdToConnection[id.id];
        if (peer) {
            return peer.SendData(data,/* offset, length,*/ reliable);

        } else {
            SLog.LogWarning("unknown connection id");
            return false;
        }
    }
    public GetBufferedAmount(id: ConnectionId, reliable: boolean): number {
        let peer = this.mIdToConnection[id.id];
        if (peer) {
            return peer.GetBufferedAmount(reliable);

        } else {
            SLog.LogWarning("unknown connection id");
            return -1;
        }
    }
    

    public Disconnect(id: ConnectionId): void {
        let peer = this.mIdToConnection[id.id];
        if (peer) {
            this.HandleDisconnect(id);
        }
    }

    public Shutdown(): void {
        //bugfix. Make copy before the loop as Disconnect changes the original mConnectionIds array
        let ids = this.mConnectionIds.slice();
        for (var id of ids) {
            this.Disconnect(id);
        }
        this.StopServer();
        this.mSignalingNetwork.Shutdown();
    }


    protected DisposeInternal() {
        if (this.mIsDisposed == false) {
            this.Shutdown();
            this.mIsDisposed = true;
        }
    }

    public Dispose(): void {
        this.DisposeInternal();
    }

//protected
    protected CreatePeer(peerId: ConnectionId, rtcConfig: RTCConfiguration): WebRtcDataPeer
    {
        let peer = new WebRtcDataPeer(peerId, rtcConfig);
        return peer;
    }
//private
    private CheckSignalingState() {
        let connected = new Array<ConnectionId>();
        let failed = new Array<ConnectionId>();

        //update the signaling channels
        for (let key in this.mInSignaling) {

            let peer = this.mInSignaling[key];
            peer.Update();
            let timeAlive = peer.SignalingInfo.GetCreationTimeMs();

            let msg = new Output<string>();
            while (peer.DequeueSignalingMessage(msg)) {
                let buffer = this.StringToBuffer(msg.val);
                this.mSignalingNetwork.SendData(new ConnectionId(+key), buffer, true);
            }

            if (peer.GetState() == WebRtcPeerState.Connected) {
                connected.push(peer.SignalingInfo.ConnectionId);
            }
            else if (peer.GetState() == WebRtcPeerState.SignalingFailed || timeAlive > this.mTimeout) {
                failed.push(peer.SignalingInfo.ConnectionId);
            }
        }


        for (var v of connected) {
            this.ConnectionEstablished(v);
        }

        for (var v of failed) {
            this.SignalingFailed(v);
        }
    }

    private UpdateSignalingNetwork(): void {
        //update the signaling system
        this.mSignalingNetwork.Update();


        let evt: NetworkEvent;

        while ((evt = this.mSignalingNetwork.Dequeue()) != null) {
            if (evt.Type == NetEventType.ServerInitialized) {

                this.mServerState = WebRtcNetworkServerState.Online;
                this.mEvents.Enqueue(new NetworkEvent(NetEventType.ServerInitialized, ConnectionId.INVALID, evt.RawData));

            } else if (evt.Type == NetEventType.ServerInitFailed) {


                this.mServerState = WebRtcNetworkServerState.Offline;
                this.mEvents.Enqueue(new NetworkEvent(NetEventType.ServerInitFailed, ConnectionId.INVALID, evt.RawData));

            } else if (evt.Type == NetEventType.ServerClosed) {

                this.mServerState = WebRtcNetworkServerState.Offline;
                this.mEvents.Enqueue(new NetworkEvent(NetEventType.ServerClosed, ConnectionId.INVALID, evt.RawData));

            } else if (evt.Type == NetEventType.NewConnection) {

                //check if new incoming connection or an outgoing was established

                let peer = this.mInSignaling[evt.ConnectionId.id];
                if (peer) {
                    peer.StartSignaling();
                } else {
                    this.AddIncomingConnection(evt.ConnectionId);
                }

            } else if (evt.Type == NetEventType.ConnectionFailed) {

                //Outgoing connection failed
                this.SignalingFailed(evt.ConnectionId);

            } else if (evt.Type == NetEventType.Disconnected) {


                let peer = this.mInSignaling[evt.ConnectionId.id];
                if (peer) {
                    peer.SignalingInfo.SignalingDisconnected();
                }

                //if signaling was completed this isn't a problem
                //SignalingDisconnected(evt.ConnectionId);

                //do nothing. either webrtc has enough information to connect already
                //or it will wait forever for the information -> after 30 sec we give up
            } else if (evt.Type == NetEventType.ReliableMessageReceived) {

                let peer = this.mInSignaling[evt.ConnectionId.id];
                if (peer) {
                    let msg = this.BufferToString(evt.MessageData);
                    peer.AddSignalingMessage(msg);
                } else {
                    // No longer logging warnings for this because it happens randomly and is not problematic
                    // SLog.LogWarning("Signaling message from unknown connection received, id: " + evt.ConnectionId.id);
                }
            }
        }
    }

    private UpdatePeers(): void {
        //every peer has a queue storing incoming messages to avoid multi threading problems -> handle it now
        let disconnected = new Array<ConnectionId>();
        for (var key in this.mIdToConnection) {
            var peer: WebRtcDataPeer = this.mIdToConnection[key];
            peer.Update();

            let ev = new Output<NetworkEvent>();

            while (peer.DequeueEvent(/*out*/ ev)) {
                this.mEvents.Enqueue(ev.val);
            }

            if (peer.GetState() == WebRtcPeerState.Closed) {
                disconnected.push(peer.ConnectionId);
            }
        }

        for (let key of disconnected) {
            this.HandleDisconnect(key);
        }
    }
    
    private AddOutgoingConnection(address: string): ConnectionId {
        let signalingConId = this.mSignalingNetwork.Connect(address);
        SLog.L("new outgoing connection");
        let info = new SignalingInfo(signalingConId, false, Date.now());
        let peer = this.CreatePeer(this.NextConnectionId(signalingConId), this.mRtcConfig);
        peer.SetSignalingInfo(info);
        this.mInSignaling[signalingConId.id] = peer;
        return peer.ConnectionId;
    }

    private AddIncomingConnection(signalingConId: ConnectionId): ConnectionId {
        SLog.L("new incoming connection");
        let info = new SignalingInfo(signalingConId, true, Date.now());
        let peer = this.CreatePeer(this.NextConnectionId(signalingConId), this.mRtcConfig);
        peer.SetSignalingInfo(info);
        this.mInSignaling[signalingConId.id] = peer;
        //passive way of starting signaling -> send out random number. if the other one does the same
        //the one with the highest number starts signaling
        peer.NegotiateSignaling();
        return peer.ConnectionId;
    }
    
    private ConnectionEstablished(signalingConId: ConnectionId): void {
        let peer = this.mInSignaling[signalingConId.id];

        delete this.mInSignaling[signalingConId.id];
        this.mSignalingNetwork.Disconnect(signalingConId);

        this.mConnectionIds.push(peer.ConnectionId);
        this.mIdToConnection[peer.ConnectionId.id] = peer;
        this.mEvents.Enqueue(new NetworkEvent(NetEventType.NewConnection, peer.ConnectionId, null));
    }

    private SignalingFailed(signalingConId: ConnectionId): void {
        let peer = this.mInSignaling[signalingConId.id];
        if (peer) {
            //connection was still believed to be in signaling -> notify the user of the event
            delete this.mInSignaling[signalingConId.id];
            this.mEvents.Enqueue(new NetworkEvent(NetEventType.ConnectionFailed, peer.ConnectionId, null));

            if (peer.SignalingInfo.IsSignalingConnected()) {
                this.mSignalingNetwork.Disconnect(signalingConId);
            }
            peer.Dispose();
        }
    }

    private HandleDisconnect(id: ConnectionId): void {
        let peer = this.mIdToConnection[id.id];
        if (peer) {
            peer.Dispose();
        }
        //search for the index to remove the id (user might provide a different object with the same id
        //don't use indexOf!
        let index = this.mConnectionIds.findIndex( e => e.id == id.id);
        if (index != -1) {
            this.mConnectionIds.splice(index, 1);
            delete this.mIdToConnection[id.id];
        }
        
        let ev = new NetworkEvent(NetEventType.Disconnected, id, null);
        this.mEvents.Enqueue(ev);
    }

    private NextConnectionId(signalingId: ConnectionId): ConnectionId {
        if (WebRtcNetwork.SHARE_CONNECTION_IDS)
            return signalingId;
        let id = new ConnectionId(this.mNextId.id);
        this.mNextId.id++;
        return id;
    }

    private StringToBuffer(str: string): Uint8Array {
        let buf = new ArrayBuffer(str.length * 2);
        let bufView = new Uint16Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }

        let result = new Uint8Array(buf);
        return result;
    }

    private BufferToString(buffer: Uint8Array): string {
        let arr = new Uint16Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 2);
        return String.fromCharCode.apply(null, arr);
    }
    
}

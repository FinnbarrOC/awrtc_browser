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
import {ConnectionId, NetworkEvent, NetEventType} from "./index"
import {Queue} from "./Helper";

declare var unityInstance;  // Allows calling SendMessage() on the Unity game instance as defined in game's index.html

class SignalingDataStruct {
    ServerId: number;
    RecipientId: number;
    SenderId: number;
    Data: number[];
    Offset: number;
    Length: number;
    Reliable: boolean;

    constructor(serverId: number, recipientId: number, senderId: number, data: Uint8Array, reliable: boolean) {
        this.ServerId = serverId;
        this.RecipientId = recipientId;
        this.SenderId = senderId;
        this.Data = Array.from(data);
        this.Offset = data.byteOffset;
        this.Length = data.byteLength;
        this.Reliable = reliable;
    }
}

class DisconnectStruct {
    ServerId: number;
    RecipientId: number;
    DisconnectingId: number;

    constructor(serverId: number, recipientId: number, disconnectingId: number) {
        this.ServerId = serverId;
        this.RecipientId = recipientId;
        this.DisconnectingId = disconnectingId;
    }
}

/**Use instead of a WebsocketNetwork for signaling
 * within a Unity WebGL build using an in-game
 * networking solution (e.g. PUN2).
 *
 * Remember to implement any methods you call here on the Unity side
 * in any class on a GameObject named "VoiceChatManager"
 */
export class UnitySignalingNetwork {

    private static mNextInstanceId: number = 1;
    private mId: number;

    private mLocalServerAddress: string = null;
    private mLocalUnityId: ConnectionId;

    private mNetworkEventQueue = new Queue<NetworkEvent>();
    private mConnectedPlayerIds = new Set<ConnectionId>();

    private mHasBeenDisposed = false;

    public constructor(localUnityId: string) {
        this.mLocalUnityId = new ConnectionId(parseInt(localUnityId));

        this.mId = UnitySignalingNetwork.mNextInstanceId;
        UnitySignalingNetwork.mNextInstanceId++;
    }

    public get IsServer() {
        return this.mLocalServerAddress != null;
    }

    public StartServer(serverAddress: string = null): void {
        if (serverAddress == null || serverAddress == "") {
            this.Enqueue(NetEventType.ServerInitFailed, ConnectionId.INVALID, serverAddress);
            return;
        }

        this.mLocalServerAddress = serverAddress;

        this.Enqueue(NetEventType.ServerInitialized, ConnectionId.INVALID, serverAddress);
    }

    public StopServer(): void {
        if (this.IsServer) {
            this.Enqueue(NetEventType.ServerClosed, ConnectionId.INVALID, this.mLocalServerAddress);
            this.mLocalServerAddress = null;
        }
    }

    public Connect(address: string): ConnectionId {
        const serverId = new ConnectionId(parseInt(address.split('_').pop()));

        if (this.IsServer == true) {
            console.error("Must be client to send this connection");
            return serverId;
        }

        this.mConnectedPlayerIds.add(serverId);

        console.log("Creating outgoing connection to " + address + " id: " + serverId);

        this.Enqueue(NetEventType.NewConnection, serverId, null);

        // TODO: can add more error checking and call this
        // this.Enqueue(NetEventType.ConnectionFailed, serverId, "Couldn't connect to server at address " + address);

        return serverId;
    }

    // TODO: needs to be called by Unity somehow
    private ReceiveConnect(clientId: ConnectionId): void {
        if (this.IsServer == false) {
            console.error("Must be server to receive this connection");
            return;
        }

        this.mConnectedPlayerIds.add(clientId);

        console.log("New incoming connection with id " + clientId);

        this.Enqueue(NetEventType.NewConnection, clientId, null);

        // TODO: can add more error checking and call this
        // this.Enqueue(NetEventType.ConnectionFailed, clientId, "Couldn't connect to client with id " + clientId);
    }

    public Shutdown(): void {
        console.log("Shutdown called");
        for (let connectionId of Array.from(this.mConnectedPlayerIds)) {
            this.Disconnect(connectionId);
        }

        this.mConnectedPlayerIds.clear();
        this.StopServer();
    }

    public SendData(userId: ConnectionId, data: Uint8Array, reliable: boolean): boolean {

        const serverId = this.IsServer ? this.mLocalUnityId.id : userId.id;

        const signalingDataStruct = new SignalingDataStruct(serverId, userId.id, this.mLocalUnityId.id, data, reliable);

        // Unity methods called with SendMessage can ONLY take one parameter, so pass everything as JSON
        unityInstance.SendMessage("VoiceChatManager", "SendSignalingData", JSON.stringify(signalingDataStruct));

        return true;
    }

    // TODO: needs to be called by Unity somehow
    public ReceiveSignalingData(userId: ConnectionId, data: ArrayBufferLike, offset: number, length: number, reliable: boolean): void {

        let buffer = new Uint8Array(data, offset, length);

        let type = reliable ? NetEventType.ReliableMessageReceived : NetEventType.UnreliableMessageReceived;

        this.Enqueue(type, userId, buffer);
    }

    public Dequeue(): NetworkEvent {
        return this.mNetworkEventQueue.Dequeue();
    }

    public Peek(): NetworkEvent {
        return this.mNetworkEventQueue.Peek();
    }


    public Flush(): void {

    }

    public Disconnect(id: ConnectionId): void {
        if (this.mConnectedPlayerIds.has(id)) {

            // Local player disconnects from the other player
            this.ReceiveDisconnect(id);

            const serverId = this.IsServer ? this.mLocalUnityId.id : id.id;

            const disconnectStruct = new DisconnectStruct(serverId, id.id, this.mLocalUnityId.id);

            // Unity methods called with SendMessage can ONLY take one parameter, so pass everything as JSON
            unityInstance.SendMessage("VoiceChatManager", "SendDisconnect", JSON.stringify(disconnectStruct));
        }
    }

    private Enqueue(type: NetEventType, id: ConnectionId, data: any): void {
        let ev = new NetworkEvent(type, id, data);
        this.mNetworkEventQueue.Enqueue(ev);
    }

    // TODO: needs to be called by Unity somehow
    public ReceiveDisconnect(id: ConnectionId): void {
        if (id.id in this.mConnectedPlayerIds) {
            this.Enqueue(NetEventType.Disconnected, id, null);
            delete this.mConnectedPlayerIds[id.id];
        }
    }

    public Update(): void {

    }

    public Dispose(): void {
        if (this.mHasBeenDisposed == false) {
            this.Shutdown();
        }
    }
}
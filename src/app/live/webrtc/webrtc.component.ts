import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { LiveService } from '../live.service';
import { environment } from '../../../environments/environment';
import '../../../extention/RTCPeerConnection';

@Component({
    selector: 'video-webrtc',
    templateUrl: './webrtc.component.html',
    styleUrls: ['./webrtc.component.css'],
})
export class WebrtcComponent implements OnInit, OnDestroy {
    /** input parameter */
    @Input() signalingUrl: string = environment.signalingUrl;

    /** WebRTC element */
    selectedCameraId: string;
    peerConnection: RTCPeerConnection;
    dataChannels: RTCDataChannel[] = [];
    reconnectingInterval: NodeJS.Timer;
    signalingServer: signalR.HubConnection;
    @ViewChild('webrtcVideo', { static: true }) webrtcVideo: ElementRef<HTMLVideoElement>;

    constructor(private liveService: LiveService) {
        console.info(this.signalingServer);
        this.signalingServer = new signalR.HubConnectionBuilder()
            .withUrl(this.signalingUrl)
            .configureLogging(signalR.LogLevel.Information)
            .withAutomaticReconnect()
            .build();
    }

    ngOnInit() {
        this.liveService.startRTCPeerSubject$.subscribe((cameraId: string) => {
            console.log('===========', cameraId);
            this.selectedCameraId = cameraId;
            if (cameraId) {
                this.startRTCPeer(cameraId);
            } else {
                this.closeRTCPeer();
            }
        });

        this.liveService.showRTCPeerSubject$.subscribe((res: boolean) => {
            if (res) {
                this.showRTCPeer();
            }
        });

        this.liveService.sendMessageSubject$.subscribe((res: boolean) => {
            if (res) {
                this.sendMessage();
            }
        });
    }

    ngOnDestroy() {
        this.closeRTCPeer();
    }

    showRTCPeer() {
        console.log('showRTCPeer: autoplay');
        const promise = document.querySelector('video').play();

        if (promise !== undefined) {
            promise.then(_ => {
                console.log('Autoplay started!');
            }).catch(error => {
                // Autoplay was prevented.
                console.log('Autoplay error:', error);
            });
        }
    }

    startRTCPeer(cameraId: string) {
        if (this.peerConnection) {
            this.closeRTCPeer();
        }

        if (cameraId || !this.peerConnection) {
            this.peerConnection = this.createPeerConnection(cameraId);
        }
    }

    closeRTCPeer() {
        this.dataChannels.forEach(element => {
            element.close();
        });
        this.dataChannels = [];

        if (this.peerConnection) {
            this.peerConnection.close();
            this.liveService.setRTCStatus(this.peerConnection.connectionState);
        }
        this.peerConnection = null;
    }

    private createPeerConnection(cameraId: string): RTCPeerConnection {
        const peer = new RTCPeerConnection(environment.peerConnectionConfig)
            .setSignalingServer(this.signalingServer)
            .setCamera(cameraId)
            //.withListeningOffer()
            .withStartOffer()
            .build();

        peer.onicecandidate = ev => {
            if (peer.type == 'answer') {
                console.log('answerLocalIceToRemote', ev.candidate);
                peer.answerLocalIceToRemote(ev.candidate);
            } else if (peer.type == 'offer') {
                console.log('offerLocalIceToRemote', ev.candidate);
                peer.offerLocalIceToRemote(ev.candidate);
            }
        };

        peer.onconnectionstatechange = ev => {
            console.log("onconnectionstatechange: ", ev);
        };

        peer.ondatachannel = (e: RTCDataChannelEvent) => {
            console.log('conneceted channel: ' + e.channel.label);
            e.channel.onmessage = (ev) => this.onReceiveMessage(ev);
            this.dataChannels.push(e.channel);
        };

        peer.ontrack = (ev) => {
            if (ev.type === 'track' && ev.track.kind === 'video') {
                this.webrtcVideo.nativeElement.srcObject = new MediaStream([ev.track]);
            }
        };

        peer.onconnectionstatechange = (ev) => {
            this.liveService.setRTCStatus(peer.connectionState);
            if (peer.connectionState === 'connected') {
                clearInterval(this.reconnectingInterval);
            }
        };

        peer.oniceconnectionstatechange = (ev) => {
            if (peer.iceConnectionState === 'disconnected') {
                this.closeRTCPeer();
                // this.reconnectPeerConnection(cameraId);
            }
        };

        peer.addTransceiver('video', { direction: 'recvonly' });
        peer.addTransceiver('audio', { direction: 'recvonly' });

        return peer;
    }

    private reconnectPeerConnection(cameraId: string) {
        this.reconnectingInterval = setInterval(
            () => {
                console.log(`WebRTC reconnect to ${cameraId}!!!`);
                this.startRTCPeer(cameraId);
            },
            5000,
        );
    }

    private sendMessage() {
        // todo: send msg to server?
        this.dataChannels.forEach((v, i, _) => {
            v.send(`${i} hello server, nice to meet you :)`);
        });
    }

    private onReceiveMessage(event: MessageEvent) {
        // Todo: recieve the position data from server.
        console.log(new TextDecoder('utf-8').decode(event.data));
    }
}

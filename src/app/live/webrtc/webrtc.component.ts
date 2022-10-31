import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject, takeUntil } from 'rxjs';
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
    peerConnection: RTCPeerConnection;
    dataChannels: RTCDataChannel[] = [];
    reconnectingInterval: NodeJS.Timer;
    forceInterruptInterval: NodeJS.Timer;
    signalingServer: signalR.HubConnection;
    @ViewChild('webrtcVideo', { static: true }) webrtcVideo: ElementRef<HTMLVideoElement>;

    unsubscriber: Subject<boolean> = new Subject();

    constructor(private liveService: LiveService) {
        this.signalingServer = new signalR.HubConnectionBuilder()
            .withUrl(this.signalingUrl)
            .configureLogging(signalR.LogLevel.Information)
            .withAutomaticReconnect()
            .build();
    }

    ngOnInit() {
        this.liveService.connectRTCPeerSubject$.pipe(takeUntil(this.unsubscriber)).subscribe((onoff: boolean) => {
            console.log('==== connectRTCPeer ====', onoff);
            if (onoff) {
                this.startRTCPeer();
                this.forceInterruptInterval = setInterval(() => {
                    this.liveService.connectRTCPeer(false);
                }, 20000);
            } else {
                this.closeRTCPeer();
            }
        });

        this.liveService.sendMessageSubject$.pipe(takeUntil(this.unsubscriber)).subscribe((msg: string) => {
            if (msg) {
                this.sendMessage(msg);
            }
        });
    }

    ngOnDestroy() {
        this.closeRTCPeer();
        this.unsubscriber.next(true);
        this.unsubscriber.complete();
    }

    startRTCPeer() {
        if (this.peerConnection) {
            this.closeRTCPeer();
        }

        if (!this.peerConnection) {
            this.peerConnection = this.createPeerConnection();

            let playPromise = this.webrtcVideo.nativeElement.play();
            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    // Automatic playback started!
                    // Show playing UI.
                }).catch(error => {
                    // Auto-play was prevented
                    // Show paused UI.
                });
            }
        }
    }

    closeRTCPeer() {
        this.dataChannels.forEach(element => {
            element.close();
        });
        this.dataChannels = [];

        if (this.peerConnection) {
            this.peerConnection.close();
            this.liveService.isConnected(false);
            this.liveService.setRTCStatus(this.peerConnection.connectionState);
        }
        this.peerConnection = null;
        clearInterval(this.forceInterruptInterval);
    }

    private createPeerConnection(): RTCPeerConnection {
        const peer = new RTCPeerConnection(environment.peerConnectionConfig);

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
                clearInterval(this.forceInterruptInterval);
                this.liveService.isConnected(true);
            } else if (peer.connectionState === 'disconnected') {
                // this.reconnectPeerConnection();
                this.liveService.isConnected(false);
            }
        };

        peer.addTransceiver('video', { direction: 'recvonly' });
        peer.addTransceiver('audio', { direction: 'recvonly' });

        return peer.setSignalingUrl(this.signalingServer)
            .listenTopics("offer")
            .build();
    }

    private reconnectPeerConnection() {
        this.reconnectingInterval = setInterval(
            () => {
                console.log(`WebRTC reconnect!!!`);
                this.startRTCPeer();
            },
            5000,
        );
    }

    private sendMessage(msg: string) {
        // todo: send msg to server?
        this.dataChannels.forEach((v, i, _) => {
            v.send(`${i} hello server :) => ${msg}`);
        });
    }

    private onReceiveMessage(event: MessageEvent) {
        // Todo: recieve the position data from server.
        console.log(new TextDecoder('utf-8').decode(event.data));
    }
}

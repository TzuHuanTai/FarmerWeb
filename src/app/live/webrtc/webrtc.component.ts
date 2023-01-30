import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { pipe, Subject, takeUntil } from 'rxjs';
import { LiveService } from '../live.service';
import { environment } from '../../../environments/environment';
import '../../../extention/RTCPeerConnection';
import { Codecs } from '../../../extention/RTCPeerConnection';

@Component({
    selector: 'video-webrtc',
    templateUrl: './webrtc.component.html',
    styleUrls: ['./webrtc.component.css'],
})
export class WebrtcComponent implements OnInit, OnDestroy {
    /** input parameter */
    @Input() codec: Codecs;
    @Input() signalingUrl: string = environment.signalingUrl;

    /** WebRTC element */
    peerConnection: RTCPeerConnection;
    dataChannel: RTCDataChannel;
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

        this.liveService.recordingSubject$.pipe(takeUntil(this.unsubscriber)).subscribe((onoff: boolean) => {
            // TODO: send json format
            this.dataChannel?.send(onoff ? '1' : '0');
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
        this.dataChannel?.close();

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

        this.dataChannel = peer.createDataChannel("record_cmd_channel");
        this.dataChannel.onmessage = (ev) => this.onReceiveMessage(ev);

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

        // peer.ondatachannel = (e: RTCDataChannelEvent) => {
        //     console.log('conneceted channel: ' + e.channel.label);
        //     e.channel.onmessage = (ev) => this.onReceiveMessage(ev);
        //     this.dataChannels.push(e.channel);
        // };

        peer.ontrack = (ev) => {
            if (this.webrtcVideo.nativeElement.srcObject !== ev.streams[0]) {
                this.webrtcVideo.nativeElement.srcObject = ev.streams[0];
                console.log('received remote stream', ev);
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
            .setCodec(this.codec)
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

    private onReceiveMessage(event: MessageEvent) {
        // Todo: recieve the position data from server.
        console.log(new TextDecoder('utf-8').decode(event.data));
    }
}

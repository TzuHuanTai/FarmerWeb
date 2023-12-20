import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LiveService } from '../live.service';
import { environment, mqClientOptions } from '../../../environments/environment';
import {
    Codecs, MqttClient, RTCPeerConnectionBuilder,
    SignalingService, SignalrClient, CommandType, Command
} from '../../../extention/RTCPeerConnectionBuilder';

@Component({
    selector: 'video-webrtc',
    templateUrl: './webrtc.component.html',
    styleUrls: ['./webrtc.component.css'],
})
export class WebrtcComponent implements OnInit, OnDestroy {
    /** input parameter */
    @Input() codec: Codecs;

    /** WebRTC element */
    peerConnection: RTCPeerConnection;
    dataChannel: RTCDataChannel;
    reconnectingInterval: NodeJS.Timer;
    forceInterruptInterval: NodeJS.Timer;
    signalingClient: SignalingService;
    @ViewChild('webrtcVideo', { static: true }) webrtcVideo: ElementRef<HTMLVideoElement>;

    unsubscriber: Subject<boolean> = new Subject();

    constructor(private liveService: LiveService) { }

    ngOnInit() {
        this.liveService.connectRTCPeerSubject$.pipe(takeUntil(this.unsubscriber)).subscribe((onoff: boolean) => {
            console.log('==== connectRTCPeer ====', onoff);
            if (onoff) {
                this.startRTCPeer();
                this.forceInterruptInterval = setInterval(() => {
                    this.liveService.connectRTCPeer(false);
                }, 20000);
            } else {
                if (this.dataChannel?.readyState === 'open') {
                    let cmd = new Command(CommandType.CONNECT, String(onoff));
                    this.dataChannel.send(JSON.stringify(cmd));
                }
                this.closeRTCPeer();
            }
        });

        this.liveService.recordingSubject$.pipe(takeUntil(this.unsubscriber)).subscribe((onoff: boolean) => {
            let cmd = new Command(CommandType.RECORD, String(onoff));
            this.dataChannel?.send(JSON.stringify(cmd));
        });
    }

    ngOnDestroy() {
        this.closeRTCPeer();
        this.signalingClient?.end();
        this.unsubscriber.next(true);
        this.unsubscriber.complete();
    }

    async startSignaling() {
        const signalingClientBuilder = (protocal: string): SignalingService => {
            if (protocal === 'signalr') {
                return new SignalrClient(environment.signalingUrl);
            } else if (protocal === 'mqtt') {
                return new MqttClient(mqClientOptions);
            } else {
                return null;
            }
        };
        const signalingClient = signalingClientBuilder('signalr');
        await signalingClient.start();

        return signalingClient;
    }

    async startRTCPeer() {
        if (this.peerConnection) {
            this.closeRTCPeer();
        }

        [this.peerConnection, this.dataChannel] = await this.createPeerConnection();
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

    private async createPeerConnection(): Promise<[RTCPeerConnection, RTCDataChannel]> {
        this.signalingClient = await this.startSignaling();

        const OnConnected = (ev) => {
            clearInterval(this.forceInterruptInterval);
            this.liveService.isConnected(true);
            this.signalingClient.end();
        };

        const OnDisconnectedOrFailed = (ev) => {
            this.liveService.isConnected(false);
            this.signalingClient.end();
        };

        const peerBuilder = new RTCPeerConnectionBuilder(this.signalingClient);
        const peer = peerBuilder.setType("offer")
            .setOnConnected(OnConnected)
            .setOnDisconnectedOrFailed(OnDisconnectedOrFailed)
            .setDstElement(this.webrtcVideo.nativeElement)
            .setCodec(this.codec)
            .build();

        return peer;
    }
}

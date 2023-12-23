import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LiveService } from '../live.service';
import {
    Codecs, RTCPeerConnectionBuilder,
    CommandType, Command, ProtocolType
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
        this.unsubscriber.next(true);
        this.unsubscriber.complete();
    }

    async startRTCPeer() {
        if (this.peerConnection) {
            this.closeRTCPeer();
        }

        [this.peerConnection, this.dataChannel] = await this.createPeerConnection();
    }

    closeRTCPeer() {
        this.dataChannel?.close();
        this.peerConnection?.close();
        this.liveService.isConnected(false);
        this.liveService.setRTCStatus(this.peerConnection?.connectionState);
        this.peerConnection = null;

        clearInterval(this.forceInterruptInterval);
    }

    private async createPeerConnection(): Promise<[RTCPeerConnection, RTCDataChannel]> {
        const OnConnected = (ev) => {
            clearInterval(this.forceInterruptInterval);
            this.liveService.isConnected(true);
        };

        const OnDisconnectedOrFailed = (ev) => {
            this.liveService.isConnected(false);
        };

        const peerBuilder = new RTCPeerConnectionBuilder(ProtocolType.SIGNALR);
        const peer = peerBuilder.setType("offer")
            .setOnConnected(OnConnected)
            .setOnDisconnectedOrFailed(OnDisconnectedOrFailed)
            .setDstElement(this.webrtcVideo.nativeElement)
            .setCodec(this.codec)
            .build();

        return peer;
    }
}

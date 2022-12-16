import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable()
export class LiveService {
    private isConnectedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private connectRTCPeerSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private rtcPeerStatusSubject: BehaviorSubject<RTCPeerConnectionState> = new BehaviorSubject<RTCPeerConnectionState>('new');
    private recordingSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    isConnectedSubject$ = this.isConnectedSubject.asObservable();
    connectRTCPeerSubject$ = this.connectRTCPeerSubject.asObservable();
    rtcPeerStatusSubject$ = this.rtcPeerStatusSubject.asObservable();
    recordingSubject$ = this.recordingSubject.asObservable();

    isConnected(isConnected: boolean) {
        this.isConnectedSubject.next(isConnected);
    }

    connectRTCPeer(start: boolean) {
        this.connectRTCPeerSubject.next(start);
    }

    setRTCStatus(status: RTCPeerConnectionState) {
        this.rtcPeerStatusSubject.next(status);
    }

    recordVideo(start: boolean) {
        this.recordingSubject.next(start);
    }
}

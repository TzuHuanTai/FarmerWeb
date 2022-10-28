import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class LiveService {
    private isConnectedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private sendMessageSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private showRTCPeerSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private startRTCPeerSubject: BehaviorSubject<string> = new BehaviorSubject<string>("test");
    private rtcPeerStatusSubject: BehaviorSubject<RTCPeerConnectionState> = new BehaviorSubject<RTCPeerConnectionState>('new');

    isConnectedSubject$ = this.isConnectedSubject.asObservable();
    sendMessageSubject$ = this.sendMessageSubject.asObservable();
    showRTCPeerSubject$ = this.showRTCPeerSubject.asObservable();
    startRTCPeerSubject$ = this.startRTCPeerSubject.asObservable();
    rtcPeerStatusSubject$ = this.rtcPeerStatusSubject.asObservable();

    isConnected(isConnected: boolean) {
        this.isConnectedSubject.next(isConnected);
    }

    sendMessage(isConnected: boolean) {
        this.sendMessageSubject.next(isConnected);
    }

    showRTCPeer(isConnected: boolean) {
        this.showRTCPeerSubject.next(isConnected);
    }

    startRTCPeer(cameraValue: string) {
        this.startRTCPeerSubject.next(cameraValue);
    }

    setRTCStatus(status: RTCPeerConnectionState) {
        this.rtcPeerStatusSubject.next(status);
    }
}

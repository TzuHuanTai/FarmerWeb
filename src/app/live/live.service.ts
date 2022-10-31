import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable()
export class LiveService {
    private isConnectedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private sendMessageSubject: Subject<string> = new Subject<string>();
    private connectRTCPeerSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private rtcPeerStatusSubject: BehaviorSubject<RTCPeerConnectionState> = new BehaviorSubject<RTCPeerConnectionState>('new');

    isConnectedSubject$ = this.isConnectedSubject.asObservable();
    sendMessageSubject$ = this.sendMessageSubject.asObservable();
    connectRTCPeerSubject$ = this.connectRTCPeerSubject.asObservable();
    rtcPeerStatusSubject$ = this.rtcPeerStatusSubject.asObservable();

    isConnected(isConnected: boolean) {
        this.isConnectedSubject.next(isConnected);
    }

    sendMessage(msg: string) {
        this.sendMessageSubject.next(msg);
    }

    connectRTCPeer(start: boolean) {
        this.connectRTCPeerSubject.next(start);
    }

    setRTCStatus(status: RTCPeerConnectionState) {
        this.rtcPeerStatusSubject.next(status);
    }
}

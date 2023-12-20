import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { GpioService } from '../../api/raspberry/rasp_gpio.service';
import { LiveService } from './live.service';
import { Codecs } from '../../extention/RTCPeerConnectionBuilder';

@Component({
    selector: 'app-live',
    templateUrl: './live.component.html',
    styleUrls: ['./live.component.css'],
    providers: [GpioService]
})

export class LiveComponent implements OnInit, OnDestroy {
    isWebrtcConnected: boolean = false;
    isRecording: boolean = false;
    isFullscreen: boolean = false;
    isWebrtcConnecting: boolean = false;
    isWebrtcButtonEnable: boolean = true;
    selectedCodec: Codecs = Codecs.H264;
    gpioCheckedObject: GpioCheckedObject = new GpioCheckedObject();

    @ViewChild('panel', { static: true }) panel: ElementRef<HTMLDivElement>;

    constructor(
        private gpioService: GpioService,
        private liveService: LiveService,
    ) {
    }

    ngOnInit() {
        const wrapperElement = document.getElementsByClassName('wrapper');
        (wrapperElement[0] as HTMLElement).style.display = 'contents';

        this.initializeAllGpioStatus();

        this.subscribeWebrtcIsConnected();

        document.onfullscreenchange = () => {
            if (document.fullscreenElement) {
                this.isFullscreen = true;
            } else {
                this.isFullscreen = false;
            }
        }
    }

    ngOnDestroy() {
        const wrapperElement = document.getElementsByClassName('wrapper');
        (wrapperElement[0] as HTMLElement).style.display = '';
    }

    subscribeWebrtcIsConnected() {
        this.liveService.isConnectedSubject$.subscribe((onoff: boolean) => {
            this.isWebrtcConnected = onoff;
            if (onoff) {
                this.isWebrtcConnecting = true;
            } else {
                this.isRecording = false;
                this.isWebrtcConnecting = false;
            }
            this.isWebrtcButtonEnable = true;
        });
    }

    switchWebrtc(onoff: boolean) {
        this.isWebrtcButtonEnable = false;
        this.liveService.connectRTCPeer(onoff);
    }

    switchCodec() {
        let found: boolean = false;
        for (let item in Codecs) {
            if (found) {
                this.selectedCodec = Codecs[item];
                return;
            }
            if (item === this.selectedCodec) {
                found = true;
            }
        }
        this.selectedCodec = Codecs.H264;
    }

    recordVideo(onoff: boolean) {
        // TODO: modify the value after making sure receive the success response
        this.isRecording = onoff;
        this.liveService.recordVideo(onoff);
    }

    fullscreen(onoff: boolean) {
        if (onoff) {
            if (this.panel.nativeElement.requestFullscreen) {
                this.panel.nativeElement.requestFullscreen();
            }
        } else {
            document.exitFullscreen();
        }

        this.isFullscreen = onoff;
    }

    changeIntensityOfLed(value: number) {
        this.gpioService.putPwm(12, 500, value).subscribe(x => {
            console.log(x);
        });
    }

    /**
     * gpio off = 1, 3.3v
     * gpio on  = 0, 0v
     * @param pin BCM接腳編號
     * @param event on: true, off: false
     */
    setGpio(pin: number, event: boolean) {
        const onoff = Number(event);
        this.gpioService.putGpio(pin, onoff).subscribe(x => {
            console.log(x);
        });
    }

    initializeAllGpioStatus() {
        this.gpioService.getAllGpioStatus().subscribe(gpioStatus => {
            gpioStatus.forEach(x => {
                switch (x.pin._gpio) {
                    case 20:
                        this.gpioCheckedObject.isCheckedFan = Boolean(x.value);
                        console.log(20, this.gpioCheckedObject.isCheckedFan);
                        break;
                    case 21:
                        this.gpioCheckedObject.isCheckedLed = Boolean(x.value);
                        console.log(21, this.gpioCheckedObject.isCheckedLed);
                        break;
                    default:
                        break;
                }
            });

        });
    }
}

class GpioCheckedObject {
    isCheckedLed: boolean = false;
    isCheckedFan: boolean = false;
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { GpioService } from '../../api/raspberry/rasp_gpio.service';
import { LiveService } from './live.service';

@Component({
    selector: 'app-live',
    templateUrl: './live.component.html',
    styleUrls: ['./live.component.css'],
    providers: [GpioService]
})

export class LiveComponent implements OnInit, OnDestroy {
    isWebrtcConnected: boolean = false;
    isRecording: boolean = false;
    webrtcButtonLabel: string = 'Start';
    webrtcButtonEnable: boolean = true;
    gpioCheckedObject: GpioCheckedObject = new GpioCheckedObject();

    constructor(
        private gpioService: GpioService,
        private liveService: LiveService,
    ) {
    }

    ngOnInit() {
        this.initializeAllGpioStatus();

        this.subscribeWebrtcIsConnected();
    }

    ngOnDestroy() {

    }

    subscribeWebrtcIsConnected() {
        this.liveService.isConnectedSubject$.subscribe((onoff: boolean) => {
            this.isWebrtcConnected = onoff;
            if (onoff) {
                this.webrtcButtonLabel = 'Stop';
            } else {
                this.webrtcButtonLabel = 'Start';
                this.isRecording = false;
            }
            this.webrtcButtonEnable = true;
        });
    }

    switchWebrtc(onoff: boolean) {
        this.webrtcButtonEnable = false;
        this.liveService.connectRTCPeer(onoff)
    }

    recordVideo(onoff: boolean) {
        // TODO: modify the value after making sure receive the success response
        this.isRecording = onoff;
        this.liveService.recordVideo(onoff);
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

// function allowDrop(event){
//     event.preventDefault();
// }
// function drag(event){
//     event.dataTransfer.setData("text",event.currentTarget.id);
// }
// function drop(event){
//     event.preventDefault();
//     var data=event.dataTransfer.getData("text");
//     event.currentTarget.appendChild(document.getElementById(data));
// }

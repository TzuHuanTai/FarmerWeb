import { Component, OnInit, AfterViewInit, OnDestroy, Input, ViewChild, ElementRef } from '@angular/core';
import { WindowService } from './window.service';

@Component({
    selector: 'window',
    templateUrl: './window.component.html',
    styleUrls: ['./window.component.css'],
})

export class WindowComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input('title') title: string;
    @Input('index') index: number;
    @Input('bound') limitedBound: HTMLDivElement;
    @ViewChild('handle') handle: ElementRef;

    constructor(public windowService: WindowService) {
    }

    ngOnInit() {
        console.log('open: ' + this.title);
    }

    ngAfterViewInit() {
        if (this.handle) {
            const handle = this.handle.nativeElement;
            handle.addEventListener('click', (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
            });
        }
    }

    ngOnDestroy() {
        console.log('close: ' + this.title);
    }

    clickClose() {
        this.windowService.emitWindowClose(this.index);
    }
}

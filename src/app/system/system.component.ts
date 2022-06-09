import { Component, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { SharedService } from '../shared-service';

@Component({
  selector: 'app-system',
  templateUrl: './system.component.html',
  styleUrls: ['./system.component.css'],
})
export class SystemComponent implements OnDestroy {

  renderRoutingUnsubscribe: Subject<any> = new Subject();

  constructor(
    private elem: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService,
  ) {
    const tagName = elem.nativeElement.tagName.toLowerCase();
    this.router.navigate(['Menu'], { relativeTo: this.route });
    this.sharedService.setChildRoutes(tagName);
  }

  ngOnDestroy() {
    this.sharedService.cleanChildRoutes();
  }
}

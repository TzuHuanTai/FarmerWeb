import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SharedService } from '../shared-service';
import { VmMenu } from '../../interface/system_auth/vm_menu';

@Component({
  selector: 'app-system',
  templateUrl: './system.component.html',
  styleUrls: ['./system.component.css'],
  // providers: [ SharedService ] //已在root
})
export class SystemComponent implements OnDestroy {

  renderRoutingUnsubscribe: Subject<any> = new Subject();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService,
  ) {
    // routing.module也有訂閱childRoutesEmitted$做動態更新routes。當進入此系列module時，
    // 兩個的childRoutesEmitted$都會觸發，但進入lazy module時angular會先觸發routing.module，
    // event loop到這邊時剛好已更新好routes，所以可以馬上做router.navigate
    this.sharedService.childRoutesEmitted$.pipe(
      takeUntil(this.renderRoutingUnsubscribe),
    ).subscribe(([parentPath, childMenusList]: [string, VmMenu[]]) => {
      // 登入成功後重新導向至首頁
      if (childMenusList.length > 0) {
        this.router.navigate([childMenusList[0].path], { relativeTo: this.route });
      }
    });
  }

  ngOnDestroy() {
    this.renderRoutingUnsubscribe.next(0);
    this.renderRoutingUnsubscribe.complete();
  }
}

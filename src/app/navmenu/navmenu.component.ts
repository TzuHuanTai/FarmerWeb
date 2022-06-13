import { Component, OnInit } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { SystemService } from '../../api/system_auth/system.service';
import { VmMenu } from '../../interface/system_auth/vm_menu';
import { Router } from '@angular/router';
import { SharedService, NavMenuService } from '../shared-service';
import { Observable, Subscriber } from 'rxjs';

@Component({
    selector: 'nav-menu',
    templateUrl: './navmenu.component.html',
    styleUrls: ['./navmenu.component.css'],
    providers: [SystemService]
})

export class NavMenuComponent implements OnInit {

    menuList: VmMenu[];
    signList: VmMenu[];
    isSignIn: boolean;
    timeNow: Observable<string>;
    drawer: MatDrawer;
    account: string;
    hasChildMenu: boolean = false;
    isMenuCollapsed: boolean = true;

    constructor(
        private router: Router,
        private systemService: SystemService,
        private sharedService: SharedService,
        private navMenuService: NavMenuService,
    ) {

        if (!localStorage.getItem('userToken')) {
            this.isSignIn = false;
        } else if (localStorage.getItem('userToken')) {
            this.isSignIn = true;
            this.account = localStorage.getItem('account');
        }

        // 雖然第一次執行時app.module.ts會自動執行app-routing.module.ts建立Routers
        // 但需要刷新Menu的button，所以必須執行一次
        this.rebuildRoutes();

        // 監聽從sign-in.component.ts傳來觸發事件，登入時重新抓Routes
        this.sharedService.loginEmitted$.subscribe(text => {
            this.rebuildRoutes();

            if (!localStorage.getItem('userToken')) {
                this.isSignIn = false;
            } else if (localStorage.getItem('userToken')) {
                this.isSignIn = true;
                this.account = localStorage.getItem('account');
            }
        });

        this.sharedService.childRoutesEmitted$.subscribe(([_, childMenusList]: [string, VmMenu[]]) => {
            this.hasChildMenu = childMenusList.length > 0;
        });

        this.navMenuService.getMenuDrawer().subscribe((drawer) => {
            this.drawer = drawer;
        });
    }

    ngOnInit() {
        // 1.直接設定param類型為Observable
        this.timeNow = new Observable<string>((observer: Subscriber<string>) => {
            setInterval(() => observer.next(
                // 反應速度差不多
                new Date().toLocaleTimeString('zh-TW', { hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit' })
            ), 1000);
        });
    }

    signOut() {
        localStorage.removeItem('userToken');
        localStorage.removeItem('account');
        this.isSignIn = false;
        this.rebuildRoutes();
        this.router.navigate(['']);
    }

    drawerToggle() {
        if (this.drawer) { this.drawer.toggle(); }
    }

    private rebuildRoutes() {
        this.systemService.getAllowedMenu().subscribe({
            next: (result: VmMenu[]) => {
                this.menuList = result.filter(menu => !menu.path.startsWith('Sign'));
                this.signList = result.filter(menu => menu.path.startsWith('Sign'));
                this.sharedService.emitFullRoutes(result);
            },
            error: (error) => {
                console.error(error);
            }
        });
    }
}

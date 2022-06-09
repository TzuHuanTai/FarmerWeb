import { Injectable } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Subject, ReplaySubject, Observable } from 'rxjs';

// ----ViewModel----//
import { VmMenu } from '../interface/system_auth/vm_menu';

@Injectable({
    providedIn: 'root',
})
export class SharedService {

    public fullRoutes: VmMenu[] = [];

    // Observable string sources
    private emitLoginSource = new ReplaySubject<any>();
    private emitChildRoutesSource = new Subject<[string, VmMenu[]]>();
    private emitFullRoutesSource = new ReplaySubject<VmMenu[]>(1);

    // Observable string streams
    public loginEmitted$ = this.emitLoginSource.asObservable();
    public childRoutesEmitted$ = this.emitChildRoutesSource.asObservable();
    public fullRoutesEmitted$ = this.emitFullRoutesSource.asObservable();


    // Service message commands
    emitUserLogin(change: any) {
        this.emitLoginSource.next(change);
    }

    public setChildRoutes(tagName: string): void {
        const parentMenu: VmMenu = this.fullRoutes.find(x => x.selector === tagName);
        if (parentMenu && parentMenu.children != null) {
            this.emitChildRoutesSource.next([parentMenu.path, parentMenu.children]);
        }
    }

    public cleanChildRoutes(): void {
        this.emitChildRoutesSource.next(['', []]);
    }

    emitFullRoutes(fullRoutes: VmMenu[]) {
        this.fullRoutes = fullRoutes;
        this.emitFullRoutesSource.next(fullRoutes);
    }
}

@Injectable({
    providedIn: 'root',
})
export class NavMenuService {

    public drawer: MatDrawer;
    private drawerSubject: Subject<MatDrawer> = new Subject<MatDrawer>();

    constructor() {
    }

    setMenuDrawer(drawer: MatDrawer) {
        this.drawer = drawer;
        this.drawerSubject.next(drawer);
    }

    getMenuDrawer() {
        return this.drawerSubject.asObservable();
    }

    toggleMenuDrawer() {
        if (this.drawer) {
            this.drawer.toggle();
        }
    }

    clearMenuDrawer() {
        this.drawerSubject.next(this.drawer = null);
    }
}

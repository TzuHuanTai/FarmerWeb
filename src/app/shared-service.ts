import { Injectable, ComponentFactoryResolver, ComponentFactory } from '@angular/core';
import { Routes, Router } from '@angular/router';
import { MatDrawer } from '@angular/material/sidenav';
import { Subject, ReplaySubject, Observable } from 'rxjs';
import { take } from 'rxjs/operators';

// ----ViewModel----//
import { VmMenu } from '../interface/system_auth/vm_menu';

@Injectable({
    providedIn: 'root',
})
export class SharedService {

    public factories: any = [];

    // Observable string sources
    private emitLoginSource = new ReplaySubject<any>();
    private emitChildRoutesSource = new Subject<[string, VmMenu[]]>();
    private emitFullRoutesSource = new ReplaySubject<VmMenu[]>(1);

    // Observable string streams
    public loginEmitted$ = this.emitLoginSource.asObservable();
    public childRoutesEmitted$ = this.emitChildRoutesSource.asObservable();
    public fullRoutesEmitted$ = this.emitFullRoutesSource.asObservable();

    public static getComponentType(resolver: ComponentFactoryResolver,
        route: VmMenu): any {
        // resolver可取到 ngModule 裡 bootstrap、entryComponents 裡定義的 Component type
        // 根據 componentType 名字取出對應的 componentType
        const temp = Array.from(resolver['_factories'].values())
            .find((x: ComponentFactory<any>) => x.selector === route.selector) as ComponentFactory<any>;

        if (temp) {
            return temp.componentType;
        } else {
            return null;
        }
    }

    public static addDynamicPath(resolver: ComponentFactoryResolver, config: Routes, modulePath: string,
        dynamicChildRoutes: VmMenu[]) {
        const foundChild: any = config.find(x => x.path === modulePath);

        if (foundChild && foundChild._loadedConfig) {
            const childLoadedRouterConfig: any = foundChild._loadedConfig;
            childLoadedRouterConfig.routes.forEach((route) => {
                if (Object.keys(route).some(proptertyName => proptertyName.includes('children')) && route.children.length === 0) {
                    dynamicChildRoutes.forEach((child, i) => {
                        if (i === 0) {
                            // 若有不只一個children，路徑path=''時自動轉跳至第一個child路徑
                            // 因此第一筆foreach需加入path=''且redirectTo 第一個子componet之路徑
                            route.children.push({
                                path: '',
                                redirectTo: child.path,
                                pathMatch: 'full',
                            });
                        }

                        route.children.push({
                            path: child.path,
                            component: SharedService
                                .getComponentType(resolver, child),
                        });
                    });
                }
            });
        }
    }

    constructor(private resolver: ComponentFactoryResolver) {
        console.log(this.resolver);
        this.factories = Array.from(this.resolver['_factories'].values());
    }

    // Service message commands
    emitUserLogin(change: any) {
        this.emitLoginSource.next(change);
    }

    emitChildRoutes(event: Object) {
        const emitEvent = this.fullRoutesEmitted$.subscribe((menus: VmMenu[]) => {
            const parentProto: ComponentFactory<any> = Object.getPrototypeOf(event);
            const parentfactory:
                ComponentFactory<any> = this._getComponentType(parentProto.constructor.name);
            // ng build --prod會化簡component名字為代號以壓縮空間，但不會改selector名字。
            // 所以別用component名稱比對，會失敗！
            const parentMenu: VmMenu = menus.filter(x => x.selector != null)
                .find(x => x.selector === parentfactory.selector);
            if (parentMenu && parentMenu.children != null) {
                this.emitChildRoutesSource.next([parentMenu.path, parentMenu.children]);
            }
        });
        // 查詢fullRoutes資料後，記得取消訂閱，避免後面不斷重新訂閱浪費資源
        emitEvent.unsubscribe();
    }

    emitFullRoutes(fullRoutes: VmMenu[]) {
        this.emitFullRoutesSource.next(fullRoutes);
    }

    /**
     * 根據 componentType 名字取出對應的 componentType
     * @param routeName 路徑名稱
     */
    private _getComponentType(routeName: string): any {
        return this.factories.find(
            (x: ComponentFactory<any>) =>
                x.componentType.name === routeName ||
                routeName.toLocaleLowerCase() === x.componentType.name.split('_')[0]
        );
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

@Injectable({
    providedIn: 'root',
})
export class CheckService {

    constructor() {
    }
    /**
     * check subject has had data, or get the data from resource
     * @param subject
     * @param resource
     */
    public static check<T>(subject: Subject<T[]>, resource: Observable<T[]>) {
        subject.pipe(
            take(1),
        ).subscribe((resultFromSubject: T[]) => {
            if (!resultFromSubject || resultFromSubject.length === 0) {
                resource.subscribe((resultFromApi: T[]) => {
                    console.log(typeof subject, ' from api');
                    subject.next(resultFromApi);
                });
            }
        });
    }

    public static checkLazyRouter(parentPath: string, childList: VmMenu[],
        resolver: ComponentFactoryResolver, router: Router, moduleName: string,
        renderRoutingUnsubscribe: Subject<any>) {

        if (parentPath.toLocaleLowerCase() === moduleName.toLocaleLowerCase() && childList.length > 0) {
            // Outside the subscribe may use setTimeout at first!!
            // It seems to "_loadedConfig" would be gotten in the end of RecivableRoutingModule
            SharedService
                .addDynamicPath(resolver, router.config, parentPath, childList);
            renderRoutingUnsubscribe.next(0);
            renderRoutingUnsubscribe.complete();
        }
    }
}

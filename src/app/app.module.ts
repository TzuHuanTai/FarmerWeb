import { BrowserModule } from '@angular/platform-browser'; // 沒加這列無法使用HttpClientModule
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgbDropdown, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { NavMenuComponent } from './navmenu/navmenu.component';
import { AppRoutingModule, AppRoutingComponents } from './app-routing.module';
import { AuthInterceptor } from '../interceptor/auth.interceptor';
import { SharedMaterialModule } from './shared-material.module';
import { SystemComponents } from './system/system.module';
import { MapComponents } from './map/map.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

@NgModule({
    declarations: [
        AppComponent,
        NavMenuComponent,
        AppRoutingComponents,
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        NgbModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        SharedMaterialModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: environment.production,
            registrationStrategy: "registerImmediately",
        })
    ],
    providers: [
        NgbDropdown,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true,
        }
    ],
    bootstrap: [AppComponent]
})

export class AppModule { }

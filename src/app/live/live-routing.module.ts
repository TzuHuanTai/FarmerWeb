import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LiveComponent } from './live.component';

const routes: Routes = [{
    path: '',
    component: LiveComponent,
    children: [],
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})

export class LiveRoutingModule {
    constructor() { }
}

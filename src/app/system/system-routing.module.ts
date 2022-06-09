import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SystemComponent } from './system.component';
import { MemberComponent } from './member/member.component';
import { CharacterComponent } from './character/character.component';
import { ActionComponent } from './action/action.component';
import { MenuComponent } from './menu/menu.component';

const routes: Routes = [{
    path: '',
    component: SystemComponent,
    children: [{
        path: 'Menu',
        component: MenuComponent,
        pathMatch: 'full'
    }, {
        path: 'Action',
        component: ActionComponent,
        pathMatch: 'full'
    }, {
        path: 'Character',
        component: CharacterComponent,
        pathMatch: 'full'
    }, {
        path: 'Member',
        component: MemberComponent,
        pathMatch: 'full'
    }],
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})

export class SystemRoutingModule { }

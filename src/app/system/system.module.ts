// 系統管理
import { SystemComponent } from './system.component';
import { MenuComponent } from './menu/menu.component';
import { ActionComponent } from './action/action.component';
import { CharacterComponent } from './character/character.component';
import { MemberComponent } from './member/member.component';

/** Dialogs' Component inside Component */
// Menu
import { DialogMenuDeleteComponent } from './menu/dialog/dialog-menu-delete.component';
import { DialogMenuUpdateComponent } from './menu/dialog/dialog-menu-update.component';
import { DialogMenuCreateComponent } from './menu/dialog/dialog-menu-create.component';
// Character
import { DialogCharacterCreateComponent } from './character/dialog/dialog-character-create.component';
import { DialogCharacterDeleteComponent } from './character/dialog/dialog-character-delete.component';
import { DialogCharacterUpdateComponent } from './character/dialog/dialog-character-update.component';
import { DialogIMenuRoleComponent } from './character/dialog/dialog-i-menu-role.component';
import { DialogIActionRoleComponent } from './character/dialog/dialog-i-action-role.component';
// Controller
import { DialogCtrlCreateComponent } from './action/ctrlTable/dialog/dialog-ctrl-create.component';
import { DialogCtrlDeleteComponent } from './action/ctrlTable/dialog/dialog-ctrl-delete.component';
import { DialogCtrlUpdateComponent } from './action/ctrlTable/dialog/dialog-ctrl-update.component';
// Actions
import { DialogActionCreateComponent } from './action/actionTable/dialog/dialog-action-create.component';
import { DialogActionDeleteComponent } from './action/actionTable/dialog/dialog-action-delete.component';
import { DialogActionUpdateComponent } from './action/actionTable/dialog/dialog-action-update.component';
// Members
import { DialogMemberCreateComponent } from './member/dialog/dialog-member-create.component';
import { DialogMemberUpdateComponent } from './member/dialog/dialog-member-update.component';
import { DialogMemberDeleteComponent } from './member/dialog/dialog-member-delete.component';
import { DialogIMemberRoleComponent } from './member/dialog/dialog-i-member-role.component';

/** Child components in dialogs */
// Menus
import { MenuCreateComponent } from './menu/dialog/menu-create.component';
// Characters
import { CharacterCreateComponent } from './character/dialog/character-create.component';
// Actions
import { ActionCreateComponent } from './action/actionTable/dialog/action-create.component';

/** Child components in Tab */
// Actions
import { ActionTableComponent } from './action/actionTable/actionTable.component';
import { CtrlTableComponent } from './action/ctrlTable/ctrlTable.component';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedMaterialModule } from '../shared-material.module';
import { SystemRoutingModule } from './system-routing.module';

// 這邊宣告所有Material的Components
export const SystemComponents = [
  // 系統管理
  SystemComponent,
  MenuComponent,
  ActionComponent,
  CharacterComponent,
  MemberComponent,

  // 系統管理-選單權限
  DialogMenuDeleteComponent,
  DialogMenuUpdateComponent,
  DialogMenuCreateComponent,
  MenuCreateComponent,

  // 系統管理-角色權限
  DialogCharacterCreateComponent,
  DialogCharacterDeleteComponent,
  DialogCharacterUpdateComponent,
  CharacterCreateComponent,
  // 系統管理-角色權限-角色選單
  DialogIMenuRoleComponent,
  DialogIActionRoleComponent,

  // 系統管理-控制動作
  ActionTableComponent,
  CtrlTableComponent,
  DialogCtrlCreateComponent,
  DialogCtrlDeleteComponent,
  DialogCtrlUpdateComponent,
  DialogActionCreateComponent,
  DialogActionDeleteComponent,
  DialogActionUpdateComponent,
  ActionCreateComponent,

  // 系統館理-帳戶管理
  DialogMemberCreateComponent,
  DialogMemberUpdateComponent,
  DialogMemberDeleteComponent,
  DialogIMemberRoleComponent,
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        SharedMaterialModule,
        SystemRoutingModule,
    ],
    declarations: SystemComponents
})

export class SystemModule { }


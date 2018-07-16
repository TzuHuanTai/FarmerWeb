import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { CdkTableModule } from '@angular/cdk/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTreeModule } from '@angular/material/tree';
import { CdkTreeModule } from '@angular/cdk/tree';
import { MatTabsModule } from '@angular/material/tabs';

//Dialogs' Component inside Component
import { DialogMenuDeleteComponent } from './system/menu/dialog/dialog-menu-delete.component'
import { DialogMenuUpdateComponent } from './system/menu/dialog/dialog-menu-update.component';
import { DialogMenuCreateComponent } from './system/menu/dialog/dialog-menu-create.component';
import { DialogCharacterCreateComponent } from './system/character/dialog/dialog-character-create.component';
import { DialogCharacterDeleteComponent } from './system/character/dialog/dialog-character-delete.component';
import { DialogCharacterUpdateComponent } from './system/character/dialog/dialog-character-update.component';
import { DialogImenuRoleComponent } from './system/character/dialog/dialog-ImenuRole.component';

//Child components in dialogs
import { MenuCreateComponent } from './system/menu/dialog/menu-create.component';
import { CharacterCreateComponent } from './system/character/dialog/character-create.component';

//Child components in Tab
import { ActionTableComponent } from './system/action/actionTable/actionTable.component';
import { CtrlTableComponent } from './system/action/ctrlTable/ctrlTable.component';

@NgModule({
  //imports: [MatButtonModule], // import內用
  exports: [    
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatTableModule,    
    CdkTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatToolbarModule,
    MatSidenavModule,
    MatCheckboxModule,
    MatTreeModule,
    CdkTreeModule,
    MatTabsModule
  ]
})

export class SharedMaterialModule { }

// 這邊宣告所有Material的Components
export const MatComponents = [  
  //系統管理-選單權限
  DialogMenuDeleteComponent,
  DialogMenuUpdateComponent,
  DialogMenuCreateComponent,
  MenuCreateComponent,

  //系統管理-角色權限
  DialogCharacterCreateComponent,
  DialogCharacterDeleteComponent,
  DialogCharacterUpdateComponent,
  CharacterCreateComponent,
  //系統管理-角色權限-角色選單
  DialogImenuRoleComponent,

  //系統管理-控制動作
  ActionTableComponent,
  CtrlTableComponent
]
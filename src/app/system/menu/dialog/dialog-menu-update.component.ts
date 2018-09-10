import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Menu } from '../menu';
import { MenuService } from '../menu.service'

@Component({
    selector: 'dialog-menu-update',
    templateUrl: 'dialog-menu-update.html',
    providers: [MenuService]
  })
  export class DialogMenuUpdateComponent {
    public MenuDetial: Menu;
    public MenuList: Menu[];
    constructor(public dialogRef: MatDialogRef<DialogMenuUpdateComponent>,
      private MenuREST: MenuService,
      @Inject(MAT_DIALOG_DATA) public data: any) {
      this.MenuDetial = this.data[0];
      this.MenuList = this.data[1];
    }
  
    onNoClick(): void {
      this.dialogRef.close(false);
    }
  
    onYesClick(): void {
      //console.log(this.MenuDetial.menuId);
      this.putMenu(this.MenuDetial.menuId, this.MenuDetial);
      this.dialogRef.close(true);
    }
  
    putMenu(id: number, UpdatedMenu: Menu) {
      this.MenuREST.PutMenu(id, UpdatedMenu).subscribe(
        (result: any) => {
          //console.log(result);
        },
        error => {
          console.log(error);
        }
      )
    }
  
    compareObjects(o1: any, o2: any): boolean {      
      if(o1=='')o1=null;
      return o1 == o2;
    }
  }
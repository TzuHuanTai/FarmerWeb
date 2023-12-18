import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Menu } from '../../../../interface/system_auth/menu';
import { MenuService } from '../../../../api/system_auth/menu.service';
import { Validators, UntypedFormGroup, UntypedFormArray, UntypedFormBuilder } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'dialog-menu-create',
    templateUrl: 'dialog-menu-create.html',
    providers: [MenuService],
})

export class DialogMenuCreateComponent {

    addMenuForm: UntypedFormGroup;

    constructor(
        @Inject(MAT_DIALOG_DATA) public menuList: Menu[],
        public fb: UntypedFormBuilder,
        public dialogRef: MatDialogRef<DialogMenuCreateComponent>,
        private menuService: MenuService,
    ) {
        this.addMenuForm = this.fb.group({
            containLists: this.fb.array([
                this.initaddMenuForm(),
            ])
        });
    }

    initaddMenuForm() {
        // 若此地不加require，而在子component加入，則會發生前後不一致的警告！
        const defaultRow = {
            menuId: ['', Validators.required],
            path: ['', Validators.required],
            menuText: ['', Validators.required],
            sortNo: ['', Validators.required],
            selector: [''],
            component: ['', Validators.required],
            rootMenuId: null,
            appId: [environment.appId] // 第一個應用程式 todo
        };
        return this.fb.group(defaultRow);
    }

    addMenuList() {
        // add address to the list
        const control = <UntypedFormArray>this.addMenuForm.controls['containLists'];
        control.push(this.initaddMenuForm());
    }

    removeMenuList(i: number) {
        // remove address from the list
        const control = <UntypedFormArray>this.addMenuForm.controls['containLists'];
        control.removeAt(i);
    }

    onNoClick() {
        this.dialogRef.close(false);
    }

    onYesClick(InsertData: Menu[]) {
        this.createMenu(InsertData);
        this.dialogRef.close(true);
    }

    createMenu(dataList: Menu[]) {
        dataList.forEach(data => {
            this.menuService.postMenu(data).subscribe((result: any) => {
                // console.log(result);
            }, (error) => {
                console.log(error);
            });
        });
    }
}

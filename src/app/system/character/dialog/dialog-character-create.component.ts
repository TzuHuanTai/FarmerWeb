import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Validators, UntypedFormGroup, UntypedFormArray, UntypedFormBuilder } from '@angular/forms';
import { RoleGroup } from '../../../../interface/system_auth/role_group';
import { RoleGroupService } from '../../../../api/system_auth/role_group.service';

@Component({
    selector: 'dialog-character-create',
    templateUrl: 'dialog-character-create.html',
    providers: [RoleGroupService],
})

export class DialogCharacterCreateComponent {

    addRoleForm: UntypedFormGroup;

    constructor(
        public fb: UntypedFormBuilder,
        public dialogRef: MatDialogRef<DialogCharacterCreateComponent>,
        private roleGroupService: RoleGroupService,
        @Inject(MAT_DIALOG_DATA) public roleList: RoleGroup[],
    ) {

        this.addRoleForm = this.fb.group({
            containLists: this.fb.array([
                this.initaddRoleForm(),
            ])
        });
    }

    initaddRoleForm() {
        // 若此地不加require，而在子component加入，則會發生前後不一致的警告！
        return this.fb.group({
            roleId: ['', Validators.required],
            roleName: ['', Validators.required],
            sortNo: ['', Validators.required],
            accessScope: [''],
            description: [''],
            parentRoleId: [null],
            rejectScope: [false],
            approveScope: [false],
            submitScope: [false],
            passScope: [false],
            printScope: [false],
        });
    }

    addRoleList() {
        // add address to the list
        const control = <UntypedFormArray>this.addRoleForm.controls['containLists'];
        control.push(this.initaddRoleForm());
    }

    removeRoleList(i: number) {
        // remove address from the list
        const control = <UntypedFormArray>this.addRoleForm.controls['containLists'];
        control.removeAt(i);
    }

    onNoClick(): void {
        this.dialogRef.close(false);
    }

    onYesClick(InsertData: RoleGroup[]): void {
        // console.log(InsertData)
        this.createRole(InsertData);
        this.dialogRef.close(true);
    }

    createRole(dataList: RoleGroup[]) {
        dataList.forEach(data => {
            this.roleGroupService.postRoleGroup(data).subscribe((result: any) => {
                console.log(result);
            }, (error) => {
                console.log(error);
            });
        });
    }
}

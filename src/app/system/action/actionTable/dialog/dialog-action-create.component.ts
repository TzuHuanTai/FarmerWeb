import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Validators, UntypedFormGroup, UntypedFormArray, UntypedFormBuilder } from '@angular/forms';
import { Action } from '../../../../../interface/system_auth/action';
import { ActionService } from '../../../../../api/system_auth/action.service';

@Component({
    selector: 'dialog-action-create',
    templateUrl: 'dialog-action-create.html',
    providers: [ActionService],
})

export class DialogActionCreateComponent {

    addActionForm: UntypedFormGroup;

    constructor(
        public fb: UntypedFormBuilder,
        public dialogRef: MatDialogRef<DialogActionCreateComponent>,
        private actionService: ActionService,
        @Inject(MAT_DIALOG_DATA) public ActionList: Action[],
    ) {
        this.addActionForm = this.fb.group({
            containLists: this.fb.array([
                this.initaddActionForm(),
            ]),
        });
    }

    initaddActionForm() {
        // 若此地不加require，而在子component加入，則會發生前後不一致的警告！
        return this.fb.group({
            actionId: ['', Validators.required],
            name: ['', Validators.required],
            method: ['', Validators.required],
            controllerId: ['', Validators.required],
            description: [''],
        });
    }

    addActionList() {
        // add address to the list
        const control = <UntypedFormArray>this.addActionForm.controls['containLists'];
        control.push(this.initaddActionForm());
    }

    removeActionList(i: number) {
        // remove address from the list
        const control = <UntypedFormArray>this.addActionForm.controls['containLists'];
        control.removeAt(i);
    }

    onNoClick(): void {
        this.dialogRef.close(false);
    }

    onYesClick(InsertData: Action[]): void {
        this.createAction(InsertData);
        this.dialogRef.close(true);
    }

    createAction(dataList: Action[]) {
        dataList.forEach(data => {
            this.actionService.postAction(data).subscribe((result: any) => {
                // console.log(result);
            }, (error) => {
                console.log(error);
            });
        });
    }
}

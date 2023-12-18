import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ErrorStateMatcher } from '@angular/material/core';
import { Validators, UntypedFormGroup, UntypedFormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { Member } from '../../../../interface/system_auth/member';
import { MemberService } from '../../../../api/system_auth/member.service';

@Component({
    selector: 'dialog-member-create',
    templateUrl: 'dialog-member-create.html',
    styleUrls: ['../member.component.css'],
    providers: [MemberService],
})

export class DialogMemberCreateComponent {

    matcher = new MyErrorStateMatcher();

    memberForm: UntypedFormGroup = new UntypedFormGroup({
        name: new UntypedFormControl(),
        deptId: new UntypedFormControl(),
        account: new UntypedFormControl(),
        password: new UntypedFormControl(),
        email: new UntypedFormControl('', [Validators.email]),
        isActive: new UntypedFormControl(true)
    });

    constructor(
        public dialogRef: MatDialogRef<DialogMemberCreateComponent>,
        private memberService: MemberService,
    ) { }

    onNoClick() {
        this.dialogRef.close(false);
    }

    onYesClick(insertData: Member) {
        this.createMember(insertData);
        this.dialogRef.close(true);
    }

    createMember(data: Member) {
        this.memberService.postMember(data).subscribe({
            error: error => console.log(error),
        });
    }
}

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        const isSubmitted = form && form.submitted;
        return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
    }
}

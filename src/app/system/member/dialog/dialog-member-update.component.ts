import { Component, Inject } from '@angular/core';
import { NgForm, FormGroupDirective, FormControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Member } from '../../../../interface/system_auth/member';
import { MemberService } from '../../../../api/system_auth/member.service';

@Component({
    selector: 'dialog-member-update',
    templateUrl: 'dialog-member-update.html',
    providers: [MemberService],
})

export class DialogMemberUpdateComponent {
    public memberDetail: Member;

    public matcher = new MyErrorStateMatcher();

    constructor(
        public dialogRef: MatDialogRef<DialogMemberUpdateComponent>,
        private memberService: MemberService,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {
        this.memberDetail = this.data;
    }

    onNoClick() {
        this.dialogRef.close(false);
    }

    onYesClick() {
        this.putMenu(this.memberDetail.account, this.memberDetail);
        this.dialogRef.close(true);
    }

    putMenu(id: string, updatedMember: Member) {
        this.memberService.putMember(id, updatedMember).subscribe({
            error: error => console.log(error),
        });
    }
}

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        const isSubmitted = form && form.submitted;
        return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
    }
}

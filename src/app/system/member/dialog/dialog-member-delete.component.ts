import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Member } from '../../../../interface/system_auth/member';
import { MemberService } from '../../../../api/system_auth/member.service';

@Component({
    selector: 'dialog-member-delete',
    templateUrl: 'dialog-member-delete.html',
    providers: [MemberService],
})

export class DialogMemberDeleteComponent {

    constructor(
        public dialogRef: MatDialogRef<DialogMemberDeleteComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Member,
        private memberService: MemberService,
    ) { }

    onNoClick() {
        this.dialogRef.close(false);
    }

    onYesClick() {
        this.deleteMenu(this.data.account);
        this.dialogRef.close(true);
    }

    deleteMenu(id: string) {
        this.memberService.deleteMember(id).subscribe({
            error: error => console.log(error),
        });
    }
}

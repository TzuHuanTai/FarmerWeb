import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Member } from '../../../interface/system_auth/member';
import { RoleGroupNode } from '../../../interface/system_auth/vm_i_role';
import { IMemberRole } from '../../../interface/system_auth/i_member_role';
import { MemberService } from '../../../api/system_auth/member.service';
import { RoleGroupService } from '../../../api/system_auth/role_group.service';
import { IMemberRoleService } from '../../../api/system_auth/i_member_role.service';

import { DialogMemberCreateComponent } from './dialog/dialog-member-create.component';
import { DialogMemberUpdateComponent } from './dialog/dialog-member-update.component';
import { DialogMemberDeleteComponent } from './dialog/dialog-member-delete.component';
import { DialogIMemberRoleComponent } from './dialog/dialog-i-member-role.component';

@Component({
    selector: 'system-member',
    templateUrl: './member.component.html',
    styleUrls: ['./member.component.css'],
    providers: [MemberService, IMemberRoleService, RoleGroupService],
})
export class MemberComponent implements OnInit {
    /** 傳至dialog */
    // IMemberRole
    iMemberRoleList: IMemberRole[];
    treeRole: RoleGroupNode[];

    /** Parameters of Mat-Table */
    dataSource: MatTableDataSource<Member> | null;
    displayedColumns: string[] = [
        'isActive', 'name', 'account', 'email',
        'addTime', 'updatedTime', 'actions',
    ];
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(
        public dialog: MatDialog,
        private memberService: MemberService,
        private roleGroupService: RoleGroupService,
        private iMemberRoleService: IMemberRoleService,
    ) { }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.memberService.getMembers().subscribe((members: Member[]) => {
            this.dataSource = new MatTableDataSource<Member>(members);
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
        });

        this.roleGroupService.getRoleGroupTree().subscribe((roleGroups) => {
            this.treeRole = roleGroups;
        });
    }

    openDeleteDialog(memberDetial: Member): void {
        const dialogRef = this.dialog.open(DialogMemberDeleteComponent, {
            width: '250px',
            data: memberDetial,
        });

        dialogRef.afterClosed().subscribe((saved: boolean) => {
            if (saved) { this.reloadData(); }
        });
    }

    openUpdateDialog(memberDetial: Member): void {
        const dialogRef = this.dialog.open(DialogMemberUpdateComponent, {
            width: '400px',
            data: memberDetial,
        });

        dialogRef.afterClosed().subscribe((saved: boolean) => {
            if (saved) { this.reloadData(); }
        });
    }

    openCreateDialog(): void {
        const dialogRef = this.dialog.open(DialogMemberCreateComponent, {
            width: '400px',
        });

        dialogRef.afterClosed().subscribe((saved: boolean) => {
            if (saved) { this.reloadData(); }
        });
    }

    openIMemberRoleDialog(memberDetial: Member): void {
        this.iMemberRoleService.getIMemberRole(memberDetial.account).subscribe(iMemberRoles => {
            const dialogRef = this.dialog.open(DialogIMemberRoleComponent, {
                width: '350px',
                data: [memberDetial, iMemberRoles, this.treeRole]
            });

            dialogRef.afterClosed().subscribe((saved: boolean) => {
                if (saved) {
                    // TODO: show hints
                }
            });
        });
    }

    private async reloadData() {
        await new Promise(r => setTimeout(r, 500));
        this.memberService.getMembers().subscribe((data: Member[]) => {
            this.dataSource.data = data;
        });
    }
}

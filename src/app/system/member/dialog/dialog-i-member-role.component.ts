import { Component, Inject, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { SelectionModel } from '@angular/cdk/collections';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { Observable, of } from 'rxjs';
import { Member } from '../../../../interface/system_auth/member';
import { IMemberRole } from '../../../../interface/system_auth/i_member_role';
import { RoleGroupNode, RoleGroupFlatNode } from '../../../../interface/system_auth/vm_i_role';
import { IMemberRoleService } from '../../../../api/system_auth/i_member_role.service';

@Component({
    selector: 'dialog-i-member-role',
    templateUrl: 'dialog-i-member-role.html',
    providers: [IMemberRoleService],
})

export class DialogIMemberRoleComponent implements OnInit {

    memberDetial: Member;
    allowedRole: IMemberRole[];
    treeRole: RoleGroupNode[] = [];

    /** Parameters of MatTreeFlatDataSource */
    treeControl: FlatTreeControl<RoleGroupFlatNode>;
    treeFlattener: MatTreeFlattener<RoleGroupNode, RoleGroupFlatNode>;
    dataSource: MatTreeFlatDataSource<RoleGroupNode, RoleGroupFlatNode>;

    /** The selection for checklist */
    checklistSelection = new SelectionModel<RoleGroupFlatNode>(true /* multiple */);

    /** Parameters of MatTreeFlattener */
    private _getLevel = (node: RoleGroupFlatNode) => node.level;
    private _isExpandable = (node: RoleGroupFlatNode) => node.expandable;
    private _getChildren = (node: RoleGroupNode): Observable<RoleGroupNode[]> => of(node.children);
    hasChild = (_: number, _nodeData: RoleGroupFlatNode) => _nodeData.expandable;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<DialogIMemberRoleComponent>,
        private iMemberRoleService: IMemberRoleService,
    ) {
        this.memberDetial = data[0];
        this.allowedRole = data[1];
        this.treeRole = data[2];

        this.treeFlattener = new MatTreeFlattener(
            this.transformer,
            this._getLevel,
            this._isExpandable,
            this._getChildren
        );
        this.treeControl = new FlatTreeControl<RoleGroupFlatNode>(this._getLevel, this._isExpandable);
        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
        this.dataSource.data = this.treeRole;
    }

    transformer = (node: RoleGroupNode, level: number) => {
        return new RoleGroupFlatNode(node.name, node.id, level, !!node.children);
    }

    ngOnInit() {
        /** 取出角色清單可用Memu清單
         *  先將database該角色資料show on the tree  */
        this.allowedRole.forEach(y => {
            this.checklistSelection.select(
                this.treeControl.dataNodes.find(x => x.id === y.roleId)
            );
        });
    }

    onNoClick(): void {
        this.dialogRef.close(false);
    }

    onYesClick(): void {

        const originActionIds: number[] = [];
        const newActionIds: number[] = [];

        // 拉出來做一個只含menuId的array，抓出原來的權限
        this.allowedRole.forEach(role => {
            originActionIds.push(role.roleId);
        });
        // level 0 are controllers list, level 1 are actions.因此篩選出勾選的level 1即可
        this.checklistSelection.selected.forEach(role => {
            newActionIds.push(role.id);
        });

        /** 交集*/
        // subtracting
        const subtractingOfOrigin = originActionIds.filter(v => !newActionIds.includes(v));
        const subtractingOfNew = newActionIds.filter(v => !originActionIds.includes(v));

        /** delete at subtractingOfOrigin */
        subtractingOfOrigin.forEach(roleId =>
            this.deleteMemberRole(this.memberDetial.account, roleId)
        );

        /** insert at subtractingOfNew */
        subtractingOfNew.forEach(roleId =>
            this.postMemberRole(this.memberDetial.account, roleId)
        );

        this.dialogRef.close(true);
    }

    postMemberRole(account: string, roleId: number) {
        const data: IMemberRole = {
            account: account,
            roleId: roleId,
        };
        this.iMemberRoleService.postIMemberRole(data).subscribe({
            error: error => console.log(error),
        });
    }

    deleteMemberRole(account: string, roleId: number) {
        this.iMemberRoleService.deleteIMemberRole(account, roleId).subscribe({
            error: error => console.log(error),
        });
    }
}

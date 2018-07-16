import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { RoleGroup, ImenuRole } from '../character';
import { Menu, MenuNode, MenuFlatNode } from '../../menu/menu';
import { CharacterService } from '../character.service';

import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { Observable, of as observableOf } from 'rxjs';

@Component({
    selector: 'dialog-ImenuRole',
    templateUrl: 'dialog-ImenuRole.html',
    providers: [ CharacterService ]
})
export class DialogImenuRoleComponent implements OnInit {

    public RoleDetail: RoleGroup;
    public MenuList: Menu[];
    public ImenuRoleList: ImenuRole[];
    public AllowedMenuList: Menu[] = [];
    public TreeMenu: MenuNode[] = [];    

    /** Parameters of MatTreeFlatDataSource */
    treeControl: FlatTreeControl<MenuFlatNode>;
    treeFlattener: MatTreeFlattener<MenuNode, MenuFlatNode>;
    dataSource: MatTreeFlatDataSource<MenuNode, MenuFlatNode>;

    /** The selection for checklist */
    checklistSelection = new SelectionModel<MenuFlatNode>(true /* multiple */);

    /** Parameters of MatTreeFlattener */
    private _getLevel = (node: MenuFlatNode) => node.level;
    private _isExpandable = (node: MenuFlatNode) => node.expandable;
    private _getChildren = (node: MenuNode): Observable<MenuNode[]> => observableOf(node.children);
    hasChild = (_: number, _nodeData: MenuFlatNode) => _nodeData.expandable;


    constructor(public dialogRef: MatDialogRef<DialogImenuRoleComponent>,
        private CharacterREST: CharacterService,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this.RoleDetail = data[0];
        this.ImenuRoleList = data[1];
        this.MenuList = data[2];
        this.TreeMenu = data[3];

        /** 取出角色清單可用Memu清單 */
        this.ImenuRoleList.filter(x => x.roleId == this.RoleDetail.roleId).forEach(y => {
            if (this.MenuList.filter(z => z.menuId == y.menuId)) {
                this.AllowedMenuList.push(y);
            }
        });

        this.treeFlattener = new MatTreeFlattener(
            this.transformer,
            this._getLevel,
            this._isExpandable,
            this._getChildren
        );
        this.treeControl = new FlatTreeControl<MenuFlatNode>(this._getLevel, this._isExpandable);
        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);       
        this.dataSource.data = this.TreeMenu;
    }

    ngOnInit() {
        // 先將database該角色資料show on the tree
        this.AllowedMenuList.forEach(menu =>
            this.checklistSelection.select(
                this.treeControl.dataNodes.find(x => x.menuId == menu.menuId)
            )
        );
    }

    transformer = (node: MenuNode, level: number) => {
        return new MenuFlatNode(node.menuText, node.menuId, level, !!node.children);
    }

    /** Whether all the descendants of the node are selected */
    descendantsAllSelected(node: MenuFlatNode): boolean {
        const descendants = this.treeControl.getDescendants(node);        
        return descendants.every(child => this.checklistSelection.isSelected(child));
    }

    /** 只要有任一child被選取則check=true*/
    descendantsPartiallySelected(node: MenuFlatNode): boolean {
        const descendants = this.treeControl.getDescendants(node);
        const result = descendants.some(child => this.checklistSelection.isSelected(child));

        // 只要有選到child或從DB抓來資料是已selected，就自動select parent      
        if (result || this.checklistSelection.isSelected(node)) {
            this.checklistSelection.select(node)
        }
        else {
            this.checklistSelection.deselect(node);
        }

        return (result && !this.descendantsAllSelected(node))
            || this.checklistSelection.isSelected(node);
    }

    /** Check item selection. Select/deselect all the descendants node */
    CheckParentSelection(node: MenuFlatNode): void {
        // this.checklistSelection.toggle(node); 
        // toggle在某些太難判斷情況，用select/deselect分開處理
        // 只要有選到child或本來就已selected，就自動select parent
        const descendants = this.treeControl.getDescendants(node);//抓底下所有child

        if (!this.checklistSelection.isSelected(node)) {
            this.checklistSelection.select(...descendants)//選取所有child
            this.checklistSelection.select(node);
        }
        else {
            this.checklistSelection.deselect(...descendants); //取消所有child
            this.checklistSelection.deselect(node);
        }
    }

    /** Whether part of the descendants are selected */
    /** 再背景一直抓一直抓一直抓的偵測... */
    IndeterminateSelected(node: MenuFlatNode): boolean {
        const descendants = this.treeControl.getDescendants(node);
        const result = descendants.some(child => this.checklistSelection.isSelected(child));
        return result && !this.descendantsAllSelected(node);
    }

   

    onNoClick(): void {
        this.dialogRef.close();
    }

    onYesClick(): void {
        
        let OriginMenuIds: number[] = [];
        let NewMenuIds: number[] = [];

        // 拉出來做一個只含menuId的array
        this.AllowedMenuList.forEach(menu => {
            OriginMenuIds.push(menu.menuId);
        });
        this.checklistSelection.selected.forEach(menu => {
            NewMenuIds.push(menu.menuId);
        });

        /** 交集*/
        // let Intersection = OriginMenuIds.filter(v => NewMenuIds.includes(v)); 
        // subtracting
        let SubtractingOfOrigin = OriginMenuIds.filter(v => !NewMenuIds.includes(v));
        let SubtractingOfNew = NewMenuIds.filter(v => !OriginMenuIds.includes(v));

        /** do nothing at 交集 Intersection */
        // if( Intersection ){            
        //     console.log(Intersection);
        // }

        /** delete at SubtractingOfOrigin */
        if (SubtractingOfOrigin.length > 0) {
            SubtractingOfOrigin.forEach(menuId =>
                this.DeleteImenuRole(this.RoleDetail.roleId, menuId)
            );
        }

        /** insert at SubtractingOfNew */
        if (SubtractingOfNew.length > 0) {
            SubtractingOfNew.forEach(menuId =>
                this.PostImenuRole(this.RoleDetail.roleId, menuId)
            );
        }

        this.dialogRef.close();
    }

    PostImenuRole(roleId: number, menuId: number) {
        let data: ImenuRole = {
            roleId: roleId,
            menuId: menuId
        }
        this.CharacterREST.PostImenuRole(data).subscribe(
            (result: any) => {
                //console.log(result);
            },
            error => {
                console.log(error);
            }
        )
    }

    DeleteImenuRole(roleId: number, menuId: number) {        
        this.CharacterREST.DeleteImenuRole(menuId, roleId).subscribe(
            (result: any) => {
                //console.log(result);
            },
            error => {
                console.log(error);
            }
        )
    }

    compareObjects(o1: any, o2: any): boolean {
        //if (o1 == '') o1 = null;
        return o1 == o2;
    }
}
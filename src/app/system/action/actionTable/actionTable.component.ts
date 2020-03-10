import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { Observable } from 'rxjs';
import { startWith, map, tap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { Action } from '../../../../interface/system_auth/action';
import { ActionService } from '../../../../api/system_auth/action.service';

import { DialogActionCreateComponent } from './dialog/dialog-action-create.component';
import { DialogActionDeleteComponent } from './dialog/dialog-action-delete.component';
import { DialogActionUpdateComponent } from './dialog/dialog-action-update.component';

@Component({
    selector: 'mat-table-action',
    templateUrl: './actionTable.component.html',
    styleUrls: ['../action.component.css'],
    providers: [ActionService],
})

export class ActionTableComponent implements OnInit {

    //Parameters of Mat-Table    
    @Input('paginator') paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    actionDataSource: MatTableDataSource<Action> | null;
    actionDisplayedColumns: string[] = ['actionId', 'name', 'method', 'controllerId', 'description', 'actions'];

    //Parameters of filters
    idFilter = new FormControl();
    nameFilter = new FormControl();
    methodFilter = new FormControl();
    controllerIdFilter = new FormControl();
    descriptionFilter = new FormControl();
    filterValues = { actionId: '', name: '', method: '', controllerId: '', description: '' };
    idFilteredOptions: Observable<string[]>;
    nameFilteredOptions: Observable<string[]>;
    methodFilteredOptions: Observable<string[]>;
    controllerIdFilteredOptions: Observable<string[]>;
    descriptionFilteredOptions: Observable<string[]>;

    constructor(
        public dialog: MatDialog,
        private actionService: ActionService,
    ) {

    }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.actionService.getActions().subscribe((data: Action[]) => {
            this.actionDataSource = new MatTableDataSource<Action>(data);
            if (this.actionDataSource) {
                this.actionDataSource.sort = this.sort;
                this.actionDataSource.paginator = this.paginator;
                this.actionDataSource.filterPredicate = (data, filter) => this.customFilter(data, filter);

                /** 監聽時給入初始值startwith('')
                 * 是為了讓FilterOptions可以在點擊時就似乎key過東西，自動會跑出下拉選單 */
                //Listen idFilter
                this.idFilteredOptions = this.idFilter.valueChanges.pipe(
                    startWith(''),
                    tap(value => {
                        this.filterValues.actionId = value;
                        this.actionDataSource.filter = JSON.stringify(this.filterValues);
                        this.actionDataSource.paginator.firstPage();
                    }),
                    map(value => this._autoFilter(
                        data.map(v => v.actionId.toString()),
                        value,
                    ))
                )

                //Listen nameFilter
                this.nameFilteredOptions = this.nameFilter.valueChanges.pipe(
                    startWith(''),
                    tap(value => {
                        this.filterValues.name = value;
                        this.actionDataSource.filter = JSON.stringify(this.filterValues);
                        this.actionDataSource.paginator.firstPage();
                    }),
                    map(value => this._autoFilter(
                        data.map(v => v.name),
                        value,
                    ))
                );

                //Listen methodFilter
                this.methodFilteredOptions = this.methodFilter.valueChanges.pipe(
                    startWith(''),
                    tap(value => {
                        this.filterValues.method = value;
                        this.actionDataSource.filter = JSON.stringify(this.filterValues);
                        this.actionDataSource.paginator.firstPage();
                    }),
                    map(value => this._autoFilter(
                        data.map(v => v.method),
                        value,
                    ))
                );

                //Listen controllerIdFilter
                this.controllerIdFilteredOptions = this.controllerIdFilter.valueChanges.pipe(
                    startWith(''),
                    tap(value => {
                        this.filterValues.controllerId = value;
                        this.actionDataSource.filter = JSON.stringify(this.filterValues);
                        this.actionDataSource.paginator.firstPage();
                    }),
                    map(value => this._autoFilter(
                        data.map(v => v.controllerId.toString())
                            .sort((a, b) => parseFloat(a) - parseFloat(b)),
                        value,
                    ))
                );

                //Listen descriptionFilter
                this.descriptionFilteredOptions = this.descriptionFilter.valueChanges.pipe(
                    startWith(''),
                    tap(value => {
                        this.filterValues.description = value;
                        this.actionDataSource.filter = JSON.stringify(this.filterValues);
                        this.actionDataSource.paginator.firstPage();
                    }),
                    map(value => this._autoFilter(
                        data.filter(x => x.description != null && x.description.length > 0)
                            .map(v => v.description),
                        value,
                    ))
                );
            }
        });
    }

    private _autoFilter(options: string[], value: string): string[] {
        const filterValue = value.toLowerCase();
        options = [...new Set(options)];//distinct the array  
        return options.filter(option => option.toLowerCase().includes(filterValue));
    }

    customFilter(data: Action, filter: string): boolean {
        //取Filter條件
        let searchTerms: Action = JSON.parse(filter);

        //先預判是否有沒有值的欄位，無值不篩選進來
        let judgedActionId: boolean = isNullOrUndefined(data.actionId) ?
            true : data.actionId.toString().indexOf(searchTerms.actionId.toString()) != -1;

        let judgedName: boolean = isNullOrUndefined(data.name) ?
            true : data.name.toString().toLowerCase().indexOf(searchTerms.name.toLowerCase()) != -1;

        let judgedMethod: boolean = isNullOrUndefined(data.method) ?
            true : data.method.toString().toLowerCase().indexOf(searchTerms.method.toLowerCase()) != -1;

        let judgedControllerId: boolean = isNullOrUndefined(data.controllerId) ?
            true : data.controllerId.toString().indexOf(searchTerms.controllerId.toString()) != -1;


        //Because of data.description may contain null, searchTerms without anything should not filter out this data
        let judgedDescription: boolean = searchTerms.description == "" ?
            true : (isNullOrUndefined(data.description) ?
                false : data.description.toString().toLowerCase().indexOf(searchTerms.description.toLowerCase()) != -1);

        //交集為true者，才是要顯示的Dat
        return judgedActionId && judgedName && judgedMethod && judgedControllerId && judgedDescription;
    }

    openDeleteDialog(actionDetial: Action): void {
        const dialogRef = this.dialog.open(DialogActionDeleteComponent, {
            width: '250px',
            data: actionDetial,
        });

        dialogRef.afterClosed().subscribe((saved: boolean) => {
            if (saved) this.reloadData();
        });
    }

    openUpdateDialog(actionDetial: Action): void {
        const dialogRef = this.dialog.open(DialogActionUpdateComponent, {
            width: '400px',
            data: actionDetial,
        });

        dialogRef.afterClosed().subscribe((saved: boolean) => {
            if (saved) this.reloadData();
        });
    }

    openCreateDialog(): void {
        const dialogRef = this.dialog.open(DialogActionCreateComponent, {
            width: '80%',
            data: [],
        });

        dialogRef.afterClosed().subscribe((saved: boolean) => {

            if (saved) this.reloadData();
        });
    }

    reloadData() {
        this.actionService.getActions().subscribe((data: Action[]) => {
            this.actionDataSource.data = data;
        });
    }
}

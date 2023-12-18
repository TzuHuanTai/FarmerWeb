import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Menu } from '../../../interface/system_auth/menu';
import { MenuService } from '../../../api/system_auth/menu.service';
import { Observable } from 'rxjs';
import { startWith, tap, map } from 'rxjs/operators';
import { UntypedFormControl } from '@angular/forms';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { DialogMenuDeleteComponent } from './dialog/dialog-menu-delete.component';
import { DialogMenuUpdateComponent } from './dialog/dialog-menu-update.component';
import { DialogMenuCreateComponent } from './dialog/dialog-menu-create.component';

@Component({
  selector: 'system-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  providers: [MenuService],
})
export class MenuComponent implements OnInit {

  // 列舉選項傳至Dialog
  menuList: Menu[];

  // Parameters of Mat-Table
  dataSource: MatTableDataSource<Menu> | null;
  displayedColumns: string[] = ['menuId', 'path', 'menuText', 'sortNo', 'selector', 'component', 'rootMenuId', 'actions'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  // Parameters of filters
  menuIdFilter = new UntypedFormControl();
  pathFilter = new UntypedFormControl();
  menuTextFilter = new UntypedFormControl();
  sortNoFilter = new UntypedFormControl();
  selectorFilter = new UntypedFormControl();
  componentFilter = new UntypedFormControl();
  rootMenuIdFilter = new UntypedFormControl();
  filterValues = { menuId: '', path: '', menuText: '', sortNo: '', selector: '', component: '', rootMenuId: '' };
  menuIdFilteredOptions: Observable<string[]>;
  pathFilteredOptions: Observable<string[]>;
  menuTextFilteredOptions: Observable<string[]>;
  sortNoFilteredOptions: Observable<string[]>;
  selectorFilteredOptions: Observable<string[]>;
  componentFilteredOptions: Observable<string[]>;
  rootMenuIdFilteredOptions: Observable<string[]>;

  constructor(
    public dialog: MatDialog,
    private menuService: MenuService,
  ) {

  }

  ngOnInit() {
    // 重新讀取Mat-Table資料
    this.loadData();
  }

  loadData() {
    // Call api reload data
    this.menuService.getMenu().subscribe((menus: Menu[]) => {

      this.dataSource = new MatTableDataSource<Menu>(menus);

      if (this.dataSource) {
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.dataSource.filterPredicate = (data, filter) => this.customFilter(data, filter);

        /**
         * 開始監聽來至各FormControl地filter有無輸入關鍵字
         * 監聽時給入初始值startwith('')
         * 是為了讓FilterOptions可以在點擊時就似乎key過東西，自動會跑出下拉選單
         */
        // Listen menuIdFilter
        this.menuIdFilteredOptions = this.menuIdFilter.valueChanges.pipe(
          startWith(''),
          tap(changedValue => {
            this.filterValues.menuId = changedValue;
            this.dataSource.filter = JSON.stringify(this.filterValues);
            this.dataSource.paginator.firstPage();
          }),
          map(changedValue => this.autoFilter(
            menus.map(v => v.menuId.toString()),
            changedValue,
          ))
        );

        // Listen pathFilter
        this.pathFilteredOptions = this.pathFilter.valueChanges.pipe(
          startWith(''),
          tap(changedValue => {
            this.filterValues.path = changedValue;
            this.dataSource.filter = JSON.stringify(this.filterValues);
            this.dataSource.paginator.firstPage();
          }),
          map(changedValue => this.autoFilter(
            menus.filter(x => x.path != null).map(v => v.path),
            changedValue,
          ))
        );

        // Listen menuTextFilter
        this.menuTextFilteredOptions = this.menuTextFilter.valueChanges.pipe(
          startWith(''),
          tap(changedValue => {
            this.filterValues.menuText = changedValue;
            this.dataSource.filter = JSON.stringify(this.filterValues);
            this.dataSource.paginator.firstPage();
          }),
          map(changedValue => this.autoFilter(
            menus.filter(x => x.menuText != null).map(v => v.menuText),
            changedValue,
          ))
        );

        // Listen sortNoFilter
        this.sortNoFilteredOptions = this.sortNoFilter.valueChanges.pipe(
          startWith(''),
          tap(changedValue => {
            this.filterValues.sortNo = changedValue;
            this.dataSource.filter = JSON.stringify(this.filterValues);
            this.dataSource.paginator.firstPage();
          }),
          map(changedValue => this.autoFilter(
            menus.filter(x => x.sortNo != null)
              .map(v => v.sortNo.toString())
              .sort((a, b) => parseFloat(a) - parseFloat(b)),
            changedValue,
          ))
        );

        // Listen selectorFilter
        this.selectorFilteredOptions = this.selectorFilter.valueChanges.pipe(
          startWith(''),
          tap(changedValue => {
            this.filterValues.selector = changedValue;
            this.dataSource.filter = JSON.stringify(this.filterValues);
            this.dataSource.paginator.firstPage();
          }),
          map(changedValue => this.autoFilter(
            menus.filter(x => x.selector != null)
              .map(v => v.selector.toString())
              .sort((a, b) => parseFloat(a) - parseFloat(b)),
            changedValue,
          ))
        );

        // Listen componentFilter
        this.componentFilteredOptions = this.componentFilter.valueChanges.pipe(
          startWith(''),
          tap(changedValue => {
            this.filterValues.component = changedValue;
            this.dataSource.filter = JSON.stringify(this.filterValues);
            this.dataSource.paginator.firstPage();
          }),
          map(changedValue => this.autoFilter(
            menus.filter(x => x.component != null).map(v => v.component),
            changedValue,
          ))
        );

        // Listen rootMenuIdFilter
        this.rootMenuIdFilteredOptions = this.rootMenuIdFilter.valueChanges.pipe(
          startWith(''),
          tap(changedValue => {
            this.filterValues.rootMenuId = changedValue;
            this.dataSource.filter = JSON.stringify(this.filterValues);
            this.dataSource.paginator.firstPage();
          }),
          map(changedValue => this.autoFilter(
            menus.filter(x => x.rootMenuId != null)
              .map(v => v.rootMenuId.toString())
              .sort((a, b) => parseFloat(a) - parseFloat(b)),
            changedValue,
          ))
        );
      }

      // 把選單資料代入Dialog選項 且 增加"無隸屬"的選項。Deep copy!不然MatTable也會多一個"無"的資料
      this.menuList = JSON.parse(JSON.stringify(menus));
      this.menuList.unshift({ menuId: null, path: null, menuText: '無', sortNo: null, component: null, rootMenuId: null });
    });
  }

  private autoFilter(options: string[], changedValue: string): string[] {
    const filterValue = changedValue.toLowerCase();
    options = [...new Set(options)]; // distinct the array
    return options.filter(option => option.toLowerCase().includes(filterValue));
  }

  customFilter(Data: Menu, Filter: string): boolean {
    // 取Filter條件
    const searchTerms = JSON.parse(Filter);

    // 先預判是否有沒有值的欄位，無值不篩選進來
    const judgedMenuId: boolean = (Data.menuId === null || Data.menuId === undefined) ?
      true : Data.menuId.toString().toLowerCase().indexOf(searchTerms.menuId.toLowerCase()) !== -1;

    const judgedPath: boolean = (Data.path === null || Data.path === undefined) ?
      true : Data.path.toString().toLowerCase().indexOf(searchTerms.path.toLowerCase()) !== -1;

    const judgedMenuText: boolean = (Data.menuText === null || Data.menuText === undefined) ?
      true : Data.menuText.toString().toLowerCase().indexOf(searchTerms.menuText.toLowerCase()) !== -1;

    const judgedSortNo: boolean = (Data.sortNo === null || Data.sortNo === undefined) ?
      true : Data.sortNo.toString().toLowerCase().indexOf(searchTerms.sortNo.toLowerCase()) !== -1;

    const judgedSelector: boolean = (Data.selector === null || Data.selector === undefined) ?
      true : Data.selector.toString().toLowerCase().indexOf(searchTerms.selector.toLowerCase()) !== -1;

    const judgedComponent: boolean = (Data.component === null || Data.component === undefined) ?
      true : Data.component.toString().toLowerCase().indexOf(searchTerms.component.toLowerCase()) !== -1;

    // Because of data.rootMenuId may contain null, searchTerms without anything should not filter out this data
    const judgedRootMenuId: boolean = searchTerms.rootMenuId === '' ?
      true : ((Data.rootMenuId === null || Data.rootMenuId === undefined) ?
        false : Data.rootMenuId.toString().toLowerCase().indexOf(searchTerms.rootMenuId.toLowerCase()) !== -1);

    // 交集為true者，才是要顯示的Dat
    return judgedMenuId && judgedPath && judgedMenuText && judgedSortNo && judgedSelector && judgedComponent && judgedRootMenuId;
  }

  openDeleteDialog(MenuDetial: Menu): void {
    const dialogRef = this.dialog.open(DialogMenuDeleteComponent, {
      width: '250px',
      data: MenuDetial,
    });

    dialogRef.afterClosed().subscribe((saved: boolean) => {
      if (saved) { this.reloadData(); }
    });
  }

  openUpdateDialog(MenuDetial: Menu): void {
    const dialogRef = this.dialog.open(DialogMenuUpdateComponent, {
      width: '400px',
      data: [MenuDetial, this.menuList]
    });

    dialogRef.afterClosed().subscribe((saved: boolean) => {
      if (saved) { this.reloadData(); }
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(DialogMenuCreateComponent, {
      width: '80%',
      data: this.menuList,
    });

    dialogRef.afterClosed().subscribe((saved: boolean) => {
      if (saved) { this.reloadData(); }
    });
  }

  reloadData() {
    this.menuService.getMenu().subscribe((data: Menu[]) => {
      this.dataSource.data = data;
    });
  }
}

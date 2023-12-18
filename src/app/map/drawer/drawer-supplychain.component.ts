import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntypedFormControl } from '@angular/forms';
import { startWith } from 'rxjs/operators';

import { v34 } from '../../../api/ApiKmv/v34';
import { V34Service } from '../../../api/ApiKmv/v34.service';

import { DialogSupplyChainCreateComponent } from '../dialog/dialog-supplychain-create.component';
import { DialogSupplyChainDeleteComponent } from '../dialog/dialog-supplychain-delete.component';
import { MapService } from '../map.service';

@Component({
    selector: 'drawer-supplychain',
    templateUrl: './drawer-supplychain.component.html',
    styleUrls: ['./drawer-supplychain.component.css'],
    providers: [V34Service]
})

export class DrawerSupplyChainComponent implements OnInit {
    sideCompanyList: v34[] = [];
    CompanyFilter = new UntypedFormControl();
    filteredCompany: v34[];

    constructor(private REST_v34: V34Service, public dialog: MatDialog, private _MapService: MapService) {

    }

    ngOnInit() {
        // 抓側欄資料
        this.getContent();
    }

    getContent() {
        this.REST_v34.GetV34().subscribe((result: v34[]) => {
            this.filteredCompany = this.sideCompanyList = result;

            // Listen CompanyFilter
            this.CompanyFilter.valueChanges.pipe(startWith('')).subscribe(value => {
                this.filteredCompany = this.sideCompanyList.filter((v, i, a) => {
                    return this.companyFilter(v, value);
                });

                this._MapService.emitCompanyFilter(this.filteredCompany);
            });
        });
    }

    companyFilter(Data: v34, searchTerms: string): boolean {
        // Filter obj
        let FilterItem = JSON.stringify(Data).replace(/"|{|}|:| |,/g, '');

        Object.getOwnPropertyNames(Data).forEach((v) => {
            FilterItem = FilterItem.replace(v, '');
        });

        const Judged: boolean = FilterItem.toLowerCase().indexOf(searchTerms.toLowerCase()) !== -1;

        // 為true者，才是要顯示的Data
        return Judged;
    }

    onClickDetail(Lat: number, Lng: number) {
        const position: number[] = [Lat, Lng];
        this._MapService.emitDrawerDetailClick(position);
    }

    openDeleteDialog(item: v34): void {
        const dialogRef = this.dialog.open(DialogSupplyChainDeleteComponent, {
            width: '250px',
            data: item
        });
    }

    openUpdateDialog(item: v34): void {
        const isModified = true;
        const dialogRef = this.dialog.open(DialogSupplyChainCreateComponent, {
            width: '80%',
            data: [item, isModified]
        });
    }
}

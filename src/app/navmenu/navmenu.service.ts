import { Injectable } from '@angular/core';
//import { AsyncPipe } from '@angular/common';
import { Observable, Subscriber } from 'rxjs';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http'

import { vmNavMenu } from './navmenu'

@Injectable()
export class NavMenuService {
    public AllowMenuApiUrl: string = 'http://192.168.1.170/FarmerAPI/api/System/GetAllowedMenu';

    constructor(private http: HttpClient) { }

    getAllowedMenu() {
        return this.http.get<vmNavMenu[]>(this.AllowMenuApiUrl);
    }
}

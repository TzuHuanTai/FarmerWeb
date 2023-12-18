import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IMemberRole } from '../../interface/system_auth/i_member_role';
import { environment } from '../../environments/environment';

@Injectable()
export class IMemberRoleService {

    headers = new HttpHeaders({
        'Content-Type': 'application/json; charset=UTF-8'
    });

    constructor(private http: HttpClient) { }

    getIMemberRole(id: string) {
        return this.http.get<IMemberRole[]>(`${environment.authUrl}/IMemberRoles/${id}`);
    }

    postIMemberRole(body: IMemberRole) {
        return this.http.post<IMemberRole>(`${environment.authUrl}/IMemberRoles`,
            body,
            { headers: this.headers },
        );
    }

    deleteIMemberRole(account: string, id: number) {
        return this.http.delete<IMemberRole>(`${environment.authUrl}/IMemberRoles/${account}/${id}`);
    }
}

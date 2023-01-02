import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Member } from '../../interface/system_auth/member';
import { environment } from '../../environments/environment';

@Injectable()
export class MemberService {

    headers = new HttpHeaders({
        'Content-Type': 'application/json; charset=UTF-8',
    });

    constructor(private http: HttpClient) { }

    getMembers() {
        return this.http.get<Member[]>(`${environment.authUrl}/Members`);
    }

    postMember(body: Member) {
        return this.http.post<Member>(`${environment.authUrl}/Members`,
            body,
            { headers: this.headers }
        );
    }

    putMember(id: string, body: Member) {
        return this.http.put<Member>(`${environment.authUrl}/Members/${id}`,
            body,
            { headers: this.headers },
        );
    }

    deleteMember(id: string) {
        return this.http.delete<Member>(`${environment.authUrl}/Members/${id}`);
    }
}

import { Component, OnInit,EventEmitter,Output } from '@angular/core';
import { Router } from '@angular/router'
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../shared/user.service';
import { vmMenu } from '../../navmenu/navmenu';


@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
  //providers: [UserService] //已在app.module.ts統一provide了  
})
export class SignInComponent implements OnInit {

  isLoginError: boolean = false;
  AllowedMenuList: vmMenu[];
  AllowedSignList: vmMenu[];

  @Output() SignEvent: EventEmitter<null> = new EventEmitter();

  constructor(private AuthREST: UserService, private router: Router) { }

  ngOnInit() {
  }

  OnSubmit(account: string, password: string) {    
    this.AuthREST.userAuthentication(account, password)
    .subscribe((data: any) => {
      //console.log(data.token_type);
      //console.log(data.access_token);
      localStorage.setItem('userToken', data.access_token);
      console.log('Sign in success!');
      
      //觸發事件，讓menu監聽此事件，並觸發rebuildMenu以動態產生選單
      this.SignEvent.emit(null);
      console.log("OnSubmitemit")
      //重新導向至首頁
      this.router.navigate(['/Home']);
    },
      (err: HttpErrorResponse) => {
        this.isLoginError = true;
      });
  }

}
import { NgModule, Injectable } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// ----Component----//
import { ClimateComponent } from './climate/climate.component';
import { HomeComponent } from './home/home.component';
// 登入&登出
import { UserComponents } from './user/user.module';
// 統計
import { StatisticsComponent } from './statistics/statistics.component';
// 直播
import { LiveComponent } from './live/live.component';

// ----ViewModel----//
import { SignInComponent } from './user/sign-in/sign-in.component';
import { SignUpComponent } from './user/sign-up/sign-up.component';

// routes會由上而下依照順序比對url路徑
// 若把path:'**'放第一位，就無法去其他Component
// 所以加入新的route要用unshift堆疊上去
// 初始化時先保留路徑''、'**'，讓空白的或亂打的url能進入統一進入HomeComponent
// 因為reset routes是事後API讀進去，這樣一開始沒抓到component會顯示空白
// todo: '**' should guard to the 404 not found page

// 這邊宣告所有要用的Components
export const AppRoutingComponents = [

  // Climate
  ClimateComponent,

  // Home
  HomeComponent,

  // User登入&登出
  UserComponents,

  // 統計
  StatisticsComponent,

  // 直播
  LiveComponent,
];

/**
 * lazy loading的module要先放在這讓Angular能先編譯成.js file，後續dynamic路徑再透過API修改才可以
 */
const routes: Routes = [
  {
    path: 'Home',
    component: HomeComponent,
    pathMatch: 'full'
  }, {
    path: 'Live',
    component: LiveComponent,
    pathMatch: 'full'
  }, {
    path: 'Climate',
    component: ClimateComponent,
    pathMatch: 'full'
  }, {
    path: 'Statistics',
    component: StatisticsComponent,
    pathMatch: 'full'
  }, {
    path: 'SignIn',
    component: SignInComponent,
    pathMatch: 'full'
  }, {
    path: 'SignUp',
    component: SignUpComponent,
    pathMatch: 'full'
  }, {
    path: 'Map',
    loadChildren: () => import('./map/map.module').then(m => m.MapModule),
  }, {
    path: 'System',
    loadChildren: () => import('./system/system.module').then(m => m.SystemModule),
  }, {
    path: '**',
    component: HomeComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})

@Injectable()
export class AppRoutingModule { }

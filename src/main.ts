import 'reflect-metadata'; // 處理元數據，動態導入用
import 'zone.js'; // Angular material needs

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .then(success => console.log('Bootstrap success'))
  .then(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/ngsw-worker.js');
      console.log('regist serviceWorker success.');
    } else {
      console.log('not regist serviceWorker.');
    }
  })
  .catch(err => console.log(err));

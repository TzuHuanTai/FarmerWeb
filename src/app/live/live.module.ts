import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedMaterialModule } from '../shared-material.module';
import { WebrtcComponent } from './webrtc/webrtc.component';
import { LiveComponent } from './live.component';
import { LiveService } from './live.service';
import { LiveRoutingModule } from './live-routing.module';

@NgModule({
  declarations: [
    WebrtcComponent,
    LiveComponent,
  ],
  imports: [
    FormsModule,
    SharedMaterialModule,
    LiveRoutingModule,
  ],
  providers: [ LiveService ]
})
export class liveModule { }

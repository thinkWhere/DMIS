import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { MapComponent } from './map/map.component';
import { HomeComponent } from './home/home.component';

import { AuthenticationService } from './shared/authentication.service';
import { SitrepComponent } from './map/sitrep.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MapComponent,
    HomeComponent,
    SitrepComponent
  ],
  imports: [
      BrowserModule,
      FormsModule,
      HttpModule,
      RouterModule.forRoot([
          {
              path: '',
              component: HomeComponent
          },
          {
              path: 'login',
              component: LoginComponent
          },
          {
              path: 'map/:category',
              component: MapComponent
          },
          {
              path: 'sitrep',
              component: SitrepComponent
          },
          {
              path: 'admin',
              loadChildren: 'app/admin/admin.module#AdminModule'
          }
      ])
  ],
  providers: [AuthenticationService],
  bootstrap: [AppComponent]
})
export class AppModule { }

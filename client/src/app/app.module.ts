import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { MapComponent } from './map/map.component';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MapComponent,
    HomeComponent
  ],
  imports: [
      BrowserModule,
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
              path: 'map',
              component: MapComponent
          }
      ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

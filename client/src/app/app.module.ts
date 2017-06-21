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

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MapComponent,
    HomeComponent
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
              path: 'map',
              component: MapComponent
          }
      ])
  ],
  providers: [AuthenticationService],
  bootstrap: [AppComponent]
})
export class AppModule { }

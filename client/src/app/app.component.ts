import { Component } from '@angular/core';

import { AuthenticationService } from './shared/authentication.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [AuthenticationService]
})
export class AppComponent {

  // TODO: create user service
  user: any;

  constructor(
      private authenticationService: AuthenticationService
  ){}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('currentUser'));
  }

  logout(){
    this.authenticationService.logout();
    this.user = JSON.parse(localStorage.getItem('currentUser'));
  }
}
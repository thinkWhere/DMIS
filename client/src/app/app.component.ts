import { Component } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';
import { Router } from '@angular/router';

import { AuthenticationService } from './shared/authentication.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  // TODO: create user service
  user: any;
  subscription: Subscription;

  constructor(
      private authenticationService: AuthenticationService,
      private router: Router
  ){}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('currentUser'));
    this.subscription = this.authenticationService.usernameChanged$.subscribe(
      value => {
        this.user = JSON.parse(localStorage.getItem('currentUser'));
      });
  }

  /**
   * Log the user out
   */
  logout(){
    this.authenticationService.logout();
    this.user = JSON.parse(localStorage.getItem('currentUser'));
    this.router.navigateByUrl('/');
  }
}
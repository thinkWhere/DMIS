import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthenticationService } from './../shared/authentication.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  returnUrl: string;
  errorLogin: boolean;

  constructor(
      private route: ActivatedRoute,
      private router: Router,
      private authenticationService: AuthenticationService
  ) { }

  ngOnInit() {
    this.errorLogin = false;
  }

  /**
   * Login
   * @param loginForm
   */
  login(f: NgForm): void {
    // get the return url rom the route parameters or default to the homepage
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.errorLogin = false;
    this.authenticationService.login(f.value)
        .subscribe(
            data => {
              this.authenticationService.isLoggedIn = true;
              this.router.navigate([this.returnUrl]);
              this.authenticationService.setUsername();
            },
            error => {
              this.errorLogin = true;
            }
        )
  }
}

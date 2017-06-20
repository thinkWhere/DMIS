import { Component, OnInit } from '@angular/core';
import {NgForm} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthenticationService } from './../shared/authentication.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [AuthenticationService]
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
    // get the return url rom the route parameters or default to the homepage
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.errorLogin = false;
  }

  /**
   * Login
   * @param loginForm
   */
  login(f: NgForm): void {
    this.errorLogin = false;
    this.authenticationService.login(f.value)
        .subscribe(
            data => {
              // TODO: success
              console.log("success");
              this.router.navigate([this.returnUrl]);
            },
            error => {
              // TODO: error
              console.log("error");
              this.errorLogin = true;
            }
            
        )
  }
}

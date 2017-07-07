import { Injectable } from '@angular/core';
import {
  CanActivate, Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
}                           from '@angular/router';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(
      private authenticationService: AuthenticationService,
      private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    let url: string = state.url;

    return this.checkLogin(url);
  }

  checkLogin(url: string): boolean {
    if (this.authenticationService.isLoggedIn) {
      return true; 
    }

    // Navigate to the login page with extras
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: url }
    });
    return false;
  }
}
import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { PlatformLocation } from '@angular/common';

import { environment } from '../../environments/environment';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

@Injectable()
export class AuthenticationService {

  isLoggedIn: boolean;
  languageCode: string;
  
  // Observable string sources
  private usernameChangedSource = new Subject<string>();

  // Observable strings
  usernameChanged$ = this.usernameChangedSource.asObservable();

  constructor(
      private http: Http,
      private platformLocation: PlatformLocation
  ) {
    this.isLoggedIn = false;
    // Get the BaseURL to decide which language to request
    this.languageCode = 'en'; // default to English
    if (this.platformLocation.getBaseHrefFromDOM() === '/km'){
      this.languageCode = 'km';
    }
  }

  /**
   * Login to the application
   * @param loginCredentials
   */
  login(loginCredentials) {
    let headers = new Headers();
    headers.append('Content-Type', 'application/json; charset=UTF-8');
    headers.append('Authorization', 'Basic ' + btoa(loginCredentials.username.toLowerCase().trim() + ':' + loginCredentials.password));

    let options = new RequestOptions({ headers: headers});

    return this.http.post(environment.apiEndpoint + '/authentication/login', {}, options)
        .map(this.extractLoginData)
        .catch(this.handleError);
  }

  /**
   * Logout of the application
   */
  logout(): void {
    // remove user from local storage to log the user out
    localStorage.removeItem('currentUser');
    this.usernameChangedSource.next('');
    this.isLoggedIn = false;
  }

  /**
   * Set the username that is subscribed to.
   * Updating the Subject from the success handler causes it to go to the error handler so 
   * it needs to be set separately 
   */
  setUsername(){
    let user = JSON.parse(localStorage.getItem('currentUser'));
    this.usernameChangedSource.next(user.username);
  }

  /**
   * Gets the authentication token
   * @returns {any}
     */
  getToken(){
    let user = JSON.parse(localStorage.getItem('currentUser'));
    if (user){
      return user.token;
    }
    return '';
  }

  /**
   * Returns an authenticated header
   * @returns {Headers}
   */
  getAuthenticatedHeaders(){
    let headers = new Headers();
    let token = this.getToken();
    headers.append('Content-Type', 'application/json; charset=UTF-8');
    headers.append('Authorization', 'Bearer ' + token);
    headers.append('Accept-Language', this.languageCode);
    return headers;
  }

  /**
   * Check the login status of the user
   * Can be used on page load to check the local storage
   * @returns {any}
     */
  checkLoginStatus(){
    let user = JSON.parse(localStorage.getItem('currentUser'));
    if (user){
      this.isLoggedIn = true;
      return user;
    }
    else {
      return null;
    }
  }

  /**
   * Extract login data
   * @param res
   */
  private extractLoginData(res: Response) {
    let user = res.json();
    if (user && user.token) {
      // store user details in local storage to keep user logged in between page refreshes
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  /**
   * Handle the error
   * @param error
   * @returns {ErrorObservable}
     */
  private handleError (error: Response | any) {
    return Observable.throw('unspecified error');
  }
}

import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../environments/environment';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

@Injectable()
export class AuthenticationService {

  // TODO: create config service?
  private apiUrl = 'url/to/api';

  constructor(private http: Http) {}

  /**
   * Login to the application
   * @param loginCredentials
   */
  login(loginCredentials) {
    let headers = new Headers();
    headers.append('Content-Type', 'application/json; charset=UTF-8');
    headers.append('Authorization', 'Basic ' + btoa(loginCredentials.username.toLowerCase() + ':' + loginCredentials.password));

    let options = new RequestOptions({ headers: headers});

    return this.http.post(environment.apiEndpoint + '/user/login', {}, options)
        .map(this.extractLoginData)
        .catch(this.handleError);
  }

  /**
   * Logout of the application
   */
  logout(): void {
    // remove user from local storage to log the user out
    localStorage.removeItem('currentUser');
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
    let errMsg: string;
    if (error instanceof Response) {
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    return Observable.throw(errMsg);
  }
}

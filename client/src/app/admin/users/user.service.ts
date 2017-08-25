import { Injectable } from '@angular/core'
import { Http, RequestOptions } from '@angular/http';

import { AuthenticationService } from './../../shared/authentication.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class UserService {

  constructor(
      private authenticationService: AuthenticationService,
      private http: Http
  ) { }

  /**
   * Get all users
   * @returns {Observable<R>}
   */
  getAllUsers() {
    let headers = this.authenticationService.getAuthenticatedHeaders();
    let options = new RequestOptions({headers: headers});

    return this.http.get(environment.apiEndpoint + '/admin/user/list', options)
        .map(response => response.json())
  }

  /**
   * Add a user
   * @param user
   * @returns {Observable<R>}
   */
  addUser(user){
    let headers = this.authenticationService.getAuthenticatedHeaders();
    let options = new RequestOptions({headers: headers});
    let newUser = {
      password: user.password,
      role: user.role
    };
    return this.http.put(environment.apiEndpoint + '/admin/user/' + user.username, newUser, options)
        .map(response => response.json())
  }

  /**
   * Delete a user
   * @param username
   * @returns {Observable<R>}
   */
  deleteUser(username){
    let headers = this.authenticationService.getAuthenticatedHeaders();
    let options = new RequestOptions({headers: headers});

    return this.http.delete(environment.apiEndpoint + '/user/' + username, options)
        .map(response => response.json())
  }

  /**
   * Update the user's role
   * @param user
   * @returns {Observable<R>}
   */
  updateUserRole(user){
    var data = {
      role: user.role
    }
    let headers = this.authenticationService.getAuthenticatedHeaders();
    let options = new RequestOptions({headers: headers});

    return this.http.post(environment.apiEndpoint + '/user/' + user.username, data, options)
        .map(response => response.json())
  }
}

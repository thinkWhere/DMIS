import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../environments/environment';
import { AuthenticationService } from './../shared/authentication.service';

@Injectable()
export class LayerService {

  constructor(
      private authenticationService: AuthenticationService,
      private http: Http
  ) { }

  /**
   * Login to the application
   * @param loginCredentials
   */
  getLayers() {
    let headers = new Headers();
    let token = this.authenticationService.getToken();
    headers.append('Content-Type', 'application/json; charset=UTF-8');
    headers.append('Authorization', 'Bearer ' + token);

    let options = new RequestOptions({ headers: headers});

    // TODO: make category a parameter
    return this.http.get(environment.apiEndpoint + '/layer/toc/preparedness', options)
        .map(response => response.json())
        .catch(this.handleError);
  }

  /**
   * Handle the error
   * @param error
   * @returns {ErrorObservable}
     */
  private handleError (error: Response | any) {
    return Observable.throw(error);
  }
}

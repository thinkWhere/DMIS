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
   * Get identifiable layers
   * @param map
   * @returns {Array}
     */
  getIdentifiableLayers(map) {
    let identifiableLayers = [];
    let layers = map.getLayers().getArray();
    // find the layer
    for (var i = 0; i < layers.length; i++) {
      // Only identify layers visible on the map
      if (layers[i].getVisible() && layers[i].getProperties().layerName){
         identifiableLayers.push('dmis:' + layers[i].getProperties().layerName)
      }
    }
    return identifiableLayers;
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
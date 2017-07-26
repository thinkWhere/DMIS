import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../../environments/environment';
import { AuthenticationService } from './../../shared/authentication.service';

@Injectable()
export class LayerService {

  constructor(
      private authenticationService: AuthenticationService,
      private http: Http
  ) { }

  /**
   * Returns a list of layers
   * @returns {Observable<R>}
   */
  getLayers(){
    let headers = this.authenticationService.getAuthenticatedHeaders();
    let options = new RequestOptions({headers: headers});

    return this.http.get(environment.apiEndpoint + '/layer/toc/UNKNOWN', options)
        .map(response => response.json())
  }

  /**
   * Get a layer by ID
   * @param id
   * @returns {string}
   */
  getLayer(layerId){
    let headers = this.authenticationService.getAuthenticatedHeaders();
    let options = new RequestOptions({headers: headers});

    return this.http.get(environment.apiEndpoint + '/layer/' + layerId, options)
        .map(response => response.json())
  }

  /**
   * Update layer details
   * @param layer
   * @returns {Observable<R>}
   */
  updateLayer(layer){
    let headers = this.authenticationService.getAuthenticatedHeaders();
    let options = new RequestOptions({headers: headers});

    var data = {
      layerCopyright: layer.layerCopyright,
      layerGroup: layer.layerGroup,
      layerTitle: layer.layerTitle,
      mapCategory: layer.mapCategory
    };

    return this.http.post(environment.apiEndpoint + '/layer/' + layer.layerId, data, options)
        .map(response => response.json())
  }

}

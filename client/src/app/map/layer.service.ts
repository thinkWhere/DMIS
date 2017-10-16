import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions } from '@angular/http';
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
    let headers = this.authenticationService.getAuthenticatedHeaders();
    let options = new RequestOptions({headers: headers});

    return this.http.get(environment.apiEndpoint + '/layer/list', options)
        .map(response => response.json())
        .catch(this.handleError);
  }

  /**
   * Get identifiable layers
   * @param map
   * @param type
   * @returns {Array}
     */
  getIdentifiableLayers(map, type) {
    let identifiableLayers = [];
    let layers = map.getLayers().getArray();
    // find the layer
    for (var i = 0; i < layers.length; i++) {
      // Only identify layers visible on the map
      if (layers[i].getVisible()){
          if (layers[i].getProperties().layerType === type){
            identifiableLayers.push(layers[i])
          }
      }
    }
    return identifiableLayers;
  }

  /**
   * Get a GeoJSON layer
   * @param layerName
   * @returns {Observable<R|T>}
   */
  getGeoJSON(layer) {

    var layerOptions = {
      layerSource: layer.layerSource
    };
    let headers = this.authenticationService.getAuthenticatedHeaders();
    let options = new RequestOptions({
      params: layerOptions,
      headers: headers
    });
    return this.http.get(environment.apiEndpoint + '/map/geojson', options)
        .map(response => response.json())
        .catch(this.handleError);
  }

  /**
   * Set the z index of a layer depending on the geometry type
   * @param layer
   */
  setZIndex(layer){
      let geometryType = layer.getProperties().layerGeometryType;
      if (geometryType === 'polygon') {
        layer.setZIndex(0);
      }
      if (geometryType === 'line') {
        layer.setZIndex(1);
      }
      if (geometryType === 'point') {
        layer.setZIndex(2);
      }
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
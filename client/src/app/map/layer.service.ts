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

    // TODO: make category a parameter
    return this.http.get(environment.apiEndpoint + '/layer/toc/UNKNOWN', options)
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
   * TODO: call the API instead of local sample files
   * @param layerName
   * @returns {Observable<R|T>}
   */
  getGeoJSON(layerName){
    // Get the lightning layers from the API
    if (layerName === 'earthnetworks_lightning_points' || layerName === 'earthnetworks_lightning_heatmap'){
      var layer = {
        layerName: layerName
      };
      let headers = this.authenticationService.getAuthenticatedHeaders();
      let options = new RequestOptions({
        params: layer,
        headers: headers
      });
      return this.http.get(environment.apiEndpoint + '/v1/map/geojson', options)
          .map(response => response.json())
          .catch(this.handleError);
    }
    // Use hardcoded file
    else {
      var sourceGeoJSON = '';
      switch(layerName){
        case 'ktm_pcdm_affected_healthcenter':
          sourceGeoJSON = 'affected_healthcenter';
          break;
        case 'ktm_pcdm_affected_road':
          sourceGeoJSON = 'affected_road';
          break;
        case 'ktm_pcdm_affected_school':
          sourceGeoJSON = 'affected_school';
          break;
        case 'ktm_pcdm_affected_wells':
          sourceGeoJSON = 'affected_wells';
          break;
        case 'ktm_pcdm_at_risk_commune':
          sourceGeoJSON = 'at_risk_commune';
          break;
        case 'ktm_pcdm_at_risk_village':
          sourceGeoJSON = 'at_risk_village';
          break;
        case 'ktm_pcdm_data_daily_actual':
          sourceGeoJSON = 'data_daily_actual';
          break;
        default:
          sourceGeoJSON = ''
      }
      return this.http.get('assets/test-geojson/' + sourceGeoJSON + '.geojson')
          .map(response => response.json())
          .catch(this.handleError);
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
import {Injectable} from '@angular/core';
import { Http, Headers, Response, RequestOptions, ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import * as ol from 'openlayers';

import { AuthenticationService } from './../shared/authentication.service';


@Injectable()
export class MapService {

    map:any;
    self = this;

    constructor(
        private authenticationService: AuthenticationService,
        private http: Http
    ) {}

    /**
     * Initialise an OpenLayers map
     */
    initMap() {
        this.map = new ol.Map({
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM({
                        url: "http://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
                        attributions: "<a href='http://www.openstreetmap.org/copyright/' target='_blank'>© OpenStreetMap</a> contributors"
                    })
                })
            ],
            view: new ol.View({
                center: ol.proj.transform([104.99, 12.56], 'EPSG:4326', 'EPSG:3857'),
                zoom: 7
            })
        });
    }

    /**
     * Return the map
     * @returns map {any}
     */
    getMap() {
        return this.map;
    }

    /**
     * Get the tile by adding authentication headers
     * @param url
     * @returns {any|Promise<R>|Maybe<T>}
     */
    getTile(url){
        let headers = new Headers();
        let token = this.authenticationService.getToken();
        headers.append('Content-Type', 'application/json; charset=UTF-8');
        headers.append('Authorization', 'Bearer ' + token);
        headers.append('Accept', 'image/png');

        let options = new RequestOptions({
            headers: headers,
            responseType: ResponseContentType.Blob
        });

        return this.http.get(url, options)
            .map(response => (<Response>response).blob())
    }
}
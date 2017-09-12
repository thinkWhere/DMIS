import {Injectable} from '@angular/core';
import { Http, Headers, Response, RequestOptions, ResponseContentType } from '@angular/http';
import * as ol from 'openlayers';

import { AuthenticationService } from './../shared/authentication.service';


@Injectable()
export class MapService {

    map: any;
    initialExtents: any = [104.50, 12.56];

    initialZoom: any = 8;

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
                        attributions: "<a href='http://www.openstreetmap.org/copyright/' target='_blank'>© OpenStreetMap</a> contributors"
                    })
                })
            ],
            view: new ol.View({
                center: ol.proj.transform(this.initialExtents, 'EPSG:4326', 'EPSG:3857'),
                zoom: this.initialZoom
            })
        });

        // Add scale line control
        var scaleLineControl = new ol.control.ScaleLine();
        this.map.addControl(scaleLineControl);

        // Add mouse position control
        var mousePositionFormat = function () {
            return (
                function (coord) {
                    return ol.coordinate.toStringHDMS(coord);
                });
        };
        var mousePositionControl = new ol.control.MousePosition({
            coordinateFormat: mousePositionFormat(),
            projection: new ol.proj.Projection({code: 'EPSG:4326'}),
            undefinedHTML: 'no coordinates'
        });
        this.map.addControl(mousePositionControl);
    }

    /**
     * Return the map
     * @returns map {any}
     */
    getMap() {
        this.map.updateSize();
        return this.map;
    }

    /**
     * Get the image by adding authentication headers
     * @param url
     * @returns {any|Promise<R>|Maybe<T>}
     */
    getImage(url){
        let headers = new Headers();
        let token = this.authenticationService.getToken();
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
import {Injectable} from '@angular/core';
import { Http, Headers, Response, RequestOptions, ResponseContentType } from '@angular/http';
import {Observable} from 'rxjs/Observable';
import * as ol from 'openlayers';

import { LayerService } from './layer.service';
import { AuthenticationService } from './../shared/authentication.service';

@Injectable()
export class IdentifyService {

    /** Popup **/
    container: any;
    content: any;
    closer: any;
    overlay: any;

    /** Identify **/
    maxFeatureCount: number = 10;
    identifyAsyncCalls: any;

    constructor(
        private http: Http,
        private layerService: LayerService,
        private authenticationService: AuthenticationService
    ) {}

    /**
     * Add identify popup
     * @param map
     */
    addIdentifyPopup(map) {

        /**
         * Elements that make up the popup.
         */
        this.container = document.getElementById('popup');
        this.content = document.getElementById('popup-content');
        this.closer = document.getElementById('popup-closer');

        /**
         * Create an overlay to anchor the popup to the map.
         */
        this.overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
            element: this.container,
            autoPan: true
        }));
        map.addOverlay(this.overlay);

        /**
         * Add a click handler to hide the popup.
         * @return {boolean} Don't follow the href.
         */
        this.closer.onclick = function () {
            this.overlay.setPosition(undefined);
            this.closer.blur();
            return false;
        }.bind(this);
    }

    /**
     * Add identify event handlers
     * TODO: review after adding type of layer to DB/API
     * @param map
     * @param source
     */
    addIdentifyEventHandlers(map, source){
        map.on('singleclick', (evt) => {
            // The identify calls go to different sources depending on the type of layer
            // So we need to wait for all the calls to finish before displaying a popup
            this.identifyAsyncCalls = {
                pdcArcGISRest: false,
                dmisGetFeatureInfo: false
            };
            this.content.innerHTML = '';
            this.overlay.setPosition(null);
            var coordinate = evt.coordinate;
            // WMS GetFeatureInfo
            var viewResolution = map.getView().getResolution();
            var getFeatureInfoUrl = source.getGetFeatureInfoUrl(
                evt.coordinate, viewResolution, 'EPSG:3857',
                {
                    'INFO_FORMAT': 'application/json',
                    'FEATURE_COUNT': this.maxFeatureCount,
                    'BUFFER': 10
                });
            var identifiableLayers = this.layerService.getIdentifiableLayers(map, 'wms');
            getFeatureInfoUrl = this.updateUrlParameter(getFeatureInfoUrl, 'QUERY_LAYERS', identifiableLayers.join());
            getFeatureInfoUrl = this.updateUrlParameter(getFeatureInfoUrl, 'LAYERS', identifiableLayers.join());
            if (getFeatureInfoUrl && identifiableLayers.length > 0) {
                var parser = new ol.format.GeoJSON();
                this.getFeatureInfo(getFeatureInfoUrl)
                        .subscribe(
                        data => {
                            // Success
                            this.identifyAsyncCalls.dmisGetFeatureInfo = true;
                            var result = parser.readFeatures(data);
                            var content = this.generatePopupContent(result);
                            this.content.innerHTML += content;
                            this.checkOtherCallsAndShowPopup(coordinate);
                        },
                        error => {
                            // TODO: handle error?
                            this.identifyAsyncCalls.dmisGetFeatureInfo = true;
                        }
                    );
            }
            else {
                // No call is made so set it to finished
                this.identifyAsyncCalls.dmisGetFeatureInfo = true;
            }

            // Use ArcGIS REST identify
            var arcgisLayers = this.layerService.getIdentifiableLayers(map, 'arcgisrest');
            var geometry = evt.coordinate[0] + ',' + evt.coordinate[1];
            var mapExtent = '-20037700,20037700,-30241100,30241100';
            var imageDisplay = map.getSize()[0] + ',' + map.getSize()[1] + ',' + '72';
            // TODO: add ability to have more than one ArcGIS REST layer
            var arcUrl = arcgisLayers[0].getProperties().layerSource + '/identify?' +
                'geometry=' + geometry +
                '&geometryType=esriGeometryPoint' +
                '&layers=all&tolerance=10' +
                '&mapExtent=' + mapExtent +
                '&imageDisplay=' + imageDisplay +
                '&returnGeometry=false&f=json';
            if (arcUrl && arcgisLayers.length > 0){
                 this.identifyArcGISRest(arcUrl)
                        .subscribe(
                        data => {
                            // Success
                            this.identifyAsyncCalls.pdcArcGISRest = true;
                            var content = this.generateArcPopupContent(data.results);
                            this.content.innerHTML += content;
                            this.checkOtherCallsAndShowPopup(coordinate);
                        },
                        error => {
                            // TODO: handle error?
                             this.identifyAsyncCalls.pdcArcGISRest = true;
                        }
                    );
            }
            else {
                // No call is made so set it to finished
                this.identifyAsyncCalls.pdcArcGISRest = true;
            }
        });
    }

    /**
     * Make a call to the ArcGIS REST service
     * @param url
     * @returns {Observable<R|T>}
     */
    private identifyArcGISRest(url){
         return this.http.get(url)
                .map(response => response.json())
                .catch(this.handleError);
    }

    /**
     * Show a popup wwhen all identify calls have finished
     * @param coordinate
     */
    private checkOtherCallsAndShowPopup(coordinate){
        for (var call in this.identifyAsyncCalls){
            if (!this.identifyAsyncCalls[call]){
                return;
            }
        }
        if (this.content.innerHTML === ''){
            this.content.innerHTML = 'No information available.';
        }
        this.overlay.setPosition(coordinate);
    }

    /**
     * Make a GetFeatureInfo call
     * @param url
     * @returns {any|Promise<R>|Maybe<T>}
     */
    private getFeatureInfo(url) {
        let headers = new Headers();
        let token = this.authenticationService.getToken();
        headers.append('Authorization', 'Bearer ' + token);

        let options = new RequestOptions({headers: headers});

        return this.http.get(url, options)
            .map(response => response.json())
            .catch(this.handleError);
    }

    /**
     * Generates the popup content with the identify results
     * TODO: create template for popup?
     * @param result
     */
    private generatePopupContent(result) {
        var htmlContent = '';
        if (result.length) {
            var tableContent = '';
            for (var i = 0, ii = result.length; i < ii; ++i) {
                tableContent += '<h4>' + result[i].getId() + '</h4>';
                tableContent += '<table class="table table-condensed">';
                tableContent += '<tbody>';
                tableContent += '<thead><tr><th>Property</th><th>Value</th></tr></thead>';
                var properties = result[i].getKeys();
                // exclude geometry property
                for (var j = 0; j < properties.length; j++) {
                    if (properties[j] !== 'geometry') {
                        tableContent += '<tr>';
                        // Property key
                        tableContent += '<th scope="row">';
                        tableContent += properties[j];
                        tableContent += '</td>';
                        // Property value
                        tableContent += '<td>';
                        tableContent += result[i].get(properties[j]);
                        tableContent += '</td>';
                        tableContent += '</tr>';
                    }
                }
                tableContent += '</tbody>';
                tableContent += '</table>';
            }
            htmlContent = tableContent;
        }
        return htmlContent;
    }

    /**
     * Generates the popup content for ArcGIS REST Identify results
     * @param result
     * @returns {string}
     */
    private generateArcPopupContent(result) {
        var htmlContent = '';
        if (result.length) {
            var tableContent = '';
            for (var i = 0; i < result.length; i++) {
                tableContent += '<h4>' + result[i].layerName + '</h4>';
                tableContent += '<table class="table table-condensed">';
                tableContent += '<tbody>';
                tableContent += '<thead><tr><th>Property</th><th>Value</th></tr></thead>';
                var attributes = result[i].attributes;
                // exclude geometry property
                for (var property in attributes) {
                        tableContent += '<tr>';
                        // Property key
                        tableContent += '<th scope="row">';
                        tableContent += property;
                        tableContent += '</td>';
                        // Property value
                        tableContent += '<td>';
                        tableContent += attributes[property];
                        tableContent += '</td>';
                        tableContent += '</tr>';
                }
                tableContent += '</tbody>';
                tableContent += '</table>';
            }
            htmlContent = tableContent;
        }
        return htmlContent;
    }

    /**
     * Handle the error
     * @param error
     * @returns {ErrorObservable}
     */
    private handleError(error:Response | any) {
        return Observable.throw(error);
    }
    
    /**
     * Add/update a key-value pair in the URL query parameters
     * @param uri
     * @param key
     * @param value
     * @returns {string}
     */
    private updateUrlParameter(uri, key, value) {
        // remove the hash part before operating on the uri
        var i = uri.indexOf('#');
        var hash = i === -1 ? '' : uri.substr(i);
        uri = i === -1 ? uri : uri.substr(0, i);

        var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
        var separator = uri.indexOf('?') !== -1 ? "&" : "?";
        if (uri.match(re)) {
            uri = uri.replace(re, '$1' + key + "=" + value + '$2');
        } else {
            uri = uri + separator + key + "=" + value;
        }
        return uri + hash;  // finally append the hash as well
    }
}

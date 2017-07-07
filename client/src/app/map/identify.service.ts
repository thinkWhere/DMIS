import {Injectable} from '@angular/core';
import { Http, Headers, Response, RequestOptions, ResponseContentType } from '@angular/http';
import {Observable} from 'rxjs/Observable';
import * as ol from 'openlayers';

import { LayerService } from './layer.service';
import { AuthenticationService } from './../shared/authentication.service';

@Injectable()
export class IdentifyService {

    container: any;
    content: any;
    closer: any;
    overlay: any;
    maxFeatureCount: number = 10;

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
     * @param map
     * @param source
     */
    addIdentifyEventHandlers(map, source){
        map.on('singleclick', (evt) => {
            this.content.innerHTML = '';
            this.overlay.setPosition(null);
            var viewResolution = map.getView().getResolution();
            var url = source.getGetFeatureInfoUrl(
                evt.coordinate, viewResolution, 'EPSG:3857',
                {
                    'INFO_FORMAT': 'application/json',
                    'FEATURE_COUNT': this.maxFeatureCount
                });
            var identifiableLayers = this.layerService.getIdentifiableLayers(map);
            url = this.updateUrlParameter(url, 'QUERY_LAYERS', identifiableLayers.join());
            url = this.updateUrlParameter(url, 'LAYERS', identifiableLayers.join());
            if (url && identifiableLayers.length > 0) {
                var coordinate = evt.coordinate;
                var parser = new ol.format.GeoJSON();
                this.getFeatureInfo(url)
                        .subscribe(
                        data => {
                            // Success
                            var result = parser.readFeatures(data);
                            this.populatePopup(result);
                            this.overlay.setPosition(coordinate);
                        },
                        error => {
                            // TODO: handle error?
                        }
                    );
            }
        });
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
     * Populates the popup with the identify results
     * TODO: create template for popup?
     * @param result
     */
    private populatePopup(result) {
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
            this.content.innerHTML = tableContent;
        } else {
            this.content.innerHTML = 'No information available.';
        }
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

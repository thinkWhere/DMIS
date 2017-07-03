import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import * as ol from 'openlayers';

import { LayerService } from './layer.service';

@Injectable()
export class IdentifyService {

    container: any;
    content: any;
    closer: any;
    overlay: any;

    constructor(
        private http: Http,
        private layerService: LayerService
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
        /**
         * Add a click handler to the map to render the popup.
         * TODO: add identify for each layer
         */
        map.on('singleclick', (evt) => {
            var viewResolution = map.getView().getResolution();
            var url = source.getGetFeatureInfoUrl(
                evt.coordinate, viewResolution, 'EPSG:3857',
                {'INFO_FORMAT': 'application/json'});
            var identifiableLayers = this.layerService.getIdentifiableLayers(map);
            url = this.updateUrlParameter(url, 'QUERY_LAYERS', identifiableLayers.join());
            url = this.updateUrlParameter(url, 'LAYERS', identifiableLayers.join());
            if (url) {
                var coordinate = evt.coordinate;
                var parser = new ol.format.GeoJSON();
                // Mock - TODO: replace for call to API
                var response = '{"type":"FeatureCollection","totalFeatures":"unknown","features":[{"type":"Feature","id":"Cambodia_KHM_admin0.1","geometry_name":"geom","properties":{"id":1,"id_0":40,"iso":"KHM","name_engli":"Cambodia"}}],"crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:EPSG::3857"}}}';
                var result = parser.readFeatures(response);
                if (result.length) {
                    var info = [];
                    // TODO: create template for popup?
                    var tableContent = '<table class="table table-condensed">';
                    tableContent += '<tbody>';
                    tableContent += '<thead><tr><th>Property</th><th>Value</th></tr></thead>';
                    for (var i = 0, ii = result.length; i < ii; ++i) {
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
                    }
                    tableContent += '</tbody>';
                    tableContent += '</table>';
                    this.content.innerHTML = tableContent;
                } else {
                    this.content.innerHTML = '&nbsp;';
                }
                this.overlay.setPosition(coordinate);
                // TODO: use getFeatureInfo function to get the response from the server instead of mock
            }
        });
    }

    /**
     * Make a GetFeatureInfo call
     * @param url
     * @returns {any|Promise<R>|Maybe<T>}
     */
    private getFeatureInfo(url) {
        return this.http.get(url)
            .map(response => response.json())
            .catch(this.handleError);
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

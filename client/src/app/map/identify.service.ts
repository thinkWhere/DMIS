import {Injectable} from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
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

    isActive: any = false;

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
            if (!this.isActive) {
                return;
            }
            // The identify calls go to different sources depending on the type of layer
            // So we need to wait for all the calls to finish before displaying a popup
            // Supported layer types are:
            // - Pacific Disaster Centre ArcGIS REST layer (external)
            // - DMIS WMS GetFeatureInfo
            // - DMIS geoJSON (this is not async but include to allow them to appear in one popup)
            this.identifyAsyncCalls = {
                pdcArcGISRest: false,
                dmisGetFeatureInfo: false,
                dmisGeoJSON: false
            };
            this.content.innerHTML = '';
            this.overlay.setPosition(null);

            // Identify - WMS GetFeatureInfo
            this.setupAndIdentifyWMS(map, source, evt);

            // Identify - ArcGIS REST
            this.setupAndIdentifyArcGISRest(map, evt);

            // Identify - GeoJSON
            this.setupAndIdentifyGeoJSON(map, evt);
        });
    }

    /**
     * Set the identify tool to active/inactive
     * @param boolean
     */
    setActive(boolean){
        this.isActive = boolean;
    };

    /**
     * Setup and identify WMS
     * @param map
     * @param source
     * @param evt
     */
    private setupAndIdentifyWMS(map, source, evt){
         if (source) {
             var coordinate = evt.coordinate;
             var viewResolution = map.getView().getResolution();
             var getFeatureInfoUrl = source.getGetFeatureInfoUrl(
                 evt.coordinate, viewResolution, 'EPSG:3857',
                 {
                     'INFO_FORMAT': 'application/json',
                     'FEATURE_COUNT': this.maxFeatureCount,
                     'BUFFER': 10
                 });
             var identifiableLayers = this.layerService.getIdentifiableLayers(map, 'wms');
             var identifiableLayerNames = [];
             for (var i = 0; i < identifiableLayers.length; i++) {
                 identifiableLayerNames.push(identifiableLayers[i].getProperties().layerName);
             }
             getFeatureInfoUrl = this.updateUrlParameter(getFeatureInfoUrl, 'QUERY_LAYERS', identifiableLayerNames.join());
             getFeatureInfoUrl = this.updateUrlParameter(getFeatureInfoUrl, 'LAYERS', identifiableLayerNames.join());
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
         }
    }

    /**
     * Setup and identify ArcGIS REST layer
     * @param map
     * @param evt
     */
    private setupAndIdentifyArcGISRest(map, evt){
         var coordinate = evt.coordinate;
         var arcgisLayers = this.layerService.getIdentifiableLayers(map, 'arcgisrest');
            var geometry = evt.coordinate[0] + ',' + evt.coordinate[1];
            var mapExtent = '-20037700,20037700,-30241100,30241100';
            var imageDisplay = map.getSize()[0] + ',' + map.getSize()[1] + ',' + '72';
            // TODO: add ability to have more than one ArcGIS REST layer
            if (arcgisLayers.length > 0) {
                var arcUrl = arcgisLayers[0].getProperties().layerSource + '/identify?' +
                    'geometry=' + geometry +
                    '&geometryType=esriGeometryPoint' +
                    '&layers=all&tolerance=10' +
                    '&mapExtent=' + mapExtent +
                    '&imageDisplay=' + imageDisplay +
                    '&returnGeometry=false&f=json';
            }
            if (arcUrl && arcgisLayers.length > 0){
                 this.identifyArcGISRest(arcUrl)
                        .subscribe(
                        data => {
                            // Success
                            this.identifyAsyncCalls.pdcArcGISRest = true;
                            // Only only layer at a time supported
                            var content = this.generateArcPopupContent(data.results, arcgisLayers[0].getProperties().layerTitle);
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
    }

    /**
     * Setup and identify GeoJSON layer
     * @param map
     * @param evt
     */
    private setupAndIdentifyGeoJSON(map, evt){
        var pixel = evt.pixel;
        var coordinate = evt.coordinate;
        var features = [];
        map.forEachFeatureAtPixel(pixel, function(feature, layer){
            // Add the layer title so it can be displayed as a header in the identify popup
            var layerTitle = layer.getProperties().layerTitle;
            feature.setProperties({"dmisLayerTitle": layerTitle});
            features.push(feature);

        }, {hitTolerance: 10});
        this.identifyAsyncCalls.dmisGeoJSON = true;
        var content = this.generatePopupContent(features);
        this.content.innerHTML += content;
        this.checkOtherCallsAndShowPopup(coordinate);
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
                // If the layerTitle is set on the properties, use this. This title is the same as
                // the title displayed in the table of contents. If it is not available, then try to
                // use the ID returned in the results (e.g. for WMS, where GeoServer knows which layer
                // belongs to which property
                // TODO: match the ID returned in results with the layerTitle property on the layer to display a more
                // user friendly layer title for WMS results
                var layerTitle = '';
                if (result[i].getProperties().dmisLayerTitle){
                    layerTitle = result[i].getProperties().dmisLayerTitle;
                }
                else if (result[i].getId()){
                    layerTitle = result[i].getId();
                }
                else {
                    layerTitle = '';
                }
                if (layerTitle) {
                    tableContent += '<h4>' + layerTitle + '</h4>';
                }
                tableContent += '<table class="table table-condensed">';
                tableContent += '<tbody>';
                tableContent += '<thead><tr><th>Property</th><th>Value</th></tr></thead>';
                var properties = result[i].getKeys();
                // exclude geometry property
                for (var j = 0; j < properties.length; j++) {
                    if (properties[j] !== 'geometry' && properties[j] !== 'dmisLayerTitle') {
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
    private generateArcPopupContent(result, layerTitle) {
        var htmlContent = '';
        if (result.length) {
            var tableContent = '';
            for (var i = 0; i < result.length; i++) {
                tableContent += '<h4>' + layerTitle + '</h4>';
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

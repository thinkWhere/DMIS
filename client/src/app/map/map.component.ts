import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GroupByPipe } from 'angular-pipes/src/aggregate/group-by.pipe';
import {DomSanitizer} from '@angular/platform-browser';
import * as ol from 'openlayers';

import { LayerService } from './layer.service';
import { MapService } from './map.service';
import { IdentifyService } from './identify.service';
import { StyleService } from './style.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  providers: [LayerService, MapService, IdentifyService, StyleService]
})
export class MapComponent implements OnInit {

    showContent: boolean;
    showCategoryPicker: boolean;
    category: string;
    layers: any;
    map: any;
    wmsSource: any; // WMS source for use in identify

    constructor(
        private router: Router,
        private layerService: LayerService,
        private mapService: MapService,
        private identifyService: IdentifyService,
        private styleService: StyleService,
        private sanitizer:DomSanitizer
    ){}

    ngOnInit() {

        this.showContent = true;
        this.showCategoryPicker = false;
        this.category = 'preparedness';
        this.layers = [];

        this.initMap();
        
        this.layerService.getLayers()
            .subscribe(
            data => {
                // Success
                this.layers = data;
                if (this.layers.preparednessLayers){
                    this.addLayers(this.layers.preparednessLayers);
                }
                if (this.layers.incidentLayers){
                    this.addLayers(this.layers.incidentLayers);
                }
                if (this.layers.responseLayers){
                    this.addLayers(this.layers.responseLayers);
                }
                // If a WMS source exists, add identify event handlers. The WMS source is used by the
                // identify service to generate the GetFeatureInfo URL
                if (this.wmsSource){
                    this.identifyService.addIdentifyEventHandlers(this.map, this.wmsSource);
                }
            },
            error => {
              // TODO: better error handling. At the moment it always redirects to the login page (also when it is not 
              // a 401
              this.router.navigate(['/login'], { queryParams: { returnUrl: 'map/preparedness' }});
            }
        );
    }

    /**
     * Toggles the visibility of the table of contents 
     */
    toggleContent(): void {
        this.showContent = !this.showContent;
    }

    /**
     * Toggles the visibility of the category picker
     */
    toggleCategoryPicker(): void {
        this.showCategoryPicker = !this.showCategoryPicker;
    }

    /**
     * Set category
     * @param category
     */
    setCategory(category): void {
        this.category = category;
        this.showCategoryPicker = false;
        this.router.navigate(['/map/' + this.category]);
    }

    /**
     * Toggle a layer
     */
    toggleLayer(layerName): void {
        // get the layers
        var layers = this.map.getLayers().getArray();
        // find the layer
        for (var i = 0; i < layers.length; i++) {
            // toggle visibility
            if (layerName === layers[i].getProperties().layerName) {
                layers[i].setVisible(!layers[i].getVisible());
                return;
            }
        }
    }

    /**
     * Initialise the map
     */
    private initMap() {
        this.mapService.initMap();
        this.map = this.mapService.getMap();
        this.map.setTarget('map');
        this.checkCategory();
        this.router.events.subscribe(() => {
            this.checkCategory();
        });
        this.identifyService.addIdentifyPopup(this.map);
    }

    /**
     * Check the category in the URL
     */
    private checkCategory() {
        if (this.router.url === '/map/preparedness') {
            this.category = 'preparedness';
        }
        if (this.router.url === '/map/incidents') {
            this.category = 'incidents';
        }
        if (this.router.url === '/map/assessment') {
            this.category = 'assessment';
        }
    }

     /**
     * Add layers to the map - maybe move to layer service
     * TODO: review and maybe add to layer service when this function grows?
     */
    private addLayers (layers) {
        for (var i = 0; i < layers.length; i++){
            if (layers[i].layerType === 'wms'){
                this.setWMSLayerLegend(layers[i]);
                this.addWMSLayer(layers[i]);
            }
            if (layers[i].layerType === 'arcgisrest'){
                this.addArcGISRESTLayer(layers[i]);
            }
            if (layers[i].layerType === 'geojson'){
                this.addGeoJSONLayer(layers[i]);
            }
        }
    }

    /**
    * Set layer legend for a WMS layer using a GetLegendGraphic request
    * @param layer
    */
    private setWMSLayerLegend(layer){
         layer.layerLegend = '';
         var url = environment.apiEndpoint + '/v1/map/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&height=10&LAYER=' + layer.layerName + '&legend_options=fontName:Times%20New%20Roman;fontSize:6;fontAntiAliasing:true;fontColor:0x000033;dpi:180&transparent=true';
         this.mapService.getImage(url)
             .subscribe(
                 data => {
                     // Success - returns a Blob - create an URL from it and update the layer legend
                     var urlCreator = window.URL;
                     var imageUrl = urlCreator.createObjectURL(data);
                     layer.layerLegend = this.sanitizer.bypassSecurityTrustUrl(imageUrl);
                 },
                 error => {
                     // TODO: potentially handle error?
                 }
             )
    }

    /**
     * Add a WMS layer
     * TODO: use source property on the layer to allow support for a WMS from another source
     * @param wmsLayer
     */
    private addWMSLayer(wmsLayer) {
        var newSource = new ol.source.TileWMS({
            params: {
                'LAYERS': wmsLayer.layerName,
                'FORMAT': 'image/png'
            },
            attributions: [new ol.Attribution({html: wmsLayer.layerCopyright})],
            url: environment.apiEndpoint + '/v1/map/wms',
            projection: this.map.getView().getProjection(),
            tileLoadFunction: function (imageTile, src) {
                // use a tileLoadFunction to add authentication headers to the request
                this.mapService.getImage(src)
                    .subscribe(
                        data => {
                            // Success - returns a Blob - create an URL from it and update the original
                            // imageTile source
                            var urlCreator = window.URL;
                            var imageUrl = urlCreator.createObjectURL(data);
                            imageTile.getImage().src = imageUrl;
                        },
                        error => {
                            // TODO: potentially handle error?
                        }
                    )
            }.bind(this)
        });
        if (!this.wmsSource) {
            this.wmsSource = newSource;
        }
        var layer = new ol.layer.Tile({
            source: newSource
        });
        layer.setVisible(false);
        layer.setProperties({
            "layerName": wmsLayer.layerName,
            "layerSource": wmsLayer.layerSource,
            "layerType": wmsLayer.layerType
        });
        this.map.addLayer(layer);
    }

    /**
     * Add a ArcGIS REST layer
     * @param arcRESTLayer
     */
    private addArcGISRESTLayer(arcRESTLayer) {
        var layer = new ol.layer.Tile({
            source: new ol.source.TileArcGISRest({
                url: arcRESTLayer.layerSource,
                attributions: [new ol.Attribution({html: arcRESTLayer.layerCopyright})],
            })
        });
        layer.setVisible(false);
        layer.setProperties({
            "layerName": arcRESTLayer.layerName,
            "layerSource": arcRESTLayer.layerSource,
            "layerType": arcRESTLayer.layerType,
            "layerTitle": arcRESTLayer.layerTitle
        });
        this.map.addLayer(layer);
    }

    /**
     * Add a GeoJSON layer to the map
     * Supports a normal GeoJSON layer and a Heatmap based on a GeoJSON layer
     * @param geoJSONLayer
     */
    private addGeoJSONLayer(geoJSONLayer){
        // TODO: get from API

        var geoJSONObject = {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45103,
                  12.29893
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:58.102504442"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44116,
                  12.27681
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:00.692404345"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99376,
                  12.10997
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:06.709263882"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.41481,
                  12.30681
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:06.211822710"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.29783,
                  12.31278
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:07.104488594"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.30991,
                  12.3224
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:07.048026172"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.27012,
                  12.2935
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:07.193914843"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45996,
                  12.2931
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:07.213913212"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.36509,
                  12.41171
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:07.293278396"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.42546,
                  12.29331
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:09.592687780"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.87751,
                  12.04992
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:10.181289411"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.42798,
                  12.28029
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:15.366541413"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44781,
                  12.27316
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:20.659363293"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45082,
                  12.29969
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:20.853888157"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.65019,
                  11.99447
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:32.324456108"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.65293,
                  11.993
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:32.322944709"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99131,
                  12.15016
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:34.610671540"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45832,
                  12.2929
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:36.068915329"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45244,
                  12.27821
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:37.172557145"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.88532,
                  12.05406
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:46.071633330"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.85988,
                  12.04027
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:46.319760828"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.65155,
                  11.99675
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:49.231060210"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44556,
                  12.28328
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:50.049487307"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99733,
                  12.10656
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:54.419607509"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.42772,
                  12.27561
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:02.442823506"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99228,
                  12.133
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:12.746914498"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.89177,
                  11.89035
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:14.819062364"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.1959,
                  12.2156
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:16.060155000"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.15977,
                  12.16422
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:15.852192563"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44799,
                  12.2888
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:22.844048127"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.00319,
                  12.11982
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:25.902408498"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.64675,
                  12.01117
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:29.260799590"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.39094,
                  12.29638
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:35.399787709"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.87146,
                  12.00986
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:39.051700264"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.42801,
                  12.30491
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:42.246438777"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99745,
                  12.12497
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:54.555712123"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99737,
                  12.13169
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:54.548328911"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99176,
                  12.12711
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:54.562176782"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45617,
                  12.25903
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:02.155450382"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44004,
                  12.27417
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:04.032192427"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.43677,
                  12.27204
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:04.057153133"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.65235,
                  12.00938
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:15.547062014"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.6532,
                  12.00262
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:15.551715979"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.98496,
                  12.13879
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:24.824493378"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45366,
                  12.28946
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:24.796914849"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.41725,
                  12.28643
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:28.678182555"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.33535,
                  12.4219
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:30.742735410"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99411,
                  12.11659
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:35.328092486"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99421,
                  12.11645
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:35.328821815"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.47125,
                  12.28575
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:40.212306167"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.86643,
                  12.05409
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:44.488309695"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.86799,
                  12.04422
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:44.494757160"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.8659,
                  12.04755
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:44.542625058"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.42577,
                  12.28639
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:54.038643735"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.1956,
                  12.1187
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:57.841593000"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.16524,
                  12.17133
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:57.618994589"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.15538,
                  12.16103
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:57.626649375"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.16946,
                  12.16363
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:57.621392629"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.15536,
                  12.16789
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:57.634224740"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4523,
                  12.2705
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:59.294589262"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.6463,
                  12.00432
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:00.400195123"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.00105,
                  12.12242
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:04.393675617"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99509,
                  12.13547
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:04.451367543"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45386,
                  12.29392
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:06.267982594"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45786,
                  12.27524
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:09.072232013"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45146,
                  12.27541
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:23.468611061"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4578,
                  12.27259
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:32.259321008"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.46368,
                  12.28829
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:32.328037648"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.65796,
                  12.01574
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:34.118813975"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.98143,
                  12.13107
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:37.841334668"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.408,
                  12.30898
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:40.836357247"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44288,
                  12.30528
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:43.021026274"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45986,
                  12.27555
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:47.551985412"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.46305,
                  12.27701
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:47.554491122"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45617,
                  12.28792
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:50.755229800"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45043,
                  12.27428
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:51.623936585"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.15322,
                  12.16165
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:54.849902096"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.43014,
                  12.2999
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:56.273324354"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4525,
                  12.29559
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:58.974529605"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.8807,
                  12.05434
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:00.383600712"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44436,
                  12.29866
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:02.164628591"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.86648,
                  11.87671
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:05.363400423"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.65934,
                  12.00834
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:05.323543221"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.89639,
                  11.89107
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:05.287311565"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45289,
                  12.29035
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:09.884708939"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4416,
                  12.29109
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:14.979869820"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.47186,
                  12.34302
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:16.640209940"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.98961,
                  12.11388
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:21.658556198"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44046,
                  12.27944
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:24.420130333"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.21754,
                  12.18936
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:25.080296379"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4143,
                  12.29929
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:35.721163945"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4476,
                  12.29909
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:38.139874322"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.18225,
                  12.03503
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:44.306931583"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.132,
                  12.15976
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:44.537222908"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.94285,
                  12.11979
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:46.043860229"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.98807,
                  12.12504
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:46.052439032"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4436,
                  12.27536
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:48.284771820"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45103,
                  12.29893
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:08:58.102504442"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44116,
                  12.27681
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:00.692404345"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99376,
                  12.10997
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:06.709263882"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.41481,
                  12.30681
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:06.211822710"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.29783,
                  12.31278
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:07.104488594"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.30991,
                  12.3224
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:07.048026172"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.27012,
                  12.2935
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:07.193914843"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45996,
                  12.2931
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:07.213913212"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.36509,
                  12.41171
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:07.293278396"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.42546,
                  12.29331
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:09.592687780"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.87751,
                  12.04992
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:10.181289411"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.42798,
                  12.28029
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:15.366541413"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44781,
                  12.27316
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:20.659363293"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45082,
                  12.29969
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:20.853888157"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.65019,
                  11.99447
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:32.324456108"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.65293,
                  11.993
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:32.322944709"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99131,
                  12.15016
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:34.610671540"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45832,
                  12.2929
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:36.068915329"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45244,
                  12.27821
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:37.172557145"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.88532,
                  12.05406
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:46.071633330"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.85988,
                  12.04027
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:46.319760828"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.65155,
                  11.99675
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:49.231060210"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44556,
                  12.28328
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:50.049487307"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99733,
                  12.10656
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:09:54.419607509"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.42772,
                  12.27561
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:02.442823506"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99228,
                  12.133
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:12.746914498"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.89177,
                  11.89035
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:14.819062364"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.1959,
                  12.2156
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:16.060155000"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.15977,
                  12.16422
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:15.852192563"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44799,
                  12.2888
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:22.844048127"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.00319,
                  12.11982
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:25.902408498"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.64675,
                  12.01117
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:29.260799590"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.39094,
                  12.29638
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:35.399787709"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.87146,
                  12.00986
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:39.051700264"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.42801,
                  12.30491
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:42.246438777"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99745,
                  12.12497
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:54.555712123"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99737,
                  12.13169
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:54.548328911"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99176,
                  12.12711
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:10:54.562176782"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45617,
                  12.25903
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:02.155450382"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44004,
                  12.27417
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:04.032192427"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.43677,
                  12.27204
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:04.057153133"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.65235,
                  12.00938
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:15.547062014"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.6532,
                  12.00262
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:15.551715979"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.98496,
                  12.13879
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:24.824493378"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45366,
                  12.28946
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:24.796914849"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.41725,
                  12.28643
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:28.678182555"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.33535,
                  12.4219
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:30.742735410"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99411,
                  12.11659
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:35.328092486"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99421,
                  12.11645
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:35.328821815"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.47125,
                  12.28575
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:40.212306167"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.86643,
                  12.05409
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:44.488309695"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.86799,
                  12.04422
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:44.494757160"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.8659,
                  12.04755
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:44.542625058"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.42577,
                  12.28639
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:54.038643735"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.1956,
                  12.1187
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:57.841593000"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.16524,
                  12.17133
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:57.618994589"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.15538,
                  12.16103
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:57.626649375"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.16946,
                  12.16363
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:57.621392629"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.15536,
                  12.16789
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:57.634224740"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4523,
                  12.2705
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:11:59.294589262"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.6463,
                  12.00432
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:00.400195123"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.00105,
                  12.12242
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:04.393675617"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99509,
                  12.13547
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:04.451367543"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45386,
                  12.29392
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:06.267982594"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45786,
                  12.27524
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:09.072232013"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45146,
                  12.27541
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:23.468611061"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4578,
                  12.27259
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:32.259321008"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.46368,
                  12.28829
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:32.328037648"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.65796,
                  12.01574
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:34.118813975"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.98143,
                  12.13107
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:37.841334668"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.408,
                  12.30898
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:40.836357247"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44288,
                  12.30528
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:43.021026274"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45986,
                  12.27555
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:47.551985412"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.46305,
                  12.27701
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:12:47.554491122"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.46297,
                  12.2937
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:02:50.003948654"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.87465,
                  12.04219
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:02:54.257491958"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44939,
                  12.28416
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:02:54.357628373"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.90579,
                  11.87939
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:02:54.782923641"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.9077,
                  11.88135
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:02:54.774729364"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.98384,
                  12.11491
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:02:57.008376272"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.98509,
                  12.11628
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:02:57.006018397"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.47281,
                  12.31
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:02:58.065541207"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.16671,
                  12.15071
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:00.126974841"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45821,
                  12.30564
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:02.274192474"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45306,
                  12.2974
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:02.168330420"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.28743,
                  12.30357
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:02.344425672"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44813,
                  12.2924
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:07.122542662"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44816,
                  12.29579
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:11.800401625"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.14055,
                  12.1304
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:15.513932091"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.14664,
                  12.13225
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:15.626832632"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45482,
                  12.29988
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:17.932742064"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44724,
                  12.29577
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:20.474961338"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44522,
                  12.29539
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:20.425175569"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.05108,
                  12.56319
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:21.884709201"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.85054,
                  12.02819
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:23.212403360"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44436,
                  12.30259
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:26.262238413"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.96827,
                  11.97684
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:27.062484050"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.00006,
                  12.10525
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:26.921094559"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.97537,
                  12.1336
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:27.106813187"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.14566,
                  12.13029
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:28.628900597"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.13105,
                  12.1238
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:28.746731776"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.14291,
                  12.12292
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:28.634677231"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.13662,
                  12.12516
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:28.760573815"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.13756,
                  12.12322
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:28.891348954"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45062,
                  12.29363
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:30.288152120"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44652,
                  12.29983
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:38.928898047"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.8688,
                  12.03447
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:43.346062178"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45652,
                  12.2944
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:44.375059248"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45105,
                  12.29597
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:44.548401321"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45481,
                  12.29492
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:48.713300010"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.30148,
                  12.36388
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:52.009630764"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.1446,
                  12.15086
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:52.012006521"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45147,
                  12.29481
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:57.053952964"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45162,
                  12.28709
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:57.043324435"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4511,
                  12.31154
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:57.110909565"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45297,
                  12.29427
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:03:57.066263612"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.46551,
                  12.29218
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:03.385982523"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.98905,
                  12.11665
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:09.041944092"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.98519,
                  12.11742
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:09.046806754"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.50979,
                  12.23529
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:13.189365646"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4431,
                  12.29848
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:15.426381486"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.734,
                  12.08321
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:17.536279135"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.72901,
                  12.07363
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:17.509862790"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.73148,
                  12.07761
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:17.494681367"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.43934,
                  12.30533
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:17.908183645"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.43971,
                  12.29744
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:23.054936318"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44705,
                  12.29379
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:22.965184952"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.1544,
                  12.14804
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:25.292170952"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.86637,
                  12.03471
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:28.898717046"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.88385,
                  12.03959
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:28.889381478"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.87049,
                  12.038
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:28.894366417"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.88006,
                  12.03882
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:28.886652589"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.86777,
                  12.03641
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:28.898217173"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.87868,
                  12.03832
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:28.901130258"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.46582,
                  12.30233
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:29.587213228"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.31752,
                  12.32383
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:32.014554143"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44554,
                  12.29525
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:33.132501146"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44199,
                  12.28364
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:39.496780662"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45038,
                  12.29842
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:39.574276808"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44076,
                  12.29756
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:43.683939840"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.97157,
                  12.10877
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:47.119591743"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.00126,
                  12.11871
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:47.072564764"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.97487,
                  12.11303
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:47.217218288"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.43638,
                  12.30354
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:48.245265582"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.46429,
                  12.28853
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:49.124157473"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4464,
                  12.29436
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:49.293391830"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.46709,
                  12.29906
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:57.123413006"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.89708,
                  11.87835
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:04:59.539971646"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.86536,
                  12.0404
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:00.005158099"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.1416,
                  12.1356
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:02.181084000"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.17574,
                  12.15593
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:02.220160408"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44292,
                  12.29982
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:03.179032844"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45822,
                  12.28827
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:06.506130819"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45572,
                  12.29496
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:06.671540552"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45013,
                  12.29276
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:06.591413651"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.43916,
                  12.30646
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:10.932754861"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45215,
                  12.28846
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:16.962357210"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.999,
                  12.12319
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:19.558234488"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45669,
                  12.30219
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:24.521933350"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.83797,
                  12.02087
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:26.465283304"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.49064,
                  12.30724
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:31.430813122"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4555,
                  12.29389
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:32.956959414"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.1519,
                  12.148
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:35.226031000"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.15283,
                  12.16107
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:35.220199927"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.46432,
                  12.29645
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:40.512017037"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45247,
                  12.29313
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:40.535969911"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.43403,
                  12.29259
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:43.401263160"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44529,
                  12.31056
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:44.596562426"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.41718,
                  12.34674
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:48.333359618"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.86387,
                  12.02472
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:50.353762600"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.85437,
                  12.01977
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:50.212626007"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45173,
                  12.29726
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:50.815176399"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.43247,
                  12.30593
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:53.051612461"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.43293,
                  12.29563
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:54.746671350"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.46242,
                  12.28959
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:05:56.144186007"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45935,
                  12.29573
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:00.179825986"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99279,
                  12.10313
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:01.055729731"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.98919,
                  12.10114
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:01.054134057"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44286,
                  12.29853
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:02.534983646"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.46432,
                  12.29658
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:04.108282516"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4636,
                  12.29653
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:08.187282634"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.15407,
                  12.15376
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:08.864383257"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.30469,
                  12.3159
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:13.831349940"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.84693,
                  12.03703
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:14.387056068"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45825,
                  12.28437
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:15.365234866"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.67342,
                  12.01576
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:17.590014776"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.43199,
                  12.30141
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:18.402519293"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45606,
                  12.28713
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:21.462988410"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.46903,
                  12.28641
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:30.407305893"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.90493,
                  11.89255
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:32.631788708"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.91554,
                  11.88814
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:32.637102055"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.90528,
                  11.88798
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:32.629568748"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.87885,
                  11.89301
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:32.711944201"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.15688,
                  12.16649
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:33.725588490"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45084,
                  12.28752
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:35.194259069"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.0214,
                  12.0835
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:36.847058000"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.02436,
                  12.12583
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:36.940185655"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.42111,
                  12.29524
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:41.072080947"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45798,
                  12.29636
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:43.459093367"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.46373,
                  12.29122
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:47.267400081"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.43739,
                  12.28266
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:48.865004777"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.41173,
                  12.34256
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:50.758749513"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.40351,
                  12.34574
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:50.761683545"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.41187,
                  12.33939
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:50.757091166"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4148,
                  12.3433
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:50.757813092"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44116,
                  12.28709
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:52.705666217"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.48516,
                  12.28154
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:06:59.644686949"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.00168,
                  12.10793
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:02.171959672"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.00045,
                  12.1074
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:02.170728023"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99594,
                  12.10449
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:02.179550719"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45395,
                  12.28643
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:02.416157960"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.18238,
                  12.16999
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:05.082180451"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  104.154,
                  12.1622
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:04.992682381"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.42196,
                  12.2866
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:06.559373381"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.42029,
                  12.28543
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:08.776206796"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.8477,
                  12.02756
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:11.814694041"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.66116,
                  12.01117
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:10.960426928"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.45079,
                  12.29453
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:14.728785977"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.42211,
                  12.29723
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:16.880337799"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.7422,
                  12.07976
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:18.000685284"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44809,
                  12.28105
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:21.989749661"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44695,
                  12.29528
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:23.252029681"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.55713,
                  12.32167
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:25.039148390"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.42763,
                  12.30069
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:30.225552049"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44535,
                  12.28683
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:31.356272744"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.44801,
                  12.30539
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:33.454353690"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4623,
                  12.28621
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:39.175811245"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.46258,
                  12.29689
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:39.170977468"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.28108,
                  12.32537
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:40.030726988"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.2908,
                  12.35548
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:40.022115774"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.25598,
                  12.33658
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:40.019479627"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.2774,
                  12.3037
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:39.876276974"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.4371,
                  12.29039
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:42.561681907"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  103.99006,
                  12.1042
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:43.436551433"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  102.02208,
                  13.72565
                ]
              },
              "properties": {
                "lightningTime": "2017-08-08T08:07:44.174748634"
              }
            }
          ]
        };

        // Treat the layer as a heatmap when it includes the word heatmap
        var isHeatmap = geoJSONLayer.layerName.includes("heatmap");
        var layer = null;
        if (isHeatmap) {
            layer = new ol.layer.Heatmap({
                source: new ol.source.Vector({
                    features: (new ol.format.GeoJSON()).readFeatures(geoJSONObject, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: 'EPSG:3857'
                    })
                }),
                blur: 30,
                weight: 'weight' // no feature attributes are used for the heatmap, just the points themselves
            });
        }
        else {
            layer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: (new ol.format.GeoJSON()).readFeatures(geoJSONObject, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: 'EPSG:3857'
                    })
                }),
                style: this.styleService.getStyle(geoJSONLayer.layerName)
            });
        }
        layer.setVisible(false);
        layer.setProperties({
            "layerName": geoJSONLayer.layerName,
            "layerSource": geoJSONLayer.layerSource,
            "layerType": geoJSONLayer.layerType,
            "layerTitle": geoJSONLayer.layerTitle
        });
        this.map.addLayer(layer);
    }
}
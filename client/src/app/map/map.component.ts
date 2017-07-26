import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GroupByPipe } from 'angular-pipes/src/aggregate/group-by.pipe';
import {DomSanitizer} from '@angular/platform-browser';
import * as ol from 'openlayers';

import { LayerService } from './layer.service';
import { MapService } from './map.service';
import { IdentifyService } from './identify.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  providers: [LayerService, MapService, IdentifyService]
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
                //layers[i].layerLegend = 'http://52.49.245.101:8085/geoserver/wms' + '?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=' + layers[i].layerName + '&legend_options=fontName:Times%20New%20Roman;fontAntiAliasing:true;fontColor:0x000033;fontSize:14;bgColor:0xFFFFEE;dpi:180';
                //layers[i].layerLegend = environment.apiEndpoint + '/v1/map/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=' + layers[i].layerName + '&legend_options=fontName:Times%20New%20Roman;fontAntiAliasing:true;fontColor:0x000033;fontSize:14;bgColor:0xFFFFEE;dpi:180';
                this.setLayerLegend(layers[i]);
                this.addWMSLayer(layers[i]);
            }
            if (layers[i].layerType === 'arcgisrest'){
                this.addArcGISRESTLayer(layers[i]);
            }
        }
    }

    /**
     * Set layer legend
     * @param layer
     */
    setLayerLegend(layer){
         layer.layerLegend = '';
         var url = environment.apiEndpoint + '/v1/map/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&height=10&LAYER=' + layer.layerName + '&legend_options=fontName:Times%20New%20Roman;fontAntiAliasing:true;fontColor:0x000033;dpi:180&transparent=true';
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
            "layerType": arcRESTLayer.layerType
        });
        this.map.addLayer(layer);
    }
}
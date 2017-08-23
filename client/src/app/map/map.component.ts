import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GroupByPipe } from 'angular-pipes/src/aggregate/group-by.pipe';
import {DomSanitizer} from '@angular/platform-browser';
import * as ol from 'openlayers';
import * as proj4x from 'proj4';

// Define proj4 as workaround. See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/15663
let proj4 = (proj4x as any).default;

import { LayerService } from './layer.service';
import { MapService } from './map.service';
import { IdentifyService } from './identify.service';
import { StyleService } from './style.service';
import { MeasureService } from './measure.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  providers: [LayerService, MapService, IdentifyService, StyleService, MeasureService]
})
export class MapComponent implements OnInit {

    showContent: boolean;
    showCategoryPicker: boolean;
    category: string;
    layers: any;
    map: any;
    wmsSource: any; // WMS source for use in identify
    contentTab: string = 'legend';

    activeMeasureType: string = '';

    constructor(
        private router: Router,
        private layerService: LayerService,
        private mapService: MapService,
        private identifyService: IdentifyService,
        private styleService: StyleService,
        private measureService: MeasureService,
        private sanitizer:DomSanitizer
    ){}

    ngOnInit() {

        // Define Indian 1960 / UTM zone 48N (used in Cambodia) Proj4js projection (copied from https://epsg.io/3148)
        ol.proj.setProj4(proj4);
        proj4.defs("EPSG:3148","+proj=utm +zone=48 +a=6377276.345 +b=6356075.41314024 +towgs84=198,881,317,0,0,0,0 +units=m +no_defs");

        this.showContent = true;
        this.showCategoryPicker = false;
        this.category = 'preparedness';
        this.layers = [];

        this.initMap();
        this.measureService.initMeasureTool();
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
                if (this.layers.assessmentLayers){
                    this.addLayers(this.layers.assessmentLayers);
                }
                this.identifyService.addIdentifyEventHandlers(this.map, this.wmsSource);
                this.identifyService.setActive(true);
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
     * Set the content of the tab
     * @param tab
     */
    setContent(tab): void {
        // Toggle content instead of switching when it is already on that tab
        if (this.contentTab === tab){
            this.toggleContent();
        }
        else {
            this.contentTab = tab;
            // Reset measure
            this.measureService.setActive(false);
            this.activeMeasureType = '';
        }
        if (this.contentTab === 'legend'){
            this.identifyService.setActive(true);
        }
        else {
            this.identifyService.setActive(false);
        }
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
     * Activate measure (line or area)
     * @param type
     */
    activateMeasure(type){
        this.activeMeasureType = type;
        this.measureService.setType(type);
        this.measureService.setActive(true);
    }

    /**
     * Reset the measure tool
     */
    resetMeasure(){
        this.measureService.setActive(false);
        this.activeMeasureType = '';
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
                this.setGeoJSONLegend(layers[i]);
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

    private setGeoJSONLegend(layer){
        // TEST
        //layer.layerLegend = '<div>Hello!</div>';
        //layer.layerLegend = "<div><svg height='15' width='15'><rect width='15' height='15' stroke='rgba(84, 84, 84, 0.7)' stroke-width='1' fill='rgba(223, 223, 223, 0.1)'/></svg>Test</div>";
        layer.layerLegend = '<canvas id="myCanvas" width="200" height="100"></canvas>';
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
        this.layerService.getGeoJSON(geoJSONLayer.layerName)
            .subscribe(
            data => {
                // Success
                this.createGeoJSONLayer(geoJSONLayer, data);
            },
            error => {
                // TODO
            }
        );
    }

    /**
     * Create a OL GeoJSON layer from GeoJSON and layer data and add to the map
     * @param layerData
     * @param geoJSON
     */
    private createGeoJSONLayer(layerData, geoJSON){
        // Treat the layer as a heatmap when it includes the word heatmap
        var isHeatmap = layerData.layerName.includes("heatmap");
        var layer = null;
        if (isHeatmap) {
            layer = new ol.layer.Heatmap({
                source: new ol.source.Vector({
                    features: (new ol.format.GeoJSON()).readFeatures(geoJSON, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: 'EPSG:3857'
                    }),
                    attributions: [new ol.Attribution({html: layerData.layerCopyright})],
                }),
                blur: 30,
                weight: 'weight' // no feature attributes are used for the heatmap, just the points themselves
            });
        }
        else {
            var epsg = 'EPSG:4326';
            if (geoJSON.crs){
                if (geoJSON.crs.properties.name){
                    epsg = geoJSON.crs.properties.name;
                }
            }
            layer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: (new ol.format.GeoJSON()).readFeatures(geoJSON, {
                        dataProjection: epsg,
                        featureProjection: 'EPSG:3857'
                    }),
                    attributions: [new ol.Attribution({html: layerData.layerCopyright})],
                })
            });
        }
        if (layerData.layerName === 'earthnetworks_lightning_points'){
            layer.setStyle(this.styleService.getLightningStyle)
        }
        else if (layerData.layerName === 'ktm_pcdm_at_risk_village'){
            layer.setStyle(this.styleService.getAtRiskVillageStyle);
        }
        else if (layerData.layerName === 'ktm_pcdm_at_risk_commune'){
            layer.setStyle(this.styleService.getAtRiskCommuneStyle)
        }
        else {
            layer.setStyle(this.styleService.getStyle);
        }
        layer.setVisible(false);
        layer.setProperties({
            "layerName": layerData.layerName,
            "layerSource": layerData.layerSource,
            "layerType": layerData.layerType,
            "layerTitle": layerData.layerTitle
        });
        this.map.addLayer(layer);
    }
}
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GroupByPipe } from 'angular-pipes/src/aggregate/group-by.pipe';
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
    preparednessLayers: any;
    map: any;
    wmsSource: any; // WMS source for use in identify

    constructor(
        private router: Router,
        private layerService: LayerService,
        private mapService: MapService,
        private identifyService: IdentifyService
    ){}

    ngOnInit() {

        this.showContent = true;
        this.showCategoryPicker = false;
        this.category = 'preparedness';
        this.preparednessLayers = [];

        this.initMap();
        
        this.layerService.getLayers()
            .subscribe(
            data => {
                // Success
                this.preparednessLayers = data.preparednessLayers;
                this.addLayers();
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
     * TODO: extend to incidents and assessment layers
     * TODO: replace URL with API url
     */
    private addLayers () {
        for (var i = 0; i < this.preparednessLayers.length; i++){
            var newSource = new ol.source.TileWMS({
                params: {
                    'LAYERS': this.preparednessLayers[i].layerName,
                    'FORMAT': 'image/png'
                },
                url: environment.apiEndpoint + '/v1/map/wms',
                projection: this.map.getView().getProjection(),
                tileLoadFunction: function(imageTile, src) {
                    // use a tileLoadFunction to add authentication headers to the request
                    this.mapService.getTile(src)
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
            if (!this.wmsSource){
                this.wmsSource = newSource;
            }
             var layer = new ol.layer.Tile({
                    source: newSource
                });
            layer.setVisible(false);
            layer.setProperties({
                "layerName": this.preparednessLayers[i].layerName
            });
            this.map.addLayer(layer);
        }
    }
}
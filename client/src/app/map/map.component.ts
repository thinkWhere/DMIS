import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GroupByPipe } from 'angular-pipes/src/aggregate/group-by.pipe';

import * as ol from 'openlayers';
import { LayerService } from './layer.service';
import { MapService } from './map.service';
import { IdentifyService } from './identify.service';

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
                url: 'http://52.49.245.101:8085/geoserver/dmis/wms',
                projection: this.map.getView().getProjection()
            });
             var layer = new ol.layer.Tile({
                    source: newSource
                });
            layer.setVisible(false);
            layer.setProperties({
                "layerName": this.preparednessLayers[i].layerName
            });
            this.map.addLayer(layer);
            this.identifyService.addIdentifyEventHandlers(this.map, newSource);
        }
    }
}
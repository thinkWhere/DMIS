import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import * as ol from 'openlayers';
import { LayerService } from './layer.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  providers: [LayerService]  
})
export class MapComponent implements OnInit {

    showContent = true;
    showCategoryPicker = false;
    category = 'preparedness';
    layers: any;
    map: any;

    constructor(
        private router: Router,
        private layerService: LayerService
    ){}
    
    ngOnInit() {
        
       this.initMap();
        
       this.layerService.getLayers()
        .subscribe(
            data => {
              // Success
              // TODO: load layers
            },
            error => {
              // TODO: better error handling. At the moment it always redirects to the login page (also when it is not 
              // a 401
              this.router.navigate(['/login'], { queryParams: { returnUrl: 'map/preparedness' }});
            }
        );
        // Mock - this will be replaced with data coming from the getLayers API
        this.layers = {
            preparednessLayers: [
                {
                    layer_name: "cambodia_geographic_boundaries",
                    layer_title: "Administrative Areas",
                    layer_description: "Country, district, province, communes",
                    layer_source: "https://blah.com/wms",
                    layer_group: "Administrative"
                },
                {
                    layer_name: "cambodia_evacuation_sites",
                    layer_title: "Evacuation Sites",
                    layer_description: "Sites for Evacuation",
                    layer_source: "https://blah.com/wms",
                    layer_group: "Humanitarian"
                }
            ],
            "incidentLayers": [],
            "assessmentLayers": []
        };
        this.addLayers();
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
    private initMap () {
        this.map = new ol.Map({
           layers: [
               new ol.layer.Tile({
                   source: new ol.source.OSM({
                       url: "http://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
                       attributions: "<a href='http://www.openstreetmap.org/copyright/' target='_blank'>© OpenStreetMap</a> contributors"
                   })
               })
            ],
            target: 'map',
            view: new ol.View({
                center: ol.proj.transform([104.99, 12.56], 'EPSG:4326', 'EPSG:3857'),
                zoom: 7
            })
        });

        this.checkCategory();

        this.router.events.subscribe((event) => {
            this.checkCategory();
        });
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
        for (var i = 0; i < this.layers.preparednessLayers.length; i++){
            var newSource = new ol.source.TileWMS({
            params: {
                'LAYERS': this.layers.preparednessLayers[i].layer_name,
                'FORMAT': 'image/png',
                'PROJECTION': ''
            },
            url: 'http://52.49.245.101:8085/geoserver/dmis/wms',
            projection: this.map.getView().getProjection()
            });
             var layer = new ol.layer.Tile({
                    source: newSource
                });
            layer.setVisible(false);
            layer.setProperties({
                "layerName": this.layers.preparednessLayers[i].layer_name
            });
            this.map.addLayer(layer);
        }
    }
}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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

        this.initMap();
        
        this.layerService.getLayers()
            .subscribe(
            data => {
                // Success
                // TODO: load layers
                // this.preparednessLayers = data.preparednessLayers;
            },
            error => {
              // TODO: better error handling. At the moment it always redirects to the login page (also when it is not 
              // a 401
              this.router.navigate(['/login'], { queryParams: { returnUrl: 'map/preparedness' }});
            }
        );
        // Mock - this will be replaced with data coming from the getLayers API
        this.preparednessLayers = [
                {
                    layerName: "cambodia_geographic_boundaries",
                    layerTitle: "Administrative Areas",
                    layerDescription: "Country, district, province, communes",
                    layerSource: "https://blah.com/wms",
                    layerGroup: "Administrative"
                },
                {
                    layerName: "cambodia_evacuation_sites",
                    layerTitle: "Evacuation Sites",
                    layerDescription: "Sites for Evacuation",
                    layerSource: "https://blah.com/wms",
                    layerGroup: "Humanitarian"
                },
                {
                    layerName: "cambodia_healh_centre",
                    layerTitle: "Health Centre",
                    layerDescription: "",
                    layerSource: "",
                    layerGroup: ""
                },
                {
                    layerName: "cambodia_health_post",
                    layerTitle: "Health Post",
                    layerDescription: "",
                    layerSource: "",
                    layerGroup: ""
                },
                {
                    layerName: "cambodia_hltfacp_od_gov",
                    layerTitle: "Health Od Gov",
                    layerDescription: "",
                    layerSource: "",
                    layerGroup: ""
                },
                {
                    layerName: "cambodia_hltfacp_referral_gov",
                    layerTitle: "Health Referral Gov",
                    layerDescription: "",
                    layerSource: "",
                    layerGroup: ""
                }
            ];
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

    /*print(): void {
        var format = 'a4';
        var resolution = 72;
        var dim = [297, 210];
        var size = (this.map.getSize());
        var extent = this.map.getView().calculateExtent(size);

        this.map.once('postcompose', function(event) {

        var interval;
        interval = setInterval(function() {
            clearInterval(interval);
            var canvas = event.context.canvas;
            var data = canvas.toDataURL('image/jpeg');
            var pdf = new jsPDF('landscape', undefined, format);
            pdf.addImage(data, 'JPEG', 0, 0, dim[0]/2, dim[1]/2);
            pdf.text('Hello world!', dim[0]/2 + 10, 10);
            pdf.save('map.pdf');
            this.map.getView().fitExtent(extent, size);
            this.map.renderSync();
        }, 100);
        });
        this.map.renderSync();
    }*/

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
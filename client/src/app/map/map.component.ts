import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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
        )
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
    
    private initMap () {
        var map = new ol.Map({
           layers: [
               new ol.layer.Tile({
                   source: new ol.source.OSM()
               })
            ],
            target: 'map',
            view: new ol.View({
                center: ol.proj.transform([104.99, 12.56], 'EPSG:4326', 'EPSG:3857'),
                zoom: 7
            })
        });

        // Switch to the category
        if (this.router.url === '/map/preparedness'){
            this.category = 'preparedness';
        }
        if (this.router.url === '/map/incidents'){
            this.category = 'incidents';
        }
        if (this.router.url === '/map/assessment'){
            this.category = 'assessment';
        }
    }
}

import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import * as ol from 'openlayers';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

    showContent = true;
    showCategoryPicker = false;
    category = 'preparedness';

    constructor(
        private router: Router
    ){}

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
     * S
     * @param category
     */
    setCategory(category): void {
        this.category = category;
        this.showCategoryPicker = false;
        this.router.navigate(['/map/' + this.category]);
    }
    
    ngOnInit() {
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

import {Component, OnInit} from '@angular/core';
import * as ol from 'openlayers';
import * as jsPDF from 'jspdf';

import { MapService } from './map.service';

@Component({
    selector: 'app-sitrep',
    templateUrl: './sitrep.component.html',
    styleUrls: ['./sitrep.component.scss'],
    providers: [MapService]
})
export class SitrepComponent implements OnInit {

    map: any;
    title: string = '';
    
    constructor(  
        private mapService: MapService) 
    {}

    ngOnInit() {
        console.log('map');
        this.mapService.initMap();
        this.map = this.mapService.getMap();
        this.map.setTarget('map');
    }

    /**
     * Print a SitRep with jsPDF. jsPDF uses millimeters for units
     */
    print(title):void {
        var format = 'a4';
        var dim = [297, 210];
        var size = (this.map.getSize());
        var extent = this.map.getView().calculateExtent(size);

        this.map.once('postcompose', function (event) {
            var interval;
            interval = setInterval(function () {
                clearInterval(interval);
                var canvas = event.context.canvas;
                var data = canvas.toDataURL('image/jpeg');
                var pdf = new jsPDF('landscape', undefined, format);
                pdf.text(title, 10, 15);
                pdf.addImage(data, 'JPEG', 10, 20, dim[0] / 2, dim[1] / 2);
                pdf.save('map.pdf');
                //this.map.getView().fitExtent(extent, size);
                //this.map.renderSync();
            }, 100);
        });
        this.map.renderSync();
    }
}

import {Component, OnInit} from '@angular/core';
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
    situation: string = '';
    comments: string = '';
    
    constructor(  
        private mapService: MapService) 
    {}

    ngOnInit() {
        this.mapService.initMap();
        this.map = this.mapService.getMap();
        this.map.setTarget('map');
    }

    /**
     * Print a SitRep with jsPDF. jsPDF uses millimeters for units
     */
    print(title, situation, comments):void {
        var format = 'a4';
        var dim = [297, 210];
        var size = (this.map.getSize());

        this.map.once('postcompose', function (event) {
            var interval;
            interval = setInterval(function () {
                clearInterval(interval);
                var canvas = event.context.canvas;
                var data = canvas.toDataURL('image/jpeg');
                var pdf = new jsPDF('landscape', undefined, format);
                pdf.text(title, 10, 15);
                pdf.text(situation, 165, 25);
                pdf.text(comments, 10, 135);
                pdf.addImage(data, 'JPEG', 10, 20, dim[0] / 2, dim[1] / 2);
                pdf.save('map.pdf');
            }, 100);
        });
        this.map.renderSync();
    }
}

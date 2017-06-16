import { Component, OnInit } from '@angular/core';
import * as ol from 'openlayers';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  constructor() { }

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
  }
}

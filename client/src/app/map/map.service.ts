import {Injectable} from '@angular/core';
import * as ol from 'openlayers';

@Injectable()
export class MapService {

    map:any;
    self = this;

    constructor() {
    }

    /**
     * Initialise an OpenLayers map
     */
    initMap() {
        this.map = new ol.Map({
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM({
                        url: "http://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
                        attributions: "<a href='http://www.openstreetmap.org/copyright/' target='_blank'>© OpenStreetMap</a> contributors"
                    })
                })
            ],
            view: new ol.View({
                center: ol.proj.transform([104.99, 12.56], 'EPSG:4326', 'EPSG:3857'),
                zoom: 7
            })
        });
    }

    /**
     * Return the map
     * @returns map {any}
     */
    getMap() {
        return this.map;
    }
}
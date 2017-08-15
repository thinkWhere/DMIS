import {Injectable} from '@angular/core';
import * as ol from 'openlayers';

@Injectable()
export class StyleService {

    constructor() {
    }

    /**
     * Style function: returns a style based on the layer name
     * TODO: move to style service when this gets bigger?
     * @param layerName
     * @returns {ol.style.Style}
     */
     getStyle(layerName) {

        // Default style
         var style = new ol.style.Style({
             image: new ol.style.Circle({
                 radius: 6,
                 stroke: new ol.style.Stroke({
                     color: 'red',
                     width: 2
                 }),
                 fill: new ol.style.Fill({
                     color: 'white'
                 })
             })
        });
        if (layerName === 'earthnetworks_lightning_points'){
            style = new ol.style.Style({
                text: new ol.style.Text({
                    text: '\uf0e7',
                    font: 'normal 20px FontAwesome',
                    textBaseline: 'Bottom',
                    fill: new ol.style.Fill({
                        color: 'yellow',
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'black',
                        width: 2
                    })
                })
            });
        }
        return style;
    };
}

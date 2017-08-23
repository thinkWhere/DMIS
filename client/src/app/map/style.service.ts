import {Injectable} from '@angular/core';
import * as ol from 'openlayers';

@Injectable()
export class StyleService {

    constructor() {
    }

    /**
     * Style function: returns a style based on the layer name
     * @param layerName
     * @returns {ol.style.Style}
     */
    getStyle(feature) {
        // Default style
        var style = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 4,
                stroke: new ol.style.Stroke({
                    color: 'red',
                    width: 2
                }),
                fill: new ol.style.Fill({
                    color: 'white'
                })
            }),
            stroke: new ol.style.Stroke({
                color: 'red',
                width: 1
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.4)'
            })
        });
        if (feature === 'earthnetworks_lightning_points') {
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

    /**
     * Return a default style (red)
     * @returns {ol.style.Style}
     */
    getDefaultStyle() {
        var style = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 4,
                stroke: new ol.style.Stroke({
                    color: 'red',
                    width: 2
                }),
                fill: new ol.style.Fill({
                    color: 'white'
                })
            }),
            stroke: new ol.style.Stroke({
                color: 'red',
                width: 1
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.4)'
            })
        });
        return style;
    }

    /**
     * Return the style for lightning
     * @returns {ol.style.Style}
     */
    getLightningStyle() {
        var style = new ol.style.Style({
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
        return style;
    }

    /**Return the style for At Risk Communes
     * @param feature
     * @returns {{}}
     */
    getAtRiskCommuneStyle(feature){
        var style = {};
        var proportionDisplacedPeople = feature.get('SS_P_AL');
        if (proportionDisplacedPeople === 1){
            style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(255, 0, 0, 0.4)' // red
                })
            });
        }
        else {
            style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 0, 0.4)' // yellow
                })
            });
        }
        return style;
    }

    /**
     * Return the style for At Risk Villages
     * @param feature
     * @returns {ol.style.Style}
     */
    getAtRiskVillageStyle(feature){
        var isVillageAtRiskOfFlood = feature.get('Flood');
        if (isVillageAtRiskOfFlood === 'yes'){
            var style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 4,
                    stroke: new ol.style.Stroke({
                        color: 'red',
                        width: 2
                    }),
                    fill: new ol.style.Fill({
                        color: 'red'
                    })
                }),
                stroke: new ol.style.Stroke({
                    color: 'red',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.4)'
                })
            });
            return style;
        }
    }
}

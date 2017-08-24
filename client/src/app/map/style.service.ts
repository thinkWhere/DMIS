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

    /**
     * Return the style for Daily People Affected (NCDM)
     * @param feature
     * @returns {ol.style.Style}
     */
    getDailyPeopleAffectedStyle(feature) {
        //254,240,217
        //253,204,138
        //252,141,89
        //227,74,51
        //179,0,0
        var styleProperty = feature.get('AFFPEO');
        if (styleProperty < 500) {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(254,240,217, 0.4)'
                })
            });
            return style;
        }
        if (styleProperty < 1000) {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(253,204,138, 0.4)'
                })
            });
            return style;
        }
        if (styleProperty < 1500) {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(252,141,89, 0.4)'
                })
            });
            return style;
        }
        if (styleProperty < 2000) {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(227,74,51, 0.4)'
                })
            });
            return style;
        }
        else {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(179,0,0, 0.4)'
                })
            });
            return style;
        }
    }

    /**
     * Return the style for Daily Displaced (NCDM)
     * @param feature
     * @returns {ol.style.Style}
     */
    getDailyDisplacedStyle(feature){
        var styleProperty = feature.get('EVAPEO');
        if (styleProperty < 100) {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(254,240,217, 0.4)'
                })
            });
            return style;
        }
        if (styleProperty < 200) {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(253,204,138, 0.4)'
                })
            });
            return style;
        }
        if (styleProperty < 300) {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(252,141,89, 0.4)'
                })
            });
            return style;
        }
        if (styleProperty < 400) {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(227,74,51, 0.4)'
                })
            });
            return style;
        }
        else {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(179,0,0, 0.4)'
                })
            });
            return style;
        }
    }

    /**
     * Return the style for Daily Deaths (NCDM)
     * @param feature
     * @returns {ol.style.Style}
     */
    getDailyDeathsStyle(feature){
        var styleProperty = feature.get('DEATH_AL');
        // Deaths reported
        if (styleProperty == 2) {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(227,74,51, 0.4)'
                })
            });
            return style;
        }
        // No deaths reported
        else {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(128,128,128, 0.4)'
                })
            });
            return style;
        }
    }

    /**
     * Return the style for Daily Pump Wells (NCDM)
     * @param feature
     * @returns {ol.style.Style}
     */
    getDailyPumpWells(feature){
        // TODO
    }

    /**
     * Return the style for Daily Health Center (NCDM)
     * @param feature
     * @returns {ol.style.Style}
     */
    getDailyHealthCenter(feature){
        // TODO
    }

    /**
     * Return the style for Daily School (NCDM)
     * @param feature
     * @returns {ol.style.Style}
     */
    getDailySchool(feature){
        // TODO
    }

    /**
     * Return the style for Daily Road (NCDM)
     * @param feature
     * @returns {ol.style.Style}
     */
    getDailyRoad(feature){
        // TODO
    }

    /**
     * Return the style for Daily Bridge (NCDM)
     * @param feature
     * @returns {ol.style.Style}
     */
    getDailyBridge(feature){
        // TODO
    }

    /**
     * Return the style for Daily Rice (NCDM)
     * @param feature
     * @returns {ol.style.Style}
     */
    getDailyRice(feature){
        // TODO
    }
}

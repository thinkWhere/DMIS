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
    getAtRiskCommuneStyle(feature) {
        var style = {};
        var proportionDisplacedPeople = feature.get('SS_P_AL');
        if (proportionDisplacedPeople === 1) {
            style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(227,74,51, 0.4)' // red
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
                    color: 'rgba(254,204,92, 0.4)' // yellow
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
    getAtRiskVillageStyle(feature) {
        var isVillageAtRiskOfFlood = feature.get('Flood');
        if (isVillageAtRiskOfFlood === 'yes') {
            var style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 4,
                    stroke: new ol.style.Stroke({
                        color: 'red',
                        width: 2
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(227,74,51, 0.4)'
                    })
                }),
                stroke: new ol.style.Stroke({
                    color: 'red',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(254,204,92, 0.4)'
                })
            });
            return style;
        }
    }

    /**
     * Get GeoJSON style
     * @param feature
     * @returns {any}
     */
    getGeoJSONStyle(feature) {
        var layerStyle = feature.getProperties().layerStyle;
        for (var i = 0; i < layerStyle.rules.length; i++) {
            // If a filter is defined
            if (layerStyle.rules[i].filter) {
                var filter = layerStyle.rules[i].filter;
                var ruleStyle = layerStyle.rules[i].style;
                var propertyName = filter.propertyName;
                var comparisonType = filter.comparisonType;
                if (filter) {
                    if (comparisonType === 'BETWEEN') {
                        if (feature.get(propertyName) >= filter.min && feature.get(propertyName) < filter.max) {
                            var style: any = this.getOLStyle(ruleStyle);
                            return style;
                        }
                    }
                    if (comparisonType === 'GREATER_THAN') {
                        if (feature.get(propertyName) > filter.min) {
                            var style: any = this.getOLStyle(ruleStyle);
                            return style;
                        }
                    }
                    if (comparisonType === 'EQUALS') {
                        if (feature.get(propertyName) == filter.value) {
                            var style: any = this.getOLStyle(ruleStyle);
                            return style;
                        }
                    }
                }
                else {
                    // No filter
                    var style: any = this.getOLStyle(ruleStyle);
                    return style;

                }
            }
        }
    }

    getOLStyle(filterStyle) {
        if (filterStyle.text) {
            var style: any = new ol.style.Style({
                text: new ol.style.Text({
                    text: filterStyle.text.text,
                    font: filterStyle.text.font,
                    textBaseline: 'Bottom',
                    fill: new ol.style.Fill({
                        color: filterStyle.text.fill.colour,
                    }),
                    stroke: new ol.style.Stroke({
                        color: filterStyle.text.stroke.colour,
                        width: filterStyle.text.stroke.width
                    })
                })
            });
            return style;
        }
        var style: any = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: filterStyle.stroke.colour,
                width: filterStyle.stroke.width
            }),
            fill: new ol.style.Fill({
                color: filterStyle.fill.colour
            })
        });
        return style;
    }
}

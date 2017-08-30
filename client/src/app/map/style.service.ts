import {Injectable} from '@angular/core';
import * as ol from 'openlayers';

@Injectable()
export class StyleService {

    constructor() {
    }

    /**
     * Get style
     * @param feature
     * @returns {any}
     */
    getStyle(feature) {
        var style: any;
        var layerStyle = feature.getProperties().layerStyle;
        if (!layerStyle){
            style = getDefaultStyle();
            return style;
        }
        for (var i = 0; i < layerStyle.rules.length; i++) {
            // If a filter is defined
            var filter = layerStyle.rules[i].filter;
            var ruleStyle = layerStyle.rules[i].style;
            if (filter) {
                var propertyName = filter.propertyName;
                var comparisonType = filter.comparisonType;
                if (comparisonType === 'BETWEEN') {
                    if (feature.get(propertyName) >= filter.min && feature.get(propertyName) < filter.max) {
                        style = getOLStyle(ruleStyle);
                        return style;
                    }
                }
                if (comparisonType === 'GREATER_THAN') {
                    if (feature.get(propertyName) > filter.min) {
                        style = getOLStyle(ruleStyle);
                        return style;
                    }
                }
                if (comparisonType === 'EQUALS') {
                    if (feature.get(propertyName) == filter.value) {
                        style = getOLStyle(ruleStyle);
                        return style;
                    }
                }
            }
            else {
                // No filter
                style = getOLStyle(ruleStyle);
                return style;
            }
        }
        /**
         * Get the OL style based on the rule style
         * This is a nested function to allow access to it from the style function
         * @param ruleStyle
         * @returns {any}
         */
        function getOLStyle(ruleStyle) {
            if (ruleStyle.text) {
                var style: any = new ol.style.Style({
                    text: new ol.style.Text({
                        text: ruleStyle.text.text,
                        font: ruleStyle.text.font,
                        textBaseline: 'Bottom',
                        fill: new ol.style.Fill({
                            color: ruleStyle.text.fill.colour,
                        }),
                        stroke: new ol.style.Stroke({
                            color: ruleStyle.text.stroke.colour,
                            width: ruleStyle.text.stroke.width
                        })
                    })
                });
                return style;
            }
            var style: any = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: ruleStyle.stroke.colour,
                    width: ruleStyle.stroke.width
                }),
                fill: new ol.style.Fill({
                    color: ruleStyle.fill.colour
                })
            });
            return style;
        }
        /**
         * Style function: returns a default style
         * @returns {ol.style.Style}
         */
        function getDefaultStyle() {
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
            return style;
        }
    }
}

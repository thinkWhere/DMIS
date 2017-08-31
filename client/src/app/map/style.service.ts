import {Injectable} from '@angular/core';
import * as ol from 'openlayers';

@Injectable()
export class StyleService {

    constructor() {
    }

    /**
     * Get style
     * TODO: validate layerStyle?
     * @param feature
     * @param layerStyle
     * @returns {any}
     */
    getStyle(feature, layerStyle) {
        var style: any;
        if (!layerStyle) {
            style = this.getDefaultStyle();
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
                        style = this.getOLStyle(ruleStyle);
                        return style;
                    }
                }
                if (comparisonType === 'GREATER_THAN') {
                    if (feature.get(propertyName) > filter.min) {
                        style = this.getOLStyle(ruleStyle);
                        return style;
                    }
                }
                if (comparisonType === 'EQUALS') {
                    if (feature.get(propertyName) == filter.value) {
                        style = this.getOLStyle(ruleStyle);
                        return style;
                    }
                }
            }
            else {
                // No filter
                style = this.getOLStyle(ruleStyle);
                return style;
            }
        }
    }

    /**
     * Get the OL style based on the rule style
     * @param ruleStyle
     * @returns {any}
     */
    getOLStyle(ruleStyle) {
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
    getDefaultStyle() {
        // Default style
        var style = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 4,
                stroke: new ol.style.Stroke({
                    color: 'red',
                    width: 2
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.4)'
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
     * Get legend image
     * TODO: work in progress
     * @param layerStyle
     * @returns {string}
     */
    getLegendImage(layerStyle) {
        if (!layerStyle) {
            // TODO: return default style legend image
            return;
        }
        // Create a canvas element
        var canvas: any = document.createElement("canvas");

        // Create the context using OL
        var baseHeight = 10;
        var heightPerCategory = 20;
        var height = baseHeight + heightPerCategory * layerStyle.rules.length;
        var width = 200;
        var vectorContext = ol.render.toContext(canvas.getContext('2d'), {size: [width, height]});

        for (var i = 0; i < layerStyle.rules.length; i++) {
            var ruleStyle = layerStyle.rules[i].style;
            var label = layerStyle.rules[i].label;
            // Get style - very similar to getDefaultStyle which is a nested function
            // TODO: review
            var style: any;
            if (ruleStyle.text) {
                style = new ol.style.Style({
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
            }
            else {
                // Add square
                style = new ol.style.Style({
                    image: new ol.style.RegularShape({
                        radius: 10,
                        points: 4,
                        angle: Math.PI / 4,
                        stroke: new ol.style.Stroke({
                            color: ruleStyle.stroke.colour,
                            width: ruleStyle.stroke.width
                        }),
                        fill: new ol.style.Fill({
                            color: ruleStyle.fill.colour
                        })
                    })
                });
            }
            vectorContext.setStyle(style);
            // TODO: draw Point, Line or Polygon depending on geomType
            vectorContext.drawGeometry(new ol.geom.Point([10, (10 + i * heightPerCategory)]));

            var ctx = canvas.getContext("2d");
            ctx.font = "10px Arial";
            ctx.fillText(label, 30, (15 + i * heightPerCategory));
        }
        // Convert it into an image that can be used as a legend
        var dataURL = canvas.toDataURL();
        return dataURL;
    }
}

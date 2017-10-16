import {Injectable} from '@angular/core';
import * as ol from 'openlayers';
import { Http, Headers, Response, RequestOptions, ResponseContentType } from '@angular/http';

@Injectable()
export class StyleService {

    constructor(
        private http: Http
    ){}

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
     * Supports Font Awesome for text styles
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
            image: new ol.style.Circle({
                radius: 4,
                stroke: new ol.style.Stroke({
                    color: ruleStyle.stroke.colour,
                    width: ruleStyle.stroke.width
                }),
                fill: new ol.style.Fill({
                    color: ruleStyle.fill.colour
                })
            }),
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
     * TODO: add error handling for when no styles are defined
     * @param layerStyle
     * @returns {string}
     */
    getLegendImage(layerStyle) {
        // Create a canvas element
        var canvas: any = document.createElement("canvas");

        // Create the context using OL
        var baseHeight = 25;
        var heightPerCategory = 20;
        if (layerStyle) {
            var height = heightPerCategory * layerStyle.rules.length;
        }
        else {
            var height = baseHeight;
        }
        var width = 200;
        var vectorContext = ol.render.toContext(canvas.getContext('2d'), {size: [width, height]});
        var style: any;

        if (!layerStyle) {
            style = this.getDefaultStyle();
            vectorContext.setStyle(style);
            // We don't know what the geometry type is so draw a point by default
            vectorContext.drawGeometry(
                new ol.geom.Point(
                    [10, 10]
                ));
        }
        else {
            for (var i = 0; i < layerStyle.rules.length; i++) {
                 var ruleStyle = layerStyle.rules[i].style;
                 var ctx = canvas.getContext("2d");
                ctx.font = "10px Arial";
                ctx.fillStyle = 'black';
                ctx.fillText(ruleStyle.label, 30, (15 + i * heightPerCategory));

                if (ruleStyle) {
                    style = this.getOLStyle(ruleStyle);
                }
                else {
                    style = this.getDefaultStyle();
                }
                vectorContext.setStyle(style);
                if (ruleStyle.geomType === 'LINE') {
                    vectorContext.drawGeometry(new ol.geom.LineString([
                        [20, 5 + i * heightPerCategory],
                        [5, 15 + i * heightPerCategory]
                    ]));
                }
                else if (ruleStyle.geomType === 'POLYGON') {
                    vectorContext.drawGeometry(
                        new ol.geom.Polygon([
                            [
                                [5, 5 + i * heightPerCategory],
                                [20, 5 + i * heightPerCategory],
                                [20, 20 + i * heightPerCategory],
                                [5, 20 + i * heightPerCategory],
                                [5, 5 + i * heightPerCategory]
                            ]]));
                }
                else { // POINT
                    vectorContext.drawGeometry(
                        new ol.geom.Point(
                            [13, 13 + i * heightPerCategory]
                        ));
                }

            }
        }
         // Convert it into an image that can be used as a legend
        var dataURL = canvas.toDataURL();
        return dataURL;
    }


    /**
     * Get the image by adding authentication headers
     * @param url
     * @returns {any|Promise<R>|Maybe<T>}
     */
    getArcGISLegendInfo(url){
        return this.http.get(url)
            .map(response => response.json())
    }

    /**
     * Create a legend based on JSON from an ArcGIS layer
     * TODO: this is hardcoded! For the Pacific Disaster Center layer only the first icon needs
     * to get displayed. See: https://github.com/thinkWhere/DMIS/issues/109
     * By hardcoding this, any additional ArcGIS REST layers will only show the first icon as well...
     * @param legendInfo
     * @param callback
     */
    getArcGISLegend(legendInfo, callback){
        // Create a canvas element
        var canvas: any = document.createElement("canvas");
        var context = canvas.getContext('2d');
        var imageCount = 0;
        // Count the images first so we can check later if all images have been loaded before turning the canvas
        // into an image to return
        for (var i = 0; i < legendInfo.layers.length; i++){
            for (var j = 0; j < legendInfo.layers[i].legend.length; j++) {
                imageCount++;
            }
        }
        var anchorHeight = 0;
        var imagesLoaded = 0;
        for (var i = 0; i < legendInfo.layers.length; i++){
            var legends = legendInfo.layers[i].legend;
            for (var j = 0; j < legends.length; j++){
                var img: any = new Image();
                img.anchorHeight = anchorHeight;
                img.label = legends[j].label;
                img.width = legends[j].width;
                img.height = legends[j].height;
                // Add the height of the image to the anchorHeight for the next image to be drawn
                anchorHeight += legends[j].height;
                // Add the legend images
                img.onload = function() {
                    imagesLoaded++;
                    context.drawImage(this, 0, this.anchorHeight, this.width, this.height);
                    context.font = "12px Arial";
                    context.fillText(this.label, this.width + 10, this.anchorHeight + 20);
                    // If using multiple images, Wait for all the legend images to be loaded before returning it
                    // by checking if imagesLoaded == imageCount
                    var dataURL = canvas.toDataURL();
                    callback(dataURL);
                };
                img.src = 'data:' + legends[j].contentType + ';base64,' + legends[j].imageData;
                break;
            }
            break;
        }
        canvas.height = anchorHeight;
    }
}

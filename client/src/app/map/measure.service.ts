import {Injectable} from '@angular/core';
import * as ol from 'openlayers';

import {MapService} from './map.service';

@Injectable()
export class MeasureService {

    map: any;
    wgs84Sphere: any = new ol.Sphere(6378137); // a sphere whose radius is equal to the semi-major axis of the WGS84 ellipsoid
    sketch: any;
    helpTooltipElement: any;
    helpTooltip: any;
    measureTooltipElement: any;
    measureTooltip: any;
    continuePolygonMsg: any;
    continueLineMsg: any;
    draw: any;
    source: any;
    measureType: string = 'line';

    constructor(
        private mapService: MapService
    ) {}

    /**
     * Initialise the measure tool
     * The measure tool is inactive by default
     */
    initMeasureTool() {
        this.continuePolygonMsg = document.getElementById('continuePolygonMsg').innerHTML;
        this.continueLineMsg = document.getElementById('continueLineMsg').innerHTML;
        this.map = this.mapService.getMap();
        this.source = new ol.source.Vector();

        var vector = new ol.layer.Vector({
            source: this.source,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#2abb81',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#2abb81'
                    })
                })
            })
        });

        this.map.addLayer(vector);

        this.map.on('pointermove', (evt) => {
            if (evt.dragging || !this.draw.getActive()) {
                return;
            }
            var helpMsg = document.getElementById('helpMsg').innerHTML;

            if (this.sketch) {
                var geom = (this.sketch.getGeometry());
                if (geom instanceof ol.geom.Polygon) {
                    helpMsg = this.continuePolygonMsg;
                } else if (geom instanceof ol.geom.LineString) {
                    helpMsg = this.continueLineMsg;
                }
            }
            this.helpTooltipElement.innerHTML = helpMsg;
            this.helpTooltip.setPosition(evt.coordinate);
            this.helpTooltipElement.classList.remove('hidden');
        });

        this.map.getViewport().addEventListener('mouseout', (evt) => {
            this.helpTooltipElement.classList.add('hidden');
        });

        this.addInteraction();
        this.draw.setActive(false);
    }

    /**
     * Set the measure tools to active or inactive
     * @param boolean
     */
    setActive(boolean){
        this.draw.setActive(boolean);
        this.map.removeInteraction(this.draw);
        if (boolean){
            this.addInteraction();
        }
        else {
            this.clearMeasurements();
        }
    };

    /**
     * Clear the measurements from the vector layer
     */
    clearMeasurements(){
        if (this.measureTooltipElement) {
            this.map.removeOverlay(this.measureTooltip);
        }
        this.source.clear();
    }

    /**
     * Set measure type. Supported measure types are line and area
     * @param typeOfMeasure
     */
    setType(typeOfMeasure){
        this.measureType = typeOfMeasure;
    }

    /**
     * Format length output.
     * @param {ol.geom.LineString} line The line.
     * @return {string} The formatted length.
     */
    private formatLength = function (line) {
        var length;
        var coordinates = line.getCoordinates();
        length = 0;
        var sourceProj = this.map.getView().getProjection();
        for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
            var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
            var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
            length += this.wgs84Sphere.haversineDistance(c1, c2);
        }

        var output;
        if (length > 100) {
            output = (Math.round(length / 1000 * 100) / 100) +
                ' ' + 'km';
        } else {
            output = (Math.round(length * 100) / 100) +
                ' ' + 'm';
        }
        return output;
    };


    /**
     * Format area output.
     * @param {ol.geom.Polygon} polygon The polygon.
     * @return {string} Formatted area.
     */
    private formatArea = function (polygon) {
        var area = Math.round(polygon.getArea() * 100 / 100);
        var output;
        if (area > 10000) {
            output = (Math.round(area / 1000000 * 100) / 100) +
                ' ' + 'km<sup>2</sup>';
        } else {
            output = (Math.round(area * 100) / 100) +
                ' ' + 'm<sup>2</sup>';
        }
        return output;
    };

    /**
     * Add a draw interaction and event handlers to the map
     */
    private addInteraction = function () {
        // The only difference between initialising the draw polygon and draw line tool is the type
        // It can't be made a variable though, because the compiler expects 'Point', 'LineString' etc and not a
        // variable
        if (this.measureType === 'area'){
            this.draw = new ol.interaction.Draw({
                source: this.source,
                type: 'Polygon',
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 0, 0.5)',
                        lineDash: [10, 10],
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 5,
                        stroke: new ol.style.Stroke({
                            color: 'rgba(0, 0, 0, 0.7)'
                        }),
                        fill: new ol.style.Fill({
                            color: 'rgba(255, 255, 255, 0.2)'
                        })
                    })
                })
            });
        }
        else {
            this.draw = new ol.interaction.Draw({
                source: this.source,
                type: 'LineString',
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 0, 0.5)',
                        lineDash: [10, 10],
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 5,
                        stroke: new ol.style.Stroke({
                            color: 'rgba(0, 0, 0, 0.7)'
                        }),
                        fill: new ol.style.Fill({
                            color: 'rgba(255, 255, 255, 0.2)'
                        })
                    })
                })
            });
        }
        this.map.addInteraction(this.draw);

        this.createHelpTooltip();

        var listener;
        this.draw.on('drawstart', (evt) => {
                this.clearMeasurements();
                this.createMeasureTooltip();
                // set sketch
                this.sketch = evt.feature;
                var tooltipCoord = evt.coordinate;

                listener = this.sketch.getGeometry().on('change', (evt) => {
                    var geom = evt.target;
                    var output;
                    if (geom instanceof ol.geom.Polygon) {
                        output = this.formatArea(geom);
                        tooltipCoord = geom.getInteriorPoint().getCoordinates();
                    } else if (geom instanceof ol.geom.LineString) {
                        output = this.formatLength(geom);
                        tooltipCoord = geom.getLastCoordinate();
                    }
                    this.measureTooltipElement.innerHTML = output;
                    this.measureTooltip.setPosition(tooltipCoord);
                });
            });

        this.draw.on('drawend',
            function () {
                this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
                this.measureTooltip.setOffset([0, -7]);
                // unset sketch
                this.sketch = null;
                ol.Observable.unByKey(listener);
            }, this);
    };


    /**
     * Creates a new help tooltip
     */
    private createHelpTooltip = function () {
        if (this.helpTooltipElement) {
            this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
        }
        this.helpTooltipElement = document.createElement('div');
        this.helpTooltipElement.className = 'ol-tooltip hidden';
        this.helpTooltip = new ol.Overlay({
            element: this.helpTooltipElement,
            offset: [15, 0],
            positioning: 'center-left'
        });
        this.map.addOverlay(this.helpTooltip);
    };


    /**
     * Creates a new measure tooltip
     */

    private createMeasureTooltip = function () {
        this.measureTooltipElement = document.createElement('div');
        this.measureTooltipElement.className = 'ol-tooltip tooltip-measure';
        this.measureTooltip = new ol.Overlay({
            element: this.measureTooltipElement,
            offset: [0, -15],
            positioning: 'bottom-center'
        });
        this.map.addOverlay(this.measureTooltip);
    };
}


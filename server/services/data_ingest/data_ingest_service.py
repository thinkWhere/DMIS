from flask import current_app
from server.models.postgis.dmis_data import DMISData
from geojson import Feature, FeatureCollection, Point, dumps
from server.services.data_ingest.arcgis2geojson import arcgis2geojson


class DataIngestError(Exception):
    """ Custom Exception to notify callers an error occurred when handling projects """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class DataIngestService:

    @staticmethod
    def process_data(data_source: str, raw_request):
        data_source = data_source.lower()
        dmis_data = DMISData()

        if data_source == 'river-gauge':
            # TODO may want to save to a separate river gauge table in future
            dmis_data.save_json_data(data_source, raw_request.get_json())
        elif data_source == 'hub':
            # TODO more parsing will be needed to understand exactly what type of data is here
            dmis_data.save_json_data(data_source, raw_request.get_json())
        elif data_source == 'test':
            geojson = DataIngestService._process_arcgis_json(raw_request.get_json())
            dmis_data.save_json_data(data_source, geojson)
        else:
            raise DataIngestError(f'Unknown data source {data_source}')

    @staticmethod
    def _process_arcgis_json(arcgis_json):
        features = []
        source_features = arcgis_json.get('features', [])
        for source_feature in source_features:
            # Get attributes
            new_feature_attributes = source_feature.get("attributes", {})
            # Format geometry and add to feature
            new_feature_geometry = arcgis2geojson(source_feature.get("geometry", {}))
            new_feature = Feature(geometry=new_feature_geometry, properties=new_feature_attributes)
            features.append(new_feature)
        # Add CRS
        epsg_code = arcgis_json.get('spatialReference', {}).get('wkid', 3857)
        crs = {
            "type": "name",
            "properties": {
                "name": f"EPSG:{epsg_code}"
            }
        }
        dataset = FeatureCollection(features, crs=crs)
        return dataset


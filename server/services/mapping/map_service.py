from urllib.parse import parse_qs

import requests
from flask import current_app, Response
from werkzeug.datastructures import Headers

from server.models.postgis.dmis_data import DMISData
from server.services.mapping.earthnetworks_service import EarthNetworksService, EarthNetworksError


class MapServiceClientError(Exception):
    """ Custom Exception to notify callers an error occurred when handling projects """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class MapServiceServerError(Exception):
    """ Custom Exception to notify callers an error occurred when handling projects """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class MapService:
    @staticmethod
    def handle_map_request(map_protocol: str, query_string: str) -> Response:
        """ Handler looks at request protocol and then determines how to process the request"""

        # TODO currently only supports WMS will extend with new protocols over time
        if map_protocol.lower() == 'wms':
            return MapService.proxy_request_to_geoserver(map_protocol, query_string)
        elif map_protocol.lower() == 'geojson':
            return MapService.handle_geojson_request(query_string)
        else:
            raise MapServiceClientError(f'Unknown map protocol: {map_protocol}')

    @staticmethod
    def handle_geojson_request(query_string: str) -> Response:
        """ Validate that request if for a known geojson datasource, then generate a valid Flask Response """
        layer_source = MapService.parse_geojson_request(query_string)

        available_layers = DMISData.get_available_data_sources()

        if layer_source not in available_layers:
            raise MapServiceClientError(f'Unknown geojson layer source: {layer_source}')

        if layer_source == 'earthnetworks_lightning':
            # EarthNetworks data retrieved from S3, so needs separate path
            return MapService.get_earthnetworks_lightning_response()
        else:
            layer_geojson = DMISData.get_latest_json_data_for_source(layer_source)
            return Response(layer_geojson, status=200, mimetype='application/json')

    @staticmethod
    def get_earthnetworks_lightning_response():
        """ Get the EarthNetworks lightning response """
        try:
            feature_collection_json, last_updated = EarthNetworksService.get_latest_lightning_data()
        except EarthNetworksError:
            raise MapServiceServerError('Error occurred attempting to get EarthNetworks Lightning Data')

        response_headers = Headers()
        response_headers.add('Last-Modified', last_updated)

        flask_response = Response(feature_collection_json, status=200, mimetype='application/json',
                                  headers=response_headers)
        return flask_response

    @staticmethod
    def parse_geojson_request(query_string: str) -> str:
        """ Helper method to ensure geoJson mapping request is valid """
        parsed_query = parse_qs(query_string)

        if 'layerSource' in parsed_query:
            return parsed_query['layerSource'][0].lower()
        else:
            raise MapServiceClientError('GeoJson request must supply layerSource in query string')

    @staticmethod
    def proxy_request_to_geoserver(map_protocol: str, query_string: str) -> Response:
        """ Helper method to proxy map requests to Geoserver"""
        geoserver_url = current_app.config['GEOSERVER_URL']
        geoserver_request_url = f'{geoserver_url}/dmis/{map_protocol}?{query_string}'

        raw_response = requests.get(geoserver_request_url)

        if raw_response.status_code != 200:
            current_app.logger.error(f'Geoserver returned error response {raw_response.status_code}')

        # Flask can't serialize response from requests, so have to generate a Flask response
        flask_response = Response(raw_response, status=raw_response.status_code,
                                  content_type=raw_response.headers['Content-Type'])

        return flask_response

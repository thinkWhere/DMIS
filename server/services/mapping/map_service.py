from urllib.parse import parse_qs

import requests
from flask import current_app, Response

from server.services.mapping.earthnetworks_service import EarthNetworksService


class MapServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling projects """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class MapService:
    @staticmethod
    def handle_map_request(map_protocol: str, query_string: str):
        """ Handler looks at request protocol and then determines how to process the request"""

        # TODO currently only supports WMS will extend with new protocols over time
        if map_protocol.lower() == 'wms':
            return MapService.proxy_request_to_geoserver(map_protocol, query_string)
        elif map_protocol.lower() == 'geojson':
            return MapService.handle_geojson_request(query_string)
        else:
            raise MapServiceError(f'Unknown map protocol: {map_protocol}')

    @staticmethod
    def handle_geojson_request(query_string: str):
        requested_layer = MapService.parse_geojson_request(query_string)

        if requested_layer.lower() in ['earthnetworks_lightning_points', 'earthnetworks_lightning_heatmap']:
            EarthNetworksService.get_latest_lightning_data()
        else:
            raise MapServiceError(f'Unknown geojson layer requested: {requested_layer}')

    @staticmethod
    def parse_geojson_request(query_string: str) -> str:
        parsed_query = parse_qs(query_string)

        if 'layerName' in parsed_query:
            return parsed_query['layerName'][0]
        else:
            raise MapServiceError('GeoJson request must supply layerName in query string')

    @staticmethod
    def proxy_request_to_geoserver(map_protocol: str, query_string: str):
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

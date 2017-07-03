import requests

from flask import current_app, Response


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
        else:
            raise MapServiceError(f'Unknown map protocol: {map_protocol}')

    @staticmethod
    def proxy_request_to_geoserver(map_protocol: str, query_string: str):
        """ Helper method to proxy map requests to Geoserver"""
        geoserver_url = current_app.config['GEOSERVER_URL']
        geoserver_request_url = f'{geoserver_url}/{map_protocol}?{query_string}'

        raw_response = requests.get(geoserver_request_url)

        if raw_response.status_code != 200:
            current_app.logger.error(f'Geoserver returned error response {raw_response.status_code}')

        # Flask can't serialize response from requests, so have to generate a Flask response
        flask_response = Response(raw_response, status=raw_response.status_code,
                                  content_type=raw_response.headers['Content-Type'])

        return flask_response

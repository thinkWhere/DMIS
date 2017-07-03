from flask_restful import Resource, request

from server.services.mapping.map_service import MapService, MapServiceError
from server.services.users.authentication_service import token_auth


class MapsAPI(Resource):

    @token_auth.login_required
    def get(self, map_protocol):
        """
        Proxies map requests
        ---
        tags:
          - maps
        produces:
          - application/xml
        parameters:
          - in: header
            name: Authorization
            description: Base64 encoded bearer
            required: true
            type: string
          - in: path
            name: map_protocol
            description: Mapping protocol requested
            type: string
            required: true
            default: wms
          - in: query
            name: REQUEST
            type: string
            required: false
            default: GetCapabilities
        responses:
          200:
            description: Request successful
          400:
            description: Bad request
          500:
            description: Internal Server Error
        """
        try:
            # Get query string from URL
            query_str = request.query_string.decode('utf-8')
            response = MapService.handle_map_request(map_protocol, query_str)
            return response
        except MapServiceError as e:
            return {'Error': str(e)}, 400
        except Exception as e:
            app.logger.critical('Unhandled exception encountered: {}'.format(e))
            return {'Error': 'Unhandled'}, 500
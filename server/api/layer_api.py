from flask import current_app
from flask_restful import Resource

from server.services.layers.layer_service import LayerService, NotFound
from server.services.users.authentication_service import token_auth, dmis


class LayerAPI(Resource):

    @token_auth.login_required
    def get(self):
        """
        Gets layer
        ---
        tags:
          - layers
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
        responses:
          200:
            description: Layers
          401:
            description: Unauthorized, credentials are invalid
          500:
            description: Internal Server Error
        """
        try:
            layer_dto = LayerService.get_layer_list()
            return layer_dto.to_primitive(), 200
        except Exception as e:
            error_msg = f'Layer GET - unhandled error {str(e)}'
            current_app.logger.critical(error_msg)
            return {'error': error_msg}, 500

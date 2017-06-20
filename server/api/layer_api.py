from flask_restful import Resource
from server.services.users.authentication_service import token_auth


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
        return {"Success": "Layers Go here"}

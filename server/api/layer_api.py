from flask_restful import request, current_app
from flask_restful import Resource
from schematics.exceptions import DataError

from server.models.dtos.layer_dto import LayerUpdateDTO
from server.services.layers.layer_service import LayerService, LayerServiceError
from server.services.users.authentication_service import token_auth, dmis
from server.models.postgis.utils import NotFound


class LayerListAPI(Resource):

    @token_auth.login_required
    def get(self):
        """
        Get all available layers
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
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
        responses:
          200:
            description: Layers
          401:
            description: Unauthorized, credentials are invalid
          404:
            description: Endpoint not found or no layers available
          500:
            description: Internal Server Error
        """
        try:
            layers = LayerService.get_all_layers()
            return layers.to_primitive(), 200
        except NotFound:
            return {"Error": "No layers found"}, 404
        except Exception as e:
            error_msg = f'Layer GET - unhandled error {str(e)}'
            current_app.logger.critical(error_msg)
            return {'error': error_msg}, 500


class LayerAPI(Resource):

    @dmis.admin_only()
    @token_auth.login_required
    def get(self, id):
        """
        Gets a layer
        ---
        tags:
          - admin - layers
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
            - in: path
              name: id
              description: ID of the layer
              type: integer
              required: true
              default: 1
        responses:
          200:
            description: Layer
          400:
            description: Bad request
          401:
            description: Unauthorized, credentials are invalid
          404:
            description: No layer found
          500:
            description: Internal Server Error
        """
        try:
            layer_details_dto = LayerService.get_layer_dto_by_id(id)
            return layer_details_dto.to_primitive(), 200
        except LayerServiceError as e:
            return {"Error": str(e)}, 400
        except NotFound:
            return {"Error": "No layer found"}, 404
        except Exception as e:
            error_msg = f'Layer GET - unhandled error {str(e)}'
            current_app.logger.critical(error_msg)
            return {'error': error_msg}, 500

    @dmis.admin_only()
    @token_auth.login_required
    def post(self, id):
        """
        Updates a layer
        ---
        tags:
          - admin - layers
        produces:
          - application/json
        parameters:
          - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
          - in: path
            name: id
            description: ID of the layer
            type: integer
            required: true
            default: 1
          - in: body
            name: body
            required: true
            description: JSON object for updating a layer
            schema:
                  properties:
                      mapCategory:
                          type: string
                          default: PREPAREDNESS
                      layerInfoLocales:
                          type: array
                          items:
                              properties:
                                  locale:
                                      type: string
                                      default: en
                                  layerTitle:
                                      type: string
                                      default: rivers
                                  layerCopyright:
                                      type: string
                                      default: People in Need
                                  layerGroup:
                                      type: string
                                      default: environment
        responses:
          200:
            description: Layer details updated
          400:
            description: Invalid request
          401:
            description: Unauthorized, credentials are invalid
          404:
            description: Not found
          500:
            description: Internal Server Error
        """
        try:
            layer_update_dto = LayerUpdateDTO(request.get_json())
            layer_update_dto.layer_id = id
            layer_update_dto.validate()
        except DataError as e:
            current_app.logger.error(f'error validating request: {str(e)}')
            return str(e), 400

        try:
            updated_layer = LayerService.update_layer(layer_update_dto)
            return updated_layer.to_primitive(), 200
        except NotFound:
            return {"Error": "Layer not found"}, 404
        except Exception as e:
            error_msg = f'Layer update - Unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

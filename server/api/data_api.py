from flask_restful import Resource, request, current_app

from server.services.data_ingest.data_ingest_service import DataIngestService, DataIngestError
from server.services.users.authentication_service import token_auth


class DataAPI(Resource):

    @token_auth.login_required
    def put(self, data_source):
        """
        Allows third parties to push data into DMIS
        ---
        tags:
          - data
        produces:
          - application/json
        parameters:
          - in: header
            name: Authorization
            description: Base64 encoded bearer
            required: true
            type: string
          - in: path
            name: data_source
            description: Unique data source name
            type: string
            required: true
            default: river-gauge
          - in: body
            name: body
            required: false
            description: Request payload for data
            schema:
                  properties:
                      property1:
                          type: string
                          default: sample
                      property2:
                          type: string
                          default: sample
        responses:
          201:
            description: Request successful
          400:
            description: Bad request
          401:
            description: Unauthorized, credentials are invalid
          500:
            description: Internal Server Error
        """
        try:
            DataIngestService.process_data(data_source, request)
            return {'Status': 'Success'}, 201
        except DataIngestError as e:
            return {'Error': str(e)}, 400
        except Exception as e:
            current_app.logger.critical('Unhandled exception encountered: {}'.format(e))
            return {'Error': 'Unhandled'}, 500

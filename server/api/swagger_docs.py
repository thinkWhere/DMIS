from flask import current_app, jsonify
from flask_restful import Resource
from flask_swagger import swagger


class SwaggerDocs(Resource):
    """
    This Resource provides a simple endpoint for flask-swagger to generate the API docs,
    https://github.com/gangverk/flask-swagger
    """

    def get(self):
        """
        Generate YAML feed suitable for Swagger UI to consume
        ---
        tags:
          - docs
        produces:
          - application/json
        responses:
          200:
            description: Swagger YAML successfully generated
        """
        swag = swagger(current_app)
        swag['info']['title'] = "DMIS API"
        swag['info']['description'] = "DMIS API supports the DMIS front-end App"
        swag['info']['version'] = "0.0.1"

        return jsonify(swag)

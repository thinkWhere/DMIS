from werkzeug.exceptions import Unauthorized
from flask import abort
from flask_restful import Resource, request, fields
from server import app


class HelloWorldAPI(Resource):
    """
    /locations
    """

    def get(self, yourname):
        """
        Simple Hello World API call. Accepts name and replies Hello.
        ---
        tags:
          - hello
        parameters:
          - name: yourname
            in: path
            description: Your name
            required: true
            type: string
            default: Angus
        produces:
          - application/json
        responses:
          200:
            description: Everything OK
          400:
            description: Request is invalid
          500:
            description: Server Error
        """
        if len(yourname) < 2:
            abort(400, 'Your Name must be at least 2 characters long')

        try:
            reply = "Hello " + yourname
            return reply, 200
        except Unauthorized:
            return {'Error': 'Unauthorized'}, 401
        except Exception as e:
            app.logger.critical('Unhandled exception encountered: {}'.format(e))
            return {'Error': 'Unhandled'}, 500

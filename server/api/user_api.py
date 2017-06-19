from flask import current_app
from flask_httpauth import HTTPBasicAuth
from flask_restful import Resource, request

from server.services.users.login_service import LoginService

auth = HTTPBasicAuth()


@auth.verify_password
def verify_credentials(username, password):
    """
    Verifies that the supplied token on any login_required decorated endpoint are valid
    :param username: Username from request header
    :param password: Password from request header
    :return: True if valid
    """
    return LoginService().is_valid_credentials(username, password, request.view_args)


class LoginAPI(Resource):

    @auth.login_required
    def post(self, username):
        """
        Validates users credentials and returns token and relevant user details
        ---
        tags:
          - users
        produces:
          - application/json
        parameters:
          - name: username
            in: path
            description: The username of the customer attempting to login
            required: true
            type: string
            default: thinkwhere
        responses:
          200:
            description: Login Successful
          401:
            description: Unauthorized, credentials are invalid
          500:
            description: Internal Server Error
        security:
          type: basic

        """
        try:
            logged_in_user = LoginService().login_user(username)
            return logged_in_user.to_primitive(), 200
        except Exception as e:
            current_app.logger.critical('Unhandled exception when attempting to login, exception: {0}'.format(str(e)))
            return {'Error': 'Unhandled'}, 500

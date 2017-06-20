from flask_httpauth import HTTPBasicAuth
from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.user_dto import UserDTO
from server.services.users.user_service import UserService
from server.services.users.authentication_service import AuthenticationService

auth = HTTPBasicAuth()


@auth.verify_password
def verify_credentials(username, password):
    """
    Verifies that the supplied token on any login_required decorated endpoint are valid
    :param username: Username from request header
    :param password: Password from request header
    :return: True if valid
    """
    return AuthenticationService().is_valid_credentials(username, password)


class UserAPI(Resource):

    def put(self):
        """
        Creates user and validates email address
        ---
        tags:
          - users
        produces:
          - application/json
        parameters:
          - in: body
            name: body
            required: true
            description: JSON object for creating draft project
            schema:
                  properties:
                      username:
                          type: string
                          default: dmisuser
                      password:
                          type: string
                          default: password
                      emailAddress:
                          type: string
                          default: test@dmis.com
        responses:
          201:
            description: User Created
          400:
            description: Invalid request
          500:
            description: Internal Server Error
        """
        try:
            user_dto = UserDTO(request.get_json())
            if user_dto.email_address == '':
                user_dto.email_address = None  # Replace empty string with None so validation doesn't break

            user_dto.validate()
        except DataError as e:
            current_app.logger.error(f'error validating request: {str(e)}')
            return str(e), 400

        try:
            UserService.create_user(user_dto)
        except Exception as e:
            error_msg = f'User Create - Unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

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
            logged_in_user = AuthenticationService().login_user(username)
            return logged_in_user.to_primitive(), 200
        except Exception as e:
            current_app.logger.critical('Unhandled exception when attempting to login, exception: {0}'.format(str(e)))
            return {'Error': 'Unhandled'}, 500

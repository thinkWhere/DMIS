from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.user_dto import UserDTO
from server.services.users.user_service import UserService, UserExistsError
from server.services.users.authentication_service import AuthenticationService, basic_auth, dmis


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
          403:
            description: Forbidden, username already exists
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
        except UserExistsError as e:
            return {"Error": str(e)}, 403
        except Exception as e:
            error_msg = f'User Create - Unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class LoginAPI(Resource):

    @basic_auth.login_required
    def post(self):
        """
        Validates users credentials and returns token and relevant user details
        ---
        tags:
          - users
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
            description: Login Successful
          401:
            description: Unauthorized, credentials are invalid
          500:
            description: Internal Server Error
        """
        try:
            session = AuthenticationService.login_user(dmis.authenticated_user_id)
            return session.to_primitive(), 200
        except Exception as e:
            current_app.logger.critical('Unhandled exception when attempting to login, exception: {0}'.format(str(e)))
            return {'Error': 'Unhandled'}, 500

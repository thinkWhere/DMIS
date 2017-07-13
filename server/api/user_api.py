from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.user_dto import UserDTO, UserUpdateDTO
from server.services.users.authentication_service import token_auth
from server.services.users.user_service import UserService, UserExistsError
from server.services.users.authentication_service import AuthenticationService, basic_auth, dmis
from server.models.postgis.utils import NotFound


class UserAPI(Resource):

    @token_auth.login_required
    def put(self, username):
        """
        Creates user
        ---
        tags:
          - users
        produces:
          - application/json
        parameters:
          - in: body
            name: body
            required: true
            description: JSON object for creating a new user
            schema:
                  properties:
                      password:
                          type: string
                          default: password
                      role:
                          type: string
                          default: user
          - in: path
            name: username
            description: the unique user
            required: true
            type: string
            default: dmisuser
        responses:
          201:
            description: User Created
          400:
            description: Invalid request
          401:
            description: Unauthorized, credentials are invalid
          403:
            description: Forbidden, username already exists
          500:
            description: Internal Server Error
        """
        try:
            user_dto = UserDTO(request.get_json())
            user_dto.username = username
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

    @token_auth.login_required
    def delete(self, username):
        """
        Deletes a user
        ---
        tags:
          - users
        produces:
          - application/json
        parameters:
          - in: path
            name: username
            description: the unique user
            required: true
            type: string
            default: test
        responses:
          201:
            description: User deleted
          401:
            description: Unauthorized, credentials are invalid
          404:
            description: Not found
          500:
            description: Internal Server Error
        """
        try:
            UserService.delete_user(username)
            return {"Success": "User deleted"}, 200
        except NotFound:
            return {"Error": "No user found"}, 404
        except Exception as e:
            error_msg = f'User DELETE - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @token_auth.login_required
    def post(self, username):
        """
        Updates a user
        ---
        tags:
          - users
        produces:
          - application/json
        parameters:
          - in: body
            name: body
            required: true
            description: JSON object for creating a new user
            schema:
                  properties:
                      role:
                          type: string
                          default: user
          - in: path
            name: username
            description: the unique user
            required: true
            type: string
            default: dmisuser
        responses:
          200:
            description: User details updated
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
            user_update_dto = UserUpdateDTO(request.get_json())
            user_update_dto.username = username
            user_update_dto.validate()
        except DataError as e:
            current_app.logger.error(f'error validating request: {str(e)}')
            return str(e), 400

        try:
            updated_user = UserService.update_user(user_update_dto)
            return updated_user.to_primitive(), 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f'User update - Unhandled error: {str(e)}'
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


class UserListAPI(Resource):

    @token_auth.login_required
    def get(self):
        """
        Gets a list of all users
        ---
        tags:
          - users
        produces:
          - application/json
        responses:
          200:
            description: Users found
          401:
            description: Unauthorized, credentials are invalid
          500:
            description: Internal Server Error
        """
        try:
            user_dto = UserService.get_all_users()
            return user_dto.to_primitive(), 200
        except Exception as e:
            error_msg = f'User list GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
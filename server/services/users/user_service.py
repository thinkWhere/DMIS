from flask import current_app
from passlib.hash import pbkdf2_sha256 as sha256_hash
from server.models.dtos.user_dto import UserDTO, UserUpdateDTO
from server.models.postgis.user import User
from server.models.postgis.utils import NotFound
from server.models.postgis.lookups import UserRole


class UserExistsError(Exception):
    """
    Custom exception to notify caller that account already exists
    """

    def __init__(self, message):
        if current_app:
            current_app.logger.error('User already exists: ' + message)


class UserServiceError(Exception):
    """
    Custom exception to notify caller error has occurred within UserService
    """

    def __init__(self, message):
        if current_app:
            current_app.logger.error('UserServiceError: ' + message)


class UserService:

    @staticmethod
    def create_user(user_dto: UserDTO):
        """
        Creates a new admin user record
        :param user_dto: DTO containing all user details
        :return: User if created successfully
        :raises UserExistsError if username already exists
        """
        # Check if username already exists
        if User.get_by_username(user_dto.username) is not None:
            raise UserExistsError(f'Cannot create account. Username {user_dto.username} already exists.')

        new_user = User()
        new_user.username = user_dto.username
        new_user.password = UserService._hash_password(user_dto.password)  # Hash password so not storing in plaintext
        new_user.role = UserRole[user_dto.role].value

        new_user.create()
        return new_user

    @staticmethod
    def get_user_by_id(user_id: int) -> User:
        """ Returns user that matches ID """
        user = User.get_by_id(user_id)

        if user is None:
            raise NotFound()

        return user

    @staticmethod
    def get_user_by_username(username: str) -> User:
        user = User().get_by_username(username)

        if user is None:
            raise NotFound()

        return user

    @staticmethod
    def get_all_users():
        """ Gets a list of users"""
        return User.get_all_users()

    @staticmethod
    def _hash_password(password):
        """
        Returns a secure hashed representation of the user's password.  Uses PassLib read more about
        using the lib here https://pythonhosted.org/passlib/new_app_quickstart.html
        :param password: Plaintext password supplied by customer
        :return: Hashed password
        """
        # Hash plaintext password using sha256 algorithm, DO NOT ALTER SCHEME
        password_hash = sha256_hash.hash(password)
        return password_hash

    @staticmethod
    def delete_user(username: str):
        """ Deletes user that matches ID """
        user = UserService.get_user_by_username(username)
        user.delete()

    @staticmethod
    def update_user(user_update_dto: UserUpdateDTO) -> UserDTO:
        """ Updates the user details in DB """
        user_details = UserService.get_user_by_username(user_update_dto.username)
        user_details.update(user_update_dto)
        return user_details.as_dto()
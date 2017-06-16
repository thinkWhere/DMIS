from flask import current_app
from passlib.apps import custom_app_context as pwd_context
from server.models.dtos.user_dto import UserDTO
from server.models.postgis.user import User, UserRole
from server.models.postgis.utils import NotFound


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
            current_app.logger.error('User account error: ' + message)


class UserService:

    def create_user(self, username, email, password):
        """
        Creates a new admin user record
        :param username: Username to create
        :param email: Email address of user to create
        :param password: Password for new account to create
        :return: User if created successfully
        :raises UserExistsError if user does not exist
        """
        new_user = User()

        # Test user doesn't already exist
        existing_user = self.get_user_by_username(username)
        if existing_user:
            raise UserExistsError(f'User {username} already exists')

        new_user.username = username
        new_user.email_address = email
        # Hash password so not storing in plaintext
        new_user.password = UserService._hash_password(password)

        new_user.create()
        return new_user

    @staticmethod
    def get_user_by_id(user_id: int) -> User:
        user = User().get_by_id(user_id)

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
    def get_user_dto_by_username(requested_username: str, logged_in_user_id: int) -> UserDTO:
        """Gets user DTO for supplied username """
        requested_user = UserService.get_user_by_username(requested_username)
        logged_in_user = UserService.get_user_by_id(logged_in_user_id)

        return requested_user.as_dto(logged_in_user.username)

    @staticmethod
    def _hash_password(password):
        """
        Returns a secure hashed representation of the user's password.  Uses PassLib read more about
        using the lib here https://pythonhosted.org/passlib/new_app_quickstart.html
        :param password: Plaintext password supplied by customer
        :return: Hashed password
        """
        # Hash plaintext password using sha512 algorithm, DO NOT ALTER SCHEME
        password_hash = pwd_context.encrypt(password, scheme='sha512_crypt')

        return password_hash

import base64
from passlib.hash import pbkdf2_sha256 as sha256_hash
from flask import current_app
from server.models.dtos.user_dto import UserDTO
from server.services.users.user_service import UserService, UserNotFoundError
from server.services.users.token_utils import is_valid_token, generate_timed_token


class AuthenticationService:

    def is_valid_credentials(self, username_or_token, password):
        """
        Validates if the supplied credentials are valid
        :param username_or_token: Will be the users username or a generated auth token
        :param password: users password, will be empty if token being used
        :return: True if valid
        """
        # If username_or_token is empty then no point attempting to validate, so return False
        if not username_or_token:
            return False

        # If token check is valid we don't need to do any subsequent testing.  Note that tokens are hardcoded to
        # be good for 8 hours (28800 seconds)
        if is_valid_token(username_or_token, 28800):
            return True

        # Token check has failed so attempt to standard username/password check
        try:
            user = UserService.get_user_by_username(username_or_token)
        except UserNotFoundError:
            return False

        # If customer is valid we just need to validate password
        login_success = self._is_valid_password(password, user.password)

        return login_success

    def login_user(self, username) -> UserDTO:
        """
        Method gets relevant user details for a successfully authenticated customer and generates a session
        token that can be used in place of username and password for the remainder of the user session
        :param username: The account username
        :raises: LoginServiceError
        :return: LoggedInCustomer
        """
        user = UserService().get_user_by_username(username)

        logged_in_user = user.as_dto(None)
        logged_in_user.session_token = generate_timed_token(username)

        return logged_in_user

    def _is_valid_password(self, password, password_hash):
        """
        Tests that supplied password matches stored hash
        :param password: Customer supplied password in plaintext
        :param password_hash: Stored hash
        :return: True if password matches
        """
        # DO NOT ALTER SCHEME, as will result in auth errors
        password_match = sha256_hash.verify(password, password_hash)

        return password_match

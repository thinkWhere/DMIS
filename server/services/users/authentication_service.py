from base64 import b64decode, b64encode

from flask_httpauth import HTTPTokenAuth, HTTPBasicAuth
from flask import current_app
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from passlib.hash import pbkdf2_sha256 as sha256_hash

from server.api.utils import DMISAPIDecorators
from server.models.dtos.user_dto import SessionDTO
from server.models.postgis.lookups import UserRole
from server.services.users.user_service import UserService, NotFound


basic_auth = HTTPBasicAuth()
token_auth = HTTPTokenAuth()
dmis = DMISAPIDecorators


@basic_auth.verify_password
def verify_credentials(username: str, password: str) -> bool:
    """
    Verifies that the supplied token on any login_required decorated endpoint are valid
    :param username: Username from request header
    :param password: Password from request header
    :return: True if valid
    """
    return AuthenticationService.is_valid_credentials(username, password)


@token_auth.verify_token
def verify_token(token: str) -> bool:
    """ Verifies that the session token is valid """
    try:
        decoded_token = b64decode(token).decode('utf-8')
    except UnicodeDecodeError:
        current_app.logger.error(f'Unable to decode token')
        return False  # Can't decode token, so fail login

    # If token check is valid we don't need to do any subsequent testing.  Note that tokens are hardcoded to
    # be good for 8 hours (28800 seconds)
    return AuthenticationService.is_valid_token(decoded_token, 28800)


class AuthenticationService:

    @staticmethod
    def is_valid_credentials(username: str, password: str) -> bool:
        """ Validates supplied username and password """

        # If username is empty then no point attempting to validate, so return False
        if not username:
            return False

        try:
            user = UserService.get_user_by_username(username)
        except NotFound:
            return False

        login_success = AuthenticationService._is_valid_password(password, user.password)
        dmis.authenticated_user_id = user.user_id

        return login_success

    @staticmethod
    def login_user(user_id: int) -> SessionDTO:
        """
        Method gets relevant user details for a successfully authenticated customer and generates a session
        token that can be used in place of username and password for the remainder of the user session
        :param user_id: The account username
        """
        user = UserService.get_user_by_id(user_id)

        session = SessionDTO()
        session.username = user.username
        session.role = UserRole(user.role).name
        session.token = AuthenticationService.generate_timed_token(user_id)

        return session

    @staticmethod
    def _is_valid_password(password, password_hash):
        """
        Tests that supplied password matches stored hash
        :param password: Customer supplied password in plaintext
        :param password_hash: Stored hash
        :return: True if password matches
        """
        # DO NOT ALTER SCHEME, as will result in auth errors
        password_match = sha256_hash.verify(password, password_hash)

        return password_match

    @staticmethod
    def generate_timed_token(user_id: int) -> str:
        """
        Generates a unique token with time embedded within it
        :return: Base64 encoded token as a string
        """
        print(current_app.secret_key)
        serializer = URLSafeTimedSerializer(current_app.secret_key)

        # Generate token embedding user_id
        token = serializer.dumps(user_id)

        b64_token = b64encode(token.encode())
        return b64_token.decode('ascii')

    @staticmethod
    def is_valid_token(token, token_expiry):
        """
        Validates if the supplied token is valid, and hasn't expired.
        :param token: Token to check
        :param token_expiry: When the token expires
        :return: True if token is valid
        """
        print(current_app.secret_key)
        serializer = URLSafeTimedSerializer(current_app.secret_key)

        try:
            tokenised_user_id = serializer.loads(token, max_age=token_expiry)
            dmis.authenticated_user_id = tokenised_user_id
        except SignatureExpired:
            current_app.logger.debug('Token has expired')
            return False
        except BadSignature:
            current_app.logger.debug('Bad Token Signature')
            return False

        return True

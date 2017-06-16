import base64
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from passlib.apps import custom_app_context as pwd_context
from server import app
from server.models.dtos.user_dto import UserDTO
from server.services.users.admin_user_service import AdminUserService

# Private Key used to generate and encode activation codes
# WARNING EDITING THIS WILL MEAN ANY TOKENS IN THE WILD WILL NO LONGER VALIDATE, BE CAREFUL!!!!
PRIVATE_KEY = '4RIEePtTnW5mRzKfFX0NLlihB9zZ44cUbTAoW0E0HW60udE1kSDQiaqTDKI4'


class LoginService:

    def is_valid_authorization_token(self, token, view_args):
        """
        Used for token based authentication
        :param token: Base64 encoded token
        :param view_args: The arguments that were on the decorated api, used for username test
        :return: True if valid
        """
        if not token:
            return False

        decoded_token = base64.b64decode(token).decode('utf-8')
        credentials = decoded_token.split(':', 1)  # Only split string max of one time, incase user has ":" in password

        username_or_session_token = credentials[0]
        password = credentials[1]

        return self.is_valid_credentials(username_or_session_token, password, view_args)

    def is_valid_credentials(self, username_or_token, password, view_args=None):
        """
        Validates if the supplied credentials are valid
        :param email_address_or_token: Will be the users email_address or a generated auth token
        :param password: users password, will be empty if token being used
        :param view_args: The arguments that were on the decorated api, used for username test
        :return: True if valid
        """
        # If username_or_token is empty then no point attempting to validate, so return False
        if not username_or_token:
            return False

        requested_username = None

        # See if requested resource contained a username argument, if so we'll need to validate that the logged in
        # user isn't attempting to access a data owned by another user
        if view_args is not None:
            try:
                requested_username = view_args['username']
            except KeyError:
                # Username not found so swallow exception
                pass

        # If token check is valid we don't need to do any subsequent testing.  Note that tokens are hardcoded to
        # be good for 8 hours (28800 seconds)
        if self.is_valid_token(username_or_token, 28800, requested_username):
            return True

        # Token check has failed so attempt to standard username/password check
        user_service = AdminUserService()
        user = user_service.get_user_by_email(username_or_token)

        if self._is_invalid_user(user, requested_username):
            return False

        # If customer is valid we just need to validate password
        login_success = self._is_valid_password(password, user.password)

        return login_success

    def login_user(self, email_address):
        """
        Method gets relevant user details for a successfully authenticated customer and generates a session
        token that can be used in place of username and password for the remainder of the user session
        :param email_address: The email address
        :raises: LoginServiceError
        :return: LoggedInCustomer
        """
        user_service = AdminUserService()
        user = user_service.get_user_by_email(email_address)

        logged_in_user = LoggedInUser()
        logged_in_user.first_name = user.first_name
        logged_in_user.surname = user.surname
        logged_in_user.session_token = self.generate_timed_token(email_address)
        logged_in_user.username = email_address

        return logged_in_user

    def is_valid_token(self, token, token_expiry, requested_username=None):
        """
        Validates if the supplied token is valid, and hasn't expired.
        :param token: Token to check
        :param token_expiry: When the token expires
        :param requested_username: The username that was requested from the API, if this is different from the tokenised
          user then the tokenised user is attempting to illegally access other users details
        :return: True if token is valid
        """
        serializer = URLSafeTimedSerializer(PRIVATE_KEY)

        try:
            tokenised_username = serializer.loads(token, max_age=token_expiry)
        except SignatureExpired:
            app.logger.debug('Token has expired')
            return False
        except BadSignature:
            app.logger.debug('Bad Token Signature')
            return False

        if requested_username is not None:
            # If the requested username is not equal to the tokenised username, then the user is attempting to
            # access a resource that belongs to another user, which is effectively hacking, hence logging out warning
            if tokenised_username != requested_username.lower():
                app.logger.warn(
                    'Tokenised user {0}, attempted to access resource belonging to {1}'.format(tokenised_username,
                                                                                               requested_username))
                return False

        return True

    def _is_invalid_user(self, user, requested_username=None):
        """
        Determines if the user is valid
        :param user: user in scope
        :param requested_username: Which user the logged in user has wanted to see
        :return:
        """
        if user is None:
            return True

        if requested_username is not None:
            # If the requested username is not equal to the email_address, then the user is attempting to
            # access a resource that belongs to another user, which is effectively hacking, hence logging out warning
            if user.email_address != requested_username:
                app.logger.warn('User {0}, attempted to access resource belonging to {1}'.format(user.email_address,
                                                                                                 requested_username))
                return True

        # User is valid
        return False

    def _is_valid_password(self, password, password_hash):
        """
        Tests that supplied password matches stored hash
        :param password: Customer supplied password in plaintext
        :param password_hash: Stored hash
        :return: True if password matches
        """
        # DO NOT ALTER SCHEME, as will result in auth errors
        password_match = pwd_context.verify(password, password_hash, scheme='sha512_crypt')

        return password_match

    def generate_timed_token(self, email_address):
        """
        Generates a unique token with time embedded within it
        :return:
        """
        serializer = URLSafeTimedSerializer(PRIVATE_KEY)

        # Generate token using email
        token = serializer.dumps(email_address.lower())
return token
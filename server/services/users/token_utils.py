from flask import current_app
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

# Private Key used to generate and encode activation codes
# WARNING EDITING THIS WILL MEAN ANY TOKENS IN THE WILD WILL NO LONGER VALIDATE, BE CAREFUL!!!!
# TODO: Change this to an environment variable for security!
PRIVATE_KEY = '4RIEePtTnW5mRzKfFX0NLlihB9zZ44cUbTAoW0E0HW60udE1kSDQiaqTDKI4'


def generate_timed_token(email_address):
    """
    Generates a unique token with time embedded within it
    :return:
    """
    serializer = URLSafeTimedSerializer(PRIVATE_KEY)

    # Generate token using email
    token = serializer.dumps(email_address.lower())

    return token


def is_valid_token(token, token_expiry, requested_username=None):
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
        current_app.logger.debug('Token has expired')
        return False
    except BadSignature:
        current_app.logger.debug('Bad Token Signature')
        return False

    if requested_username is not None:
        # If the requested username is not equal to the tokenised username, then the user is attempting to
        # access a resource that belongs to another user, which is effectively hacking, hence logging out warning
        if tokenised_username != requested_username.lower():
            current_app.logger.warn(
                'Tokenised user {0}, attempted to access resource belonging to {1}'.format(tokenised_username,
                                                                                           requested_username))
            return False

    return True

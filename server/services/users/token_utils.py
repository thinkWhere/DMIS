from flask import current_app
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired


def generate_timed_token(user_id: int):
    """
    Generates a unique token with time embedded within it
    :return:
    """
    serializer = URLSafeTimedSerializer(current_app.secret_key)

    # Generate token using email
    token = serializer.dumps(user_id)

    return token


def is_valid_token(token, token_expiry):
    """
    Validates if the supplied token is valid, and hasn't expired.
    :param token: Token to check
    :param token_expiry: When the token expires
    :return: True if token is valid
    """
    serializer = URLSafeTimedSerializer(current_app.secret_key)

    try:
        serializer.loads(token, max_age=token_expiry)
    except SignatureExpired:
        current_app.logger.debug('Token has expired')
        return False
    except BadSignature:
        current_app.logger.debug('Bad Token Signature')
        return False

    return True

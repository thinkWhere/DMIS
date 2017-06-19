from enum import Enum


class UserRole(Enum):
    """ Describes the role a user can be assigned, app doesn't support multiple roles """
    USER = 0
    ADMIN = 1

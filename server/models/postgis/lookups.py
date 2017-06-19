from enum import Enum


class UserRole(Enum):
    """ Describes the role a user can be assigned, app doesn't support multiple roles """
    USER = 0
    ADMIN = 1


class MapCategory(Enum):
    """ Identifies which map category each layer should be a part of """
    UNKNOWN = 0
    PREPAREDNESS = 1
    INCIDENTS_WARNINGS = 2
    ASSESSMENT_RESPONSE = 3

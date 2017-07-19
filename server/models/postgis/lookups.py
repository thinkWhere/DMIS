from enum import Enum


class UserRole(Enum):
    """ Describes the role a user can be assigned, app doesn't support multiple roles """
    USER = 0
    ADMIN = 1


class MapCategory(Enum):
    """ Identifies which map category each layer should be a part of """
    UNKNOWN = 1
    PREPAREDNESS = 2
    INCIDENTS_WARNINGS = 3
    ASSESSMENT_RESPONSE = 4


class LayerType(Enum):
    """ Describes which layer types are supported """
    WMS = 'wms'
    ARCGISREST = 'arcgisrest'

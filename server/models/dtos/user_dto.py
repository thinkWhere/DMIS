from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, IntType, EmailType
from schematics.types.compound import ListType, ModelType
from server.models.postgis.lookups import UserRole


def is_known_role(value):
    """ Validates that supplied user role is known value """
    try:
        UserRole[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown mappingLevel: {value} Valid values are {UserRole.ADMIN.name}, '
                              f'{UserRole.USER.name}')


class SessionDTO(Model):
    """ Describes the session object """
    username = StringType()
    role = StringType()
    token = StringType()


class UserDTO(Model):
    """ DTO for User """
    username = StringType(required=True)
    password = StringType(required=True, serialize_when_none=False)
    role = StringType(required=True, validators=[is_known_role])


class UserUpdateDTO(Model):
    """ DTO for user update """
    username = StringType(required=True)
    role = StringType(required=True, validators=[is_known_role])


class UserListDTO(Model):
    """ DTO for a list of users """
    def __init__(self):
        """ DTO constructor to initialise all arrays to be empty """
        super().__init__()
        self.user_list = []

    user_list = ListType(ModelType(UserDTO), serialized_name='userList')
from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, IntType, EmailType
from server.models.postgis.lookups import UserRole


def is_known_role(value):
    """ Validates that supplied user role is known value """
    try:
        UserRole[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown mappingLevel: {value} Valid values are {UserRole.ADMIN.name}, '
                              f'{UserRole.USER.name}')


class UserDTO(Model):
    """ DTO for User """
    username = StringType(required=True)
    password = StringType(required=True)
    email_address = EmailType(serialized_name='emailAddress', required=True)

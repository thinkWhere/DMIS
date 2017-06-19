from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, IntType
from schematics.types.compound import ListType, ModelType, BaseType
from server.models.postgis.lookups import MapCategory


def is_known_category(value):
    """ Validates that supplied user role is known value """
    try:
        MapCategory[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown map category: {value} Valid values are {MapCategory.UNKNOWN.name}, '
                              f'{MapCategory.PREPAREDNESS.name}, {MapCategory.INCIDENTS_WARNINGS.name}, '
                              f'{MapCategory.ASSESSMENT_RESPONSE.name}')


class ListedLayer(Model):
    """ Describes a layer within the Layer List """
    layer_name = StringType()
    layer_title = StringType()
    layer_description = StringType()
    map_category = StringType()
    layer_group = StringType()
    layer_source = StringType()


class LayerSearchQuery(Model):
    """ Describes a layer search query, that a client may submit to filter the list of layers """
    map_category = StringType(validators=[is_known_category])


class LayerSearchDTO(Model):
    """ Grouped list of layers """
    def __init__(self):
        super().__init__()
        self.layers = []
    # TODO: Add grouping by layergroup and mapcategory
    layers = ListType(ModelType(ListedLayer))

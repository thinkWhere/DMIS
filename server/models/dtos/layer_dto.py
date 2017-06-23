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
    layer_name = StringType(required=True)
    layer_title = StringType(required=True)
    layer_description = StringType()
    map_category = StringType(required=True, validators=[is_known_category])
    layer_group = StringType()
    layer_source = StringType(required=True)


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


class LayerDetailsDTO(Model):
    """ Basic details for an individual layer, excluding hierarchy """
    layer_name = StringType()
    layer_title = StringType()
    layer_description = StringType()
    layer_source = StringType()
    layer_group = StringType()     # TODO: Add hierarchy using LayerGroupDTO instead


class LayerGroupDTO(Model):
    """ Model for layers grouped by layer group """
    group_name = StringType()
    layers = ListType(ModelType(LayerDetailsDTO))


class LayerTOCDTO(Model):
    """ Model for layers grouped by map category and layer group """

    def __init__(self):
        """ DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.preparedness_layers = []
        self.incident_layers = []
        self.assessment_layers = []

    preparedness_layers = ListType(ModelType(LayerDetailsDTO), serialized_name='preparednessLayers')
    incident_layers = ListType(ModelType(LayerDetailsDTO), serialized_name='incidentLayers')
    assessment_layers = ListType(ModelType(LayerDetailsDTO), serialized_name='assessmentLayers')

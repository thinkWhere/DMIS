from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType
from schematics.types.compound import ListType, ModelType
from server.models.postgis.lookups import MapCategory


def is_known_category(value):
    """ Validates that supplied user role is known value """
    try:
        MapCategory[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown map category: {value} Valid values are {MapCategory.UNKNOWN.name}, '
                              f'{MapCategory.PREPAREDNESS.name}, {MapCategory.INCIDENTS_WARNINGS.name}, '
                              f'{MapCategory.ASSESSMENT_RESPONSE.name}')


class LayerDTO(Model):
    """ Describes a layer within the Layer List """
    layer_name = StringType(required=True, serialized_name='layerName')
    layer_title = StringType(required=True, serialized_name='layerTitle')
    layer_description = StringType(serialized_name='layerDescription')
    map_category = StringType(required=True, validators=[is_known_category], serialized_name='mapCategory')
    layer_group = StringType(serialized_name='layerGroup')
    layer_source = StringType(required=True, serialized_name='layerSource')


class LayerSearchDTO(Model):
    """ Simple list of layer details """
    def __init__(self):
        super().__init__()
        self.layers = []

    layers = ListType(ModelType(LayerDTO))


class LayerDetailsDTO(Model):
    """ Basic details for an individual layer, excluding hierarchy """
    layer_name = StringType()
    layer_title = StringType()
    layer_description = StringType()
    layer_source = StringType()
    layer_group = StringType()     # TODO: Add hierarchy using LayerGroupDTO instead


class LayerTOCDTO(Model):
    """ Model for layers grouped by map category and layer group """

    def __init__(self):
        """ DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.preparedness_layers = []
        self.incident_layers = []
        self.assessment_layers = []

    preparedness_layers = ListType(ModelType(LayerDetailsDTO), serialized_name='preparednessLayers', serialize_when_none=False)
    incident_layers = ListType(ModelType(LayerDetailsDTO), serialized_name='incidentLayers', serialize_when_none=False)
    assessment_layers = ListType(ModelType(LayerDetailsDTO), serialized_name='assessmentLayers', serialize_when_none=False)

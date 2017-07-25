from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, IntType
from schematics.types.compound import ListType, ModelType
from server.models.postgis.lookups import MapCategory, LayerType


def is_known_category(value):
    """ Validates that supplied category is a known value """
    try:
        MapCategory[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown map category: {value} Valid values are {MapCategory.UNKNOWN.name}, '
                              f'{MapCategory.PREPAREDNESS.name}, {MapCategory.INCIDENTS_WARNINGS.name}, '
                              f'{MapCategory.ASSESSMENT_RESPONSE.name}')


def is_known_type(value):
    """ Validates that the supplied layer type is a known value """
    try:
        LayerType[value.upper()]
    except KeyError:
        raise ValidationError(f'Unknown layer type: {value} Valid values are {LayerType.WMS.name}, '
                              f'{LayerType.ARCGISREST.name}')


class LayerDetailsDTO(Model):
    """ Describes a layer within the Layer List """
    layer_id = IntType(required=True, serialized_name='layerId')
    layer_name = StringType(required=True, serialized_name='layerName')
    layer_title = StringType(required=True, serialized_name='layerTitle')
    map_category = StringType(required=True, validators=[is_known_category], serialized_name='mapCategory')
    layer_group = StringType(serialized_name='layerGroup')
    layer_source = StringType(required=True, serialized_name='layerSource')
    layer_copyright = StringType(required=True, serialized_name='layerCopyright')
    layer_type = StringType(required=True, validators=[is_known_type], serialized_name='layerType')


class LayerUpdateDTO(Model):
    """ DTO for layer update """
    layer_id = IntType(required=True, serialized_name='layerId')
    layer_title = StringType(required=True, serialized_name='layerTitle')
    layer_group = StringType(serialized_name='layerGroup')
    layer_copyright = StringType(required=True, serialized_name='layerCopyright')
    map_category = StringType(required=True, validators=[is_known_category], serialized_name='mapCategory')


class DMISLayersDTO(Model):
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

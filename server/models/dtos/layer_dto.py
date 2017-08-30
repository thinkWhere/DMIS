from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import StringType, IntType, BaseType
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


class LayerInfoDTO(Model):
    """ Contains the localized layer info """
    locale = StringType(required=True)
    layer_title = StringType(required=True, serialized_name='layerTitle')
    layer_group = StringType(serialized_name='layerGroup', required=True)
    layer_copyright = StringType(required=True, serialized_name='layerCopyright')


class LayerDetailsDTO(Model):
    """ Describes a layer within the Layer List """
    def __init__(self):
        """ DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.layer_info_locales = []

    layer_id = IntType(required=True, serialized_name='layerId')
    layer_name = StringType(required=True, serialized_name='layerName')
    map_category = StringType(required=True, validators=[is_known_category], serialized_name='mapCategory')
    layer_source = StringType(required=True, serialized_name='layerSource')
    layer_type = StringType(required=True, validators=[is_known_type], serialized_name='layerType')
    layer_style = BaseType(serialized_name='layerStyle')
    # We will either return a LayerInfo object for the specified locale or all locales if no locale is specified
    layer_info = ModelType(LayerInfoDTO, serialized_name='layerInfo', serialize_when_none=False)
    layer_info_locales = ListType(ModelType(LayerInfoDTO), serialized_name='layerInfoLocales', serialize_when_none=False)


class LayerUpdateDTO(Model):
    """ DTO for layer update """
    layer_id = IntType(required=True, serialized_name='layerId')
    map_category = StringType(required=True, validators=[is_known_category], serialized_name='mapCategory')
    layer_info_locales = ListType(ModelType(LayerInfoDTO), serialized_name='layerInfoLocales')


class DMISLayersDTO(Model):
    """ DTO for all available layers """
    def __init__(self):
        """ DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.layers = []

    layers = ListType(ModelType(LayerDetailsDTO))

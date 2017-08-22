import unittest
from schematics.exceptions import DataError
from unittest.mock import patch

from server.services.layers.layer_service import LayerService, LayerServiceError, Layer, NotFound, MapCategory
from server.models.dtos.layer_dto import LayerDetailsDTO


class TestLayerService(unittest.TestCase):

    def test_unknown_map_category_raises_error(self):
        # Act / Assert
        with self.assertRaises(LayerServiceError):
            LayerService.get_layers_by_category('batman')

    @patch.object(Layer, 'get_layers')
    def test_get_layers_raises_not_found_if_no_layers_match_category(self, mock_layer):
        # Arrange
        mock_layer.return_value = None

        # Act / Assert
        with self.assertRaises(NotFound):
            LayerService.get_layers_by_category(MapCategory.PREPAREDNESS.name)

    def test_unknown_layer_type_raises_error(self):
        layer_details = LayerDetailsDTO()
        layer_details.layer_name = 'name'
        layer_details.layer_title = 'title'
        layer_details.layer_description = 'description'
        layer_details.map_category = MapCategory.PREPAREDNESS.name
        layer_details.layer_group = 'group'
        layer_details.layer_source = 'source'
        layer_details.layer_copyright = 'copyright'
        layer_details.layer_type = 'superman'

        with self.assertRaises(DataError):
            layer_details.validate()

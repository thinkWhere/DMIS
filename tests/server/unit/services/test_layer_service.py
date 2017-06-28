import unittest
from unittest.mock import patch

from server.services.layers.layer_service import LayerService, LayerServiceError, Layer, NotFound, MapCategory


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

import unittest

from server.services.mapping.map_service import MapService, MapServiceClientError


class TestMapService(unittest.TestCase):

    def test_parse_geojson_request_returns_layername(self):
        # Arrange
        test_query = 'layerSource=earthnetworks_lightning'

        # Act
        layer_name = MapService.parse_geojson_request(test_query)

        # Assert
        self.assertEqual(layer_name, 'earthnetworks_lightning')

    def test_no_layername_in_query_string_raises_error(self):
        # Arrange
        bad_query = 'xxName=earthnetworks_lightning_points'

        # Act / Assert
        with self.assertRaises(MapServiceClientError):
            MapService.parse_geojson_request(bad_query)

    def test_unknown_geojson_layer_raises_error(self):
        # Arrange
        bad_query = 'layerName=badbad'

        # Act / Assert
        with self.assertRaises(MapServiceClientError):
            MapService.handle_geojson_request(bad_query)
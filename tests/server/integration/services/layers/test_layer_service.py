import os
import unittest

from server import bootstrap_app
from server.models.dtos.layer_dto import LayerInfoDTO
from server.models.postgis.lookups import MapCategory, LayerType
from server.services.layers.layer_service import LayerService, LayerDetailsDTO, LayerUpdateDTO


class TestLayerService(unittest.TestCase):
    skip_tests = False
    test_layer = None

    @classmethod
    def setUpClass(cls):
        env = os.getenv('SHIPPABLE', 'false')

        # Firewall rules mean we can't hit Postgres from Shippable so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

    def setUp(self):
        """
        Setup test context so we can connect to database
        """
        if self.skip_tests:
            return

        self.app = bootstrap_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        self.setup_dmis_layer()

    def tearDown(self):
        if self.skip_tests:
            return

        self.test_layer.delete()
        self.ctx.pop()

    def setup_dmis_layer(self):
        # Setup test layer info
        layer_info = LayerInfoDTO()
        layer_info.locale = 'en'
        layer_info.layer_copyright = 'Copyright IH 2017'
        layer_info.layer_group = 'Humanitarian'
        layer_info.layer_title = 'Test Layer'

        layer_dto = LayerDetailsDTO()
        layer_dto.layer_name = 'test_layer'
        layer_dto.map_category = MapCategory.PREPAREDNESS.name
        layer_dto.layer_source = 'https://blah.com/wms'
        layer_dto.layer_type = LayerType.WMS.name
        layer_dto.layer_info.append(layer_info)

        # This tests that the layer service correctly corrects layers
        self.test_layer = LayerService.create_layer(layer_dto)

    def test_get_all_layers_returns_layers(self):
        if self.skip_tests:
            return

        # Act
        layers_dto = LayerService.get_all_layers()

        # Assert that at least one layer returned
        self.assertGreater(len(layers_dto.layers), 0)

    def test_get_layer_dto_by_id_returns_expected_layer(self):
        if self.skip_tests:
            return

        # Act
        actual_layer = LayerService.get_layer_by_id(self.test_layer.layer_id)

        # Assert
        self.assertEqual(self.test_layer.layer_name, actual_layer.layer_name)

    def test_update_layer_details(self):
        """ Check that the layer details are updated """
        if self.skip_tests:
            return

        # Arrange
        layer_info = LayerInfoDTO()
        layer_info.locale = 'km'
        layer_info.layer_copyright = 'Copyright IH 2017'
        layer_info.layer_group = 'KM Humanitarian'
        layer_info.layer_title = 'KM Test Layer'

        layer_details = LayerService.get_layer_dto_by_id(self.test_layer.layer_id)
        test_layer_update_dto = LayerUpdateDTO()
        test_layer_update_dto.layer_id = layer_details.layer_id
        test_layer_update_dto.map_category = layer_details.map_category
        test_layer_update_dto.layer_info = layer_details.layer_info

        test_layer_update_dto.layer_info.append(layer_info)
        test_layer_update_dto.map_category = MapCategory.INCIDENTS_WARNINGS.name

        # Act
        updated_layer = LayerService.update_layer(test_layer_update_dto)

        # Assert
        self.assertEqual(len(updated_layer.layer_info), 2, 'Should be 2 records for layer info')
        self.assertEqual(updated_layer.map_category, test_layer_update_dto.map_category)

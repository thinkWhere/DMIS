import os
import unittest

from server import bootstrap_app
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
        layer_dto = LayerDetailsDTO()
        layer_dto.layer_name = 'test_layer'
        layer_dto.layer_title = 'Test Layer'
        layer_dto.layer_group = 'Humanitarian'
        layer_dto.map_category = MapCategory.PREPAREDNESS.name
        layer_dto.layer_source = 'https://blah.com/wms'
        layer_dto.layer_type = LayerType.WMS.name

        # This tests that the layer service correctly corrects layers
        self.test_layer = LayerService.create_layer(layer_dto)

    def test_layers_by_category_finds_layer(self):
        if self.skip_tests:
            return

        # Act
        layer_by_category = LayerService.get_layers_by_category(MapCategory.PREPAREDNESS.name)

        # Assert that at least one layer returned
        self.assertGreater(len(layer_by_category.preparedness_layers), 0)

    def test_update_layer_details(self):
        """ Check that the layer details are updated """
        if self.skip_tests:
            return

        # Arrange
        test_layer_update_dto = LayerService.get_layer_dto_by_id(self.test_layer.layer_id)
        test_layer_update_dto.layer_title = 'spiderman'
        test_layer_update_dto.layer_copyright = 'spiderman copyright'
        test_layer_update_dto.layer_group = 'superheroes'
        test_layer_update_dto.map_category = MapCategory.INCIDENTS_WARNINGS.name

        # Act
        updated_layer = LayerService.update_layer(test_layer_update_dto)

        # Assert
        self.assertEqual(updated_layer.layer_title, test_layer_update_dto.layer_title)
        self.assertEqual(updated_layer.layer_copyright, test_layer_update_dto.layer_copyright)
        self.assertEqual(updated_layer.layer_group, test_layer_update_dto.layer_group)
        self.assertEqual(updated_layer.map_category, test_layer_update_dto.map_category)

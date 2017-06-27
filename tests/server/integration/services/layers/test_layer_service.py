import os
import unittest

from server import bootstrap_app
from server.models.postgis.lookups import MapCategory
from server.services.layers.layer_service import LayerDTO, LayerService


class TestLayerService(unittest.TestCase):
    skip_tests = False
    test_user = None

    @classmethod
    def setUpClass(cls):
        env = os.getenv('SHIPPABLE', 'false')

        # Firewall rules mean we can't hit Postgres from Shippable so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

    def test_layer_crud(self):
        layer_dto = LayerDTO()
        layer_dto.layer_name = 'test_layer'
        layer_dto.layer_title = 'Test Layer'
        layer_dto.layer_description = 'Thinkwhere Test Layer'
        layer_dto.layer_group = 'Humanitarian'
        layer_dto.map_category = MapCategory.PREPAREDNESS.name
        layer_dto.layer_source = 'https://blah.com/wms'

        # Create new layer
        new_layer = LayerService.create_layer(layer_dto)

        iain = new_layer

        new_layer

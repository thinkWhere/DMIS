import unittest
from schematics.exceptions import DataError

from server.services.layers.layer_service import MapCategory
from server.models.dtos.layer_dto import LayerDetailsDTO


class TestLayerService(unittest.TestCase):

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

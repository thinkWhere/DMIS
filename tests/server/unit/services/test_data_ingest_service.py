import unittest
import os
import json
from server.services.data_ingest.data_ingest_service import DataIngestService


class TestDataIngestService(unittest.TestCase):

    def test_conversion_arcgisjson_to_geojson(self):
        # Arrange
        arcgis_data = self._get_json_file('sample_arcgis.json')
        sample_converted_geojson = self._get_json_file('sample_converted.geojson')

        # Act
        actual_converted_geojson = DataIngestService._process_arcgis_json(arcgis_data)

        # Assert
        self.assertDictEqual(sample_converted_geojson, actual_converted_geojson)

    @staticmethod
    def _get_json_file(json_filename):
        """
        Helper function to reads json file from disk and return as an object to be manipulated
        :param json_filename: The file we want to load
        :return: File as an object
        """
        file_location = os.path.join(os.path.dirname(__file__), 'test_files/{0}'.format(json_filename))
        json_file = open(file_location, mode='r', encoding='utf-8')
        return json.loads(json_file.read())

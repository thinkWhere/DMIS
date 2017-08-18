import unittest

from os import path
import os

from server.services.mapping.earthnetworks_service import EarthNetworksService


class TestEarthNetworksService(unittest.TestCase):

    def test_clean_up_removes_files(self):
        # Arrange
        weather_dir = path.abspath(path.join(__file__, "../../../../../../weather"))
        test_file_name = 'a_test.csv'
        test_file_location = os.path.join(weather_dir, test_file_name)

        # Generate a test file for deletion
        f = open(test_file_location, 'w')
        f.write('Test\n')
        f.close()

        # Act
        EarthNetworksService.clean_up_weather_dir(weather_dir, 0)

        # Assert
        self.assertFalse(os.path.exists(test_file_location), 'Test file should have been deleted')

    def test_get_file_location_returns_expected_path(self):
        # Arrange
        test_file = 'test.csv'
        weather_found = False
        file_found = False

        # Act
        file_location = EarthNetworksService.get_local_file_location(test_file)

        # Assert
        if 'weather' in file_location:
            weather_found = True

        if test_file in file_location:
            file_found = True

        self.assertTrue(weather_found)
        self.assertTrue(file_found)

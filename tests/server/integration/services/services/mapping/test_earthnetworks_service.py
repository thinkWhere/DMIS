import os
import unittest

from pathlib import Path
from datetime import datetime

from geojson import FeatureCollection

from server.services.mapping.earthnetworks_service import EarthNetworksService
from server import bootstrap_app


class TestEarthNetworksService(unittest.TestCase):

    skip_tests = False
    weather_dir = None

    @classmethod
    def setUpClass(cls):
        env = os.getenv('SHIPPABLE', 'false')

        # Firewall rules mean we can't hit Postgres from Shippable so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

        base_dir = Path(__file__).parents[6]
        cls.weather_dir = os.path.join(base_dir, 'weather')

    def setUp(self):
        """
        Setup test context so we can connect to database
        """
        if self.skip_tests:
            return

        self.app = bootstrap_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def test_clean_up_removes_files(self):
        # Arrange
        test_file_name = 'a_test.csv'
        test_file_location = os.path.join(self.weather_dir, test_file_name)

        # Generate a test file for deletion
        f = open(test_file_location, 'w')
        f.write('Test\n')
        f.close()

        # Act
        EarthNetworksService.clean_up_weather_dir(self.weather_dir, 0)

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

    def test_lightning_data_can_be_downloaded_from_s3(self):
        if self.skip_tests:
            return

        # Arrange
        test_date = datetime.strptime('20170821', '%Y%m%d')

        # Act
        lightning_file = EarthNetworksService.get_latest_daily_lighting_file(test_date)

        # Assert
        self.assertTrue(lightning_file, 'Should have downloaded a lightning file')

        # Clean up
        EarthNetworksService.clean_up_weather_dir(self.weather_dir, 0)

    def test_no_lightning_data_returns_empty_geojson(self):
        # Arrange
        no_lightning_file = os.path.join(self.weather_dir, 'test_lightning_no_data.csv')

        # Act
        empty_feature_collection, metadata = EarthNetworksService.convert_lightning_data_to_geojson(no_lightning_file)

        # Assert
        self.assertEqual(metadata, 'No updates since 8/8/2017 3:23:56 PM')
        self.assertTrue(type(empty_feature_collection) is FeatureCollection, 'Must be a feature collection object')

    def test_valid_lightning_file_returns_feature_collection(self):
        if self.skip_tests:
            return

        # Arrange
        lightning_file = os.path.join(self.weather_dir, 'test_lightning.csv')

        # Act
        valid_feature_collection, metadata = EarthNetworksService.convert_lightning_data_to_geojson(lightning_file)

        self.assertEqual(332, len(valid_feature_collection['features']), 'Valid file should have 332 features')

    def test_can_retrieve_metadata_from_filename(self):
        # Arrange
        filename = 'pplnneedlx_20170808_072225.csv'

        # Act
        metadata = EarthNetworksService.get_lightning_file_meta_data(filename)

        # Assert
        self.assertEqual(metadata, '08-Aug-2017 07:22:25')

    def test_get_latest_lighning_data_returns_json_feature_collection(self):
        if self.skip_tests:
            return

        # Act
        json_feature_collection, metadata = EarthNetworksService.get_latest_lightning_data()

        # Assert
        self.assertTrue(json_feature_collection, 'Json str should be available')
        self.assertTrue(metadata, 'Metadata should be available')

        # Clean up
        EarthNetworksService.clean_up_weather_dir(self.weather_dir, 0)


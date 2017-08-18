import unittest

from datetime import datetime
import os

from server.services.mapping.earthnetworks_service import EarthNetworksService
from server import bootstrap_app


class TestEarthNetworksService(unittest.TestCase):

    skip_tests = False

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

    def test_clean_up_removes_files(self):
        # Arrange
        weather_dir = os.path.abspath(os.path.join(__file__, "../../../../../../weather"))
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

    def test_lightning_data_can_be_downloaded_from_s3(self):
        if self.skip_tests:
            return

        # Arrange
        test_date = datetime.strptime('20170808', '%Y%m%d')

        # Act
        lightning_file = EarthNetworksService.get_latest_daily_lighting_file(test_date)

        # Assert
        self.assertTrue(lightning_file, 'Should have downloaded a lightning file')

        # Clean up
        weather_dir = os.path.abspath(os.path.join(__file__, "../../../../../../weather"))
        EarthNetworksService.clean_up_weather_dir(weather_dir, 0)


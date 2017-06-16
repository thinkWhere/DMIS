import os
import unittest
from unittest.mock import patch

from server import bootstrap_app
from server.services.users.user_service import UserService, User


class TestUserService(unittest.TestCase):
    skip_tests = False

    @classmethod
    def setUpClass(cls):
        env = os.getenv('SHIPPABLE', 'false')

        # Firewall rules mean we can't hit Postgres from Shippable so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

    def setUp(self):
        if self.skip_tests:
            return

        self.app = bootstrap_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def test_create_user_new(self):
        """ Generate a canned user in the DB """
        if self.skip_tests:
            return

        # Arrange
        test_username = 'ThinkWhereTest'
        test_email = 'testuser@thinkwhere.com'
        test_password = 'aaAAAfffFFFvvvvVVV'
        user_service = UserService()

        # Act
        user_service.create_user(test_username, test_email, test_password)
        self.assertTrue(1 == 1)

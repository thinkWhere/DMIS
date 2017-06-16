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

    def create_canned_user() -> User:
        """ Generate a canned user in the DB """
        test_user = User()
        test_user.id = TEST_USER_ID
        test_user.username = 'Thinkwhere TEST'
        test_user.mapping_level = 1
        test_user.create()

        return test_user
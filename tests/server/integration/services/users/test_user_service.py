import os
import unittest

from server import bootstrap_app
from server.services.users.user_service import UserService, User, NotFound
from server.models.dtos.user_dto import UserUpdateDTO
from server.models.postgis.lookups import UserRole

TEST_USER_ID = 1


def create_dmis_user() -> User:
    # Setup test user
    test_user = User()
    test_user.user_id = TEST_USER_ID
    test_user.username = 'ThinkWhereTest'
    test_user.password = 'aaAAAfffFFFvvvvVVV'
    test_user.role = UserRole['USER'].value
    test_user.create()

    return test_user


class TestUserService(unittest.TestCase):
    skip_tests = False
    test_user = None

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

        self.test_user = create_dmis_user()

    def tearDown(self):
        if self.skip_tests:
            return

        self.test_user.delete()
        self.ctx.pop()

    def test_get_user_by_username(self):
        """ Get a canned user from the DB """
        if self.skip_tests:
            return

        # Arrange
        test_username = 'ThinkWhereTest'

        # Act
        found_user = UserService.get_user_by_username(test_username)

        self.assertIsNotNone(found_user, f'Did not find user by username {test_username}')

    def test_get_user_by_username_returns_not_found_exception(self):
        """ Check that NotFound exception returned if username not found """
        if self.skip_tests:
            return

        # Arrange
        test_username = 'ThinkWherexxxxTest'

        # Act
        with self.assertRaises(NotFound):
            UserService.get_user_by_username(test_username)

    def test_get_user_by_id(self):
        """ Get a canned user from the DB """
        if self.skip_tests:
            return

        # Arrange

        # Act
        found_user = UserService.get_user_by_id(TEST_USER_ID)

        self.assertIsNotNone(found_user, f'Did not find user by ID {TEST_USER_ID}')

    def test_get_user_by_id_returns_not_found_exception(self):
        """ Get a canned user from the DB """
        if self.skip_tests:
            return

        # Arrange
        test_user_id = 9999999999999999999

        # Act
        with self.assertRaises(NotFound):
            UserService.get_user_by_id(test_user_id)

    def test_update_user_role(self):
        """ Check that the role is updated """
        if self.skip_tests:
            return

        # Arrange
        test_user_update_dto = UserUpdateDTO()
        test_user_update_dto.username = 'ThinkWhereTest'
        test_user_update_dto.role = 'admin'

        # Act
        updated_user = UserService.update_user(test_user_update_dto)

        # Assert
        self.assertEqual(updated_user.role.upper(), test_user_update_dto.role.upper())
from passlib.hash import pbkdf2_sha256 as sha256_hash
import unittest

from server.services.users.user_service import UserService


class TestUserService(unittest.TestCase):

    def test_hash_password(self):
        # Arrange
        test_password = 'aaAAAfffFFFvvvvVVV'

        # Act
        test_hashed = UserService._hash_password(test_password)

        # Assert
        self.assertTrue(sha256_hash.verify(test_password, test_hashed))
        self.assertFalse(sha256_hash.verify('blahblahblah', test_hashed))


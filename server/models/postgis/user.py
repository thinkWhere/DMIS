from server import db
from server.models.dtos.user_dto import UserDTO
from server.models.postgis.lookups import UserRole
from server.models.postgis.utils import timestamp


class User(db.Model):
    """ Describes the user account table """
    __tablename__ = "dmis_users"

    user_id = db.Column(db.BigInteger, primary_key=True, index=True)
    username = db.Column(db.String, unique=True, index=True)
    role = db.Column(db.Integer, default=0, nullable=False)
    email_address = db.Column(db.String)
    password = db.Column(db.String)
    date_created = db.Column(db.DateTime, default=timestamp)

    def create(self):
        """ Creates and saves the current model to the DB """
        db.session.add(self)
        db.session.commit()

    @staticmethod
    def get_by_id(user_id: int):
        """ Return the user for the specified id, or None if not found """
        return User.query.get(user_id)

    @staticmethod
    def get_by_username(username: str):
        """ Return the user for the specified username, or None if not found """
        return User.query.filter_by(username=username).one_or_none()

    def update(self, user_dto: UserDTO):
        """ Update the user details """
        self.email_address = user_dto.email_address.lower() if user_dto.email_address else None
        db.session.commit()

    def delete(self):
        """ Delete the user in scope from DB """
        db.session.delete(self)
        db.session.commit()

    def as_dto(self, logged_in_username: str) -> UserDTO:
        """ Create DTO object from user in scope """
        user_dto = UserDTO()
        user_dto.username = self.username
        user_dto.role = UserRole(self.role).name

        if self.username == logged_in_username:
            # Only return email address when logged in user is looking at their own profile
            user_dto.email_address = self.email_address

        return user_dto

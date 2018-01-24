from server import db
from server.models.dtos.user_dto import UserDTO, UserListDTO, UserUpdateDTO
from server.models.postgis.lookups import UserRole
from server.models.postgis.utils import timestamp, NotFound


class User(db.Model):
    """ Describes the user account table """
    __tablename__ = "dmis_users"

    user_id = db.Column(db.BigInteger, primary_key=True, index=True)
    username = db.Column(db.String, unique=True, index=True)
    role = db.Column(db.Integer, default=0, nullable=False)
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

    @staticmethod
    def get_all_users():
        """ Return a list of all users """
        user_list = User.query.all()

        if len(user_list) == 0:
            raise NotFound()

        user_list_dto = UserListDTO()
        for user in user_list:
            user_list_dto.user_list.append(user.as_dto())

        return user_list_dto

    def update(self, user_update_dto: UserUpdateDTO):
        """ Update the user details """
        self.role = UserRole[user_update_dto.role.upper()].value
        db.session.commit()

    def delete(self):
        """ Delete the user in scope from DB """
        db.session.delete(self)
        db.session.commit()

    def as_dto(self) -> UserDTO:
        user_dto = UserDTO()
        user_dto.username = self.username
        user_dto.role = UserRole(self.role).name

        return user_dto

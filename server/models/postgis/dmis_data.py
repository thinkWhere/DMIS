from sqlalchemy.dialects.postgresql import JSON
from server import db


class DMISData(db.Model):
    """ Describes the layer table """
    __tablename__ = "dmis_data"

    data_id = db.Column(db.BigInteger, primary_key=True, index=True)
    data_source = db.Column(db.String)
    # TODO postgres recommend using JSONB type as it's more efficient, however, for now we want to easily see the data
    json_data = db.Column(JSON)
    # TODO we could add further columns for xml, strings etc as needed dependent on type of data???

    def save_json_data(self, data_source, json):
        self.data_source = data_source
        self.json_data = json
        db.session.add(self)
        db.session.commit()

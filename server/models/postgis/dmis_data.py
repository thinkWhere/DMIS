import datetime
import json
from typing import List


from flask import current_app
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
    data_received = db.Column(db.DateTime, default=datetime.datetime.now)

    def save_json_data(self, data_source, json):
        """ Saves JSON data """
        self.data_source = data_source
        self.json_data = json
        db.session.add(self)
        db.session.commit()

    @staticmethod
    def get_available_data_sources() -> List[str]:
        """ Gets a list of available data sources """
        # TODO Cache this
        result = db.session.query(DMISData.data_source).distinct().all()

        data_sources = [r for r, in result]
        return data_sources

    @staticmethod
    def get_latest_json_data_for_source(data_source: str) -> str:
        """ Gets the latest JSON data wa have for the supplied data_source"""

        result = db.session.query(DMISData.json_data, DMISData.data_received)\
            .filter(DMISData.data_source == data_source) \
            .order_by(DMISData.data_received.desc()).first()

        current_app.logger.debug(f'Returning datasource {data_source} received date {result.data_received}')

        return json.dumps(result.json_data)

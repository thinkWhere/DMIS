from flask import current_app
from server.models.postgis.dmis_data import DMISData


class DataIngestError(Exception):
    """ Custom Exception to notify callers an error occurred when handling projects """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class DataIngestService:

    @staticmethod
    def process_data(data_source: str, raw_request):
        data_source = data_source.lower()
        dmis_data = DMISData()

        if data_source == 'river-gauge':
            # TODO may want to save to a separate river gauge table in future
            dmis_data.save_json_data(data_source, raw_request.get_json())
        elif data_source == 'hub':
            # TODO more parsing will be needed to understand exactly what type of data is here
            dmis_data.save_json_data(data_source, raw_request.get_json())
        else:
            raise DataIngestError(f'Unknown data source {data_source}')

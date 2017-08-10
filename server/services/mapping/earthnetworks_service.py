import os
from datetime import datetime, timedelta
from operator import itemgetter

import boto3
from flask import current_app
from geojson import Feature, FeatureCollection

class EarthNetworksError(Exception):
    """ Custom Exception to notify callers an error occurred when handling projects """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class EarthNetworksService:

    @staticmethod
    def get_s3_client():
        s3_client = boto3.client('s3',
                                 aws_access_key_id=current_app.config["EARTHNETWORKS_S3_SETTINGS"]["aws_access_key_id"],
                                 aws_secret_access_key=current_app.config["EARTHNETWORKS_S3_SETTINGS"]["aws_secret_access_key"])

        return s3_client

    @staticmethod
    def get_latest_lightning_data():
        # TODO once realtime data flowing use current datetime not canned
        #lightning_filename = EarthNetworksService.get_latest_daily_lighting_filename(datetime.now())

        temp_date = datetime.strptime('20170808', '%Y%m%d')
        file_location = EarthNetworksService.get_latest_daily_lighting_file(temp_date)
        EarthNetworksService.convert_lightning_data_to_geojson(file_location)

    @staticmethod
    def convert_lightning_data_to_geojson(file_location: str):
        with open(file_location, 'r') as f:
            first_line = f.readline()

        iain = first_line

    @staticmethod
    def get_latest_daily_lighting_file(file_date: datetime) -> str:
        """ Gets the name of the supplied dates lightning data """
        # TODO cache for 5 minutes
        file_date_str = file_date.strftime('%Y%m%d')
        bucket_name = current_app.config["EARTHNETWORKS_S3_SETTINGS"]["bucket_name"]

        s3_client = EarthNetworksService.get_s3_client()
        bucket_response = s3_client.list_objects(
            Bucket=bucket_name,
            Prefix=f'earthnetworks/pplnneed_lx_{file_date_str}'
        )

        if 'Contents' not in bucket_response:
            # No contents for today try yesterday, if not tried already
            if file_date.date() == datetime.today().date():
                yesterday = file_date - timedelta(days=1)
                return EarthNetworksService.get_latest_daily_lighting_file(yesterday)
            else:
                raise EarthNetworksError('No lightning data found')

        # Get the latest record
        daily_data = bucket_response['Contents']
        daily_data.sort(key=itemgetter('LastModified'), reverse=True)
        latest_record = daily_data[0]['Key']

        current_app.logger.debug(f'Latest lightning file is: {latest_record}')

        temp_file = os.path.join(os.getcwd(), 'iain-test.csv')

        latest_data = s3_client.download_file(bucket_name, latest_record, temp_file)

        return temp_file

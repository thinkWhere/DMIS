import csv
import os
from datetime import datetime, timedelta
from operator import itemgetter

import boto3
from flask import current_app
from geojson import Feature, FeatureCollection, Point, is_valid, dumps


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
        feature_collection, last_updated = EarthNetworksService.convert_lightning_data_to_geojson(file_location)

        validated_response = is_valid(feature_collection)

        if validated_response['valid'] != 'yes':
            current_app.logger.critical(f'Generated invalid geojson for file: {file_location}')
            raise EarthNetworksError('Generated geojson is invalid')

        return dumps(feature_collection), last_updated

    @staticmethod
    def get_latest_daily_lighting_file(file_date: datetime) -> str:
        """ Gets the name of the supplied dates lightning data """
        # TODO cache for 5 minutes
        # TODO clean up temp file and use temp dir
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

        temp_file = EarthNetworksService.get_ligthning_tempfile_location()
        s3_client.download_file(bucket_name, latest_record, temp_file)

        return temp_file

    @staticmethod
    def get_weather_tempfile_location(lightning_filename: str) - > str:
        temp_file = os.path.join(os.getcwd(), 'weather', latest_record)


    @staticmethod
    def convert_lightning_data_to_geojson(file_location: str):
        with open(file_location, 'r') as f:
            first_line = f.readline()

        if first_line.lower().startswith('no updates since'):
            # There is no lightning data available so return empty feature collection
            empty_point = Point()
            feature = Feature(geometry=empty_point)
            feature_collection = FeatureCollection([feature])
            return feature_collection, first_line

        lightning_data = []
        with open(file_location, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                lightning_data.append(row)

        lightning_features = []
        for bolt in lightning_data:
            bolt_point = Point((float(bolt['Longitude']), float(bolt['Latitude'])))
            bolt_feature = Feature(geometry=bolt_point, properties={"lightningTime": bolt['LightningTime']})
            lightning_features.append(bolt_feature)

        lightning_feature_collection = FeatureCollection(lightning_features)
        return lightning_feature_collection, "Metadata TODO"
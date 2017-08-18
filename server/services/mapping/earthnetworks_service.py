import csv
import os
import time
from pathlib import Path
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
        """ Helper method creates authenticated S3 client to connect with Earthnetworks S3 bucket"""
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

        # Get all files that match the prefix, eg all files for the specified
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
        s3_latest_record = daily_data[0]['Key']
        local_file_name = s3_latest_record.lstrip('earthnetworks/')

        current_app.logger.debug(f'Latest lightning file is: {s3_latest_record}')

        local_lightning_file = EarthNetworksService.get_local_file_location(local_file_name)
        s3_client.download_file(bucket_name, s3_latest_record, local_lightning_file)

        return local_lightning_file

    @staticmethod
    def get_local_file_location(filename: str) -> str:
        """ Return location on server where weather file can be safely downloaded"""
        base_dir = Path(__file__).parents[3]
        weather_dir = os.path.join(base_dir, 'weather')
        current_app.logger.debug(f'Weather dir is {weather_dir}')

        EarthNetworksService.clean_up_weather_dir(weather_dir, 7)
        file_path = os.path.join(weather_dir, filename)
        return file_path

    @staticmethod
    def clean_up_weather_dir(weather_dir: str, days_old: int):
        """ Clean up any files older than 7 days to prevent local weather temp directory filling up """
        clean_date = time.time() - (days_old * 86400)
        for file in os.listdir(weather_dir):
            if file.startswith('test') or file.startswith('README'):
                continue  # Ignore test and doc files
            if os.stat(os.path.join(weather_dir, file)).st_mtime < clean_date:
                os.remove(os.path.join(weather_dir, file))

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
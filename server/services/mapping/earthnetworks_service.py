import csv
import os
import time
from pathlib import Path
from datetime import datetime, timedelta, date
from operator import itemgetter
from typing import Tuple

import boto3
from flask import current_app
from geojson import Feature, FeatureCollection, Point, dumps

from server.models.postgis.dmis_data import DMISData


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
    def get_latest_lightning_data() -> Tuple[str, str]:
        """ Gets latest lightning data from S3 and converts it into a GeoJson feature collection"""
        current_date = datetime.now().date()
        file_location = EarthNetworksService.get_latest_daily_lighting_file(current_date)
        feature_collection, metadata = EarthNetworksService.convert_lightning_data_to_geojson(file_location)
        return dumps(feature_collection), metadata

    @staticmethod
    def get_latest_daily_lighting_file(file_date: date) -> str:
        """ Gets the name of the supplied dates lightning data """
        # TODO cache for 5 minutes
        current_app.logger.debug(f'Retrieving lightning data for {file_date}')

        file_date_str = file_date.strftime('%Y%m%d')
        bucket_name = current_app.config["EARTHNETWORKS_S3_SETTINGS"]["bucket_name"]
        s3_client = EarthNetworksService.get_s3_client()

        # Get all files that match the prefix, eg all files for the specified
        bucket_response = s3_client.list_objects(
            Bucket=bucket_name,
            Prefix=f'earthnetworks/pplnneed2_lx_{file_date_str}'
        )

        if 'Contents' not in bucket_response:
            # No contents for today try yesterday, if not tried already
            if file_date == datetime.now().date():
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
    def convert_lightning_data_to_geojson(file_location: str) -> Tuple[FeatureCollection, str]:
        """ Converts lightning CSV file to GeoJson object, and returns last updated metadata """

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

        if not lightning_feature_collection.is_valid:
            current_app.logger.critical(f'Generated invalid geojson for file: {file_location}')
            raise EarthNetworksError('Generated geojson is invalid')

        # Persist response in database, which will help debugging
        DMISData().save_json_data('earthnetworks_lightning', lightning_feature_collection)

        metadata = EarthNetworksService.get_lightning_file_meta_data(os.path.basename(file_location))

        return lightning_feature_collection, metadata

    @staticmethod
    def get_lightning_file_meta_data(file_name: str) -> str:
        """ Helper function that extracts the datetime the lightning data was captured from the filename"""
        if 'test' in file_name:
            return 'TEST FILE'  # Ensure we can unit test using test files without blowing up

        clean_file_name = file_name.lstrip('2pplnneed_').rstrip('.csv')
        clean_file_name = clean_file_name.lstrip('x_')
        file_date = datetime.strptime(clean_file_name, '%Y%m%d_%H%M%S')
        date_string = file_date.strftime('%d-%b-%Y %H:%M:%S')
        return date_string

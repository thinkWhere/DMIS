import boto3
from datetime import datetime, timedelta
from operator import itemgetter
from flask import current_app


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
        lightning_filename = EarthNetworksService.get_latest_daily_lighting_filename(temp_date)
        iain = lightning_filename

    @staticmethod
    def get_latest_daily_lighting_filename(file_date: datetime) -> str:
        """ Gets the name of the supplied dates lightning data """
        # TODO cache for 5 minutes
        file_date_str = file_date.strftime('%Y%m%d')

        s3_client = EarthNetworksService.get_s3_client()
        bucket_response = s3_client.list_objects(
            Bucket='tw-dmis',
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

        return latest_record

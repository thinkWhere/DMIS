import boto3
from operator import itemgetter
from flask import current_app


class EarthNetworksService:

    @staticmethod
    def get_s3_client():
        s3_client = boto3.client('s3',
                                 aws_access_key_id=current_app.config["EARTHNETWORKS_S3_SETTINGS"]["aws_access_key_id"],
                                 aws_secret_access_key=current_app.config["EARTHNETWORKS_S3_SETTINGS"]["aws_secret_access_key"])

        return s3_client

    @staticmethod
    def get_latest_lightning_data():
        # TODO cache for 5 minutes. will require passing time rounded down to last 5 mins?
        s3_client = EarthNetworksService.get_s3_client()

        bucket_response = s3_client.list_objects(
            Bucket='tw-dmis',
            Prefix='earthnetworks/pplnneed_lx_20170808'
        )

        # Get today's data and sort it by newest first
        daily_data = bucket_response['Contents']
        daily_data.sort(key=itemgetter('LastModified'), reverse=True)
        latest_record = daily_data[0]['Key']

        iain = latest_record
        #iain = sorted(daily_data[], key=itemgetter('LastModified'), reverse=True)


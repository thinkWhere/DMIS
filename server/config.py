import logging
import os


class EnvironmentConfig(object):
    EARTHNETWORKS_S3_SETTINGS = {
        'aws_access_key_id': os.getenv('EN_ACCESS_KEY', None),
        'aws_secret_access_key': os.getenv('EN_SECRET_KEY', None),
        'bucket_name': 'tw-dmis'
    }
    GEOSERVER_URL = 'http://mapcloud-geoserver-staging-lb-823669482.eu-west-1.elb.amazonaws.com/geoserver'
    SECRET_KEY = os.getenv('DMIS_SECRET', None)
    SQLALCHEMY_DATABASE_URI = os.getenv('DMIS_DB', None)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_POOL_SIZE = 5
    SQLALCHEMY_MAX_OVERFLOW = 5


class StagingConfig(EnvironmentConfig):
    LOG_DIR = '/var/log/dmis-logs'
    LOG_LEVEL = logging.DEBUG
    API_DOCS_URL = 'http://dmis-staging.eu-west-1.elasticbeanstalk.com/api-docs/swagger-ui/index.html?url=http://dmis-staging.eu-west-1.elasticbeanstalk.com/api/docs'


class DevConfig(EnvironmentConfig):
    LOG_DIR = 'logs'
    LOG_LEVEL = logging.DEBUG
    API_DOCS_URL = 'http://localhost:5000/api-docs/swagger-ui/index.html?url=http://localhost:5000/api/docs'


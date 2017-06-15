import logging


class EnvironmentConfig(object):
    pass


class StagingConfig(EnvironmentConfig):
    LOG_DIR = '/var/log/dmis-logs'
    LOG_LEVEL = logging.DEBUG
    API_DOCS_URL = 'http://dmis-staging.eu-west-1.elasticbeanstalk.com/api-docs/swagger-ui/index.html?url=http://dmis-staging.eu-west-1.elasticbeanstalk.com/api/docs'


class DevConfig(EnvironmentConfig):
    LOG_DIR = 'logs'
    LOG_LEVEL = logging.DEBUG
    API_DOCS_URL = 'http://localhost:5000/api-docs/swagger-ui/index.html?url=http://localhost:5000/api/docs'


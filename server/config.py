import logging


class EnvironmentConfig(object):
    pass


class ProdConfig(EnvironmentConfig):
    LOG_DIR = '/var/log/dmis-logs'
    LOG_LEVEL = logging.ERROR


class StagingConfig(EnvironmentConfig):
    LOG_DIR = '/var/log/dmis-logs'
    LOG_LEVEL = logging.DEBUG


class DevConfig(EnvironmentConfig):
    LOG_DIR = 'logs'
    LOG_LEVEL = logging.DEBUG
    API_DOCS_URL = 'http://localhost:5000/api-docs/swagger-ui/index.html?url=http://localhost:5000/api/docs'


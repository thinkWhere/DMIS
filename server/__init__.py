import logging
import os
from flask import Flask
from flask_cors import CORS
from flask_restful import Api
from logging.handlers import RotatingFileHandler

app = Flask(__name__)


def bootstrap_app():
    """
    Bootstrap function to initialise the Flask app and config
    :return: Initialised Flask app
    """
    set_config()

    initialise_logger()
    app.logger.info('DMIS App Starting Up, Environment = {0}'.format(get_current_environment()))

    app.logger.debug('Initialising Blueprints')
    from .web import main as main_blueprint
    from .web import swagger as swagger_blueprint

    app.register_blueprint(main_blueprint)
    app.register_blueprint(swagger_blueprint)

    define_flask_restful_routes(app)

    CORS(app)

    return app


def get_current_environment():
    """
    Gets the currently running environment from the OS Env Var
    :return: Current environment, according to the OS Environment
    """
    # default to Dev if config environment var not set
    env = os.getenv('DMIS_ENV', 'Dev')
    return env.capitalize()


def get_current_dynamo_environment():
    """
    If we're running on Dev we still to return Staging as our Dynamo environment, so we don't create unnecessary tables
    :return String for Dynamo Env
    """
    # default to Dev if config environment var not set
    dynamo_env = 'Staging' if get_current_environment() == 'Dev' else get_current_environment()
    return dynamo_env.lower()


def set_config():
    """
    Sets the config for the current environment
    """
    env = get_current_environment()
    app.config.from_object('server.config.{0}Config'.format(env))


def initialise_logger():
    """
    Read environment config then initialise a 2MB rotating log.  Prod Log Level can be reduced to help diagnose Prod
    only issues.
    """

    log_dir = app.config['LOG_DIR']
    log_level = app.config['LOG_LEVEL']

    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    file_handler = RotatingFileHandler(log_dir + '/dmis-app.log', 'a', 2 * 1024 * 1024, 3)
    file_handler.setLevel(log_level)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))

    app.logger.addHandler(file_handler)
    app.logger.setLevel(log_level)


def define_flask_restful_routes(app):
    """
    Define the routes the API exposes using Flask-Restful.  See docs here
    http://flask-restful-cn.readthedocs.org/en/0.3.5/quickstart.html#endpoints
    :param app: The flask app we're initialsing
    """
    app.logger.debug('Initialising API Routes')
    api = Api(app, default_mediatype='application/json')

    from server.api.hello_world_api import HelloWorldAPI
    from server.api.swagger_docs import SwaggerDocs

    api.add_resource(HelloWorldAPI, '/api/hello/<string:yourname>')
    api.add_resource(SwaggerDocs, '/api/docs')

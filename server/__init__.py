import logging
import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy
from logging.handlers import RotatingFileHandler

db = SQLAlchemy()
migrate = Migrate()

# Import all models so that they are registered with SQLAlchemy
from server.models.postgis import user  # noqa


def bootstrap_app(env=None):
    """
    Bootstrap function to initialise the Flask app and config
    :return: Initialised Flask app
    """
    app = Flask(__name__)

    if env is None:
        env = os.getenv('DMIS_ENV', 'Dev')  # default to Dev if config environment var not set

    app.config.from_object(f'server.config.{env}Config')

    initialise_logger(app)
    app.logger.info(f'DMIS App Starting Up, Environment = {env}')

    app.secret_key = app.config['SECRET_KEY']  # Used by various utils for creating entropy

    db.init_app(app)
    migrate.init_app(app, db)

    app.logger.debug('Initialising Blueprints')
    from .web import main as main_blueprint
    from .web import swagger as swagger_blueprint
    from .web import km as km_blueprint
    app.register_blueprint(main_blueprint)
    app.register_blueprint(swagger_blueprint)
    app.register_blueprint(km_blueprint)

    define_flask_restful_routes(app)

    CORS(app)  # Enables CORS on all API routes making API callable from anywhere

    return app


def initialise_logger(app):
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

    from server.api.layer_api import LayerTocAPI
    from server.api.user_api import LoginAPI, UserAPI
    from server.api.swagger_docs import SwaggerDocs

    #api.add_resource(LayerListAPI,  '/api/layer')
    api.add_resource(LayerTocAPI,   '/api/layer/toc/<string:map_category>')
    api.add_resource(UserAPI,       '/api/user')
    api.add_resource(LoginAPI,      '/api/user/login')
    api.add_resource(SwaggerDocs,   '/api/docs')

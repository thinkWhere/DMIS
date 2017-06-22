from flask import Blueprint

swagger = Blueprint('swagger', __name__, static_folder='static/swagger-ui', url_prefix='/api-docs')
km = Blueprint('km', __name__, static_folder='static/dist/khm', url_prefix='/km')
main = Blueprint('main', __name__, static_folder='static/dist/en', template_folder='templates')

from . import controller

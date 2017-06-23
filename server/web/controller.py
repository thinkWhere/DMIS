from flask import send_from_directory, render_template, current_app
from . import main, km
import glob
import os


@main.route('/assets/<path:path>')
def assets(path):
    """
    Route for returning any files contained in the assets dir
    :param path: Path to the file the browser is requesting
    :return: The requested file
    """
    #return send_from_directory(main.static_folder, 'assets/' + path)


@main.route('/api-docs')
def api():
    """
    Route for API Docs welcome page
    """
    api_url = current_app.config['API_DOCS_URL']
    return render_template('welcome.html', doc_link=api_url)


@km.route('/', defaults={'path': 'index.html'})
@km.route('/<path:path>')
def km_default(path):
    """
    Default route for all other requests not handled above, which basically hands off to Angular to handle the routing
    """
    #if '.' in path:
    #    return cambodia.send_static_file(path)

    current_app.logger.debug(f'KM Calling {path}')
    return km.send_static_file('index.html')


@main.route('/', defaults={'path': 'index.html'})
@main.route('/<path:path>')
def default(path):
    """
    Default route for all other requests not handled above, which basically hands off to Angular to handle the routing
    """
    # if '.' in path:
    #     return main.send_static_file(path)

    location = os.path.join(os.path.dirname(__file__), 'static/dist/en/*')
    current_app.logger.debug(glob.glob(location))

    current_app.logger.debug(f'MAIN Calling {path}')
    return main.send_static_file('index.html')
    #return main.send_static_file('index.html')

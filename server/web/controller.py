from flask import send_from_directory, render_template, current_app
from . import main, km


@main.route('/assets/<path:path>')
def assets(path):
    """
    Route for returning any files contained in the assets dir
    :param path: Path to the file the browser is requesting
    :return: The requested file
    """
    return send_from_directory(main.static_folder, 'assets/' + path)


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
    # NOTE - You won't be able to test this locally, this route will only work on Production as the necessary
    # static files are served by uWSGI
    return km.send_static_file('index.html')


@main.route('/', defaults={'path': 'index.html'})
@main.route('/<path:path>')
def default(path):
    """
    Default route for all other requests not handled above, which basically hands off to Angular to handle the routing
    """
    if '.' in path:
        current_app.logger.warning('Request for file should only happen on local Dev, check uWSGI config')
        return main.send_static_file(path)

    return main.send_static_file('index.html')

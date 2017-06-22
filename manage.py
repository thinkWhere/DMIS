from base64 import b64encode
from flask_migrate import MigrateCommand
from flask_script import Manager

from server import bootstrap_app
from server.services.users.authentication_service import AuthenticationService

application = bootstrap_app()  # Initialise the flask app.
manager = Manager(application)

# Enable db migrations to be run via the command line
manager.add_command('db', MigrateCommand)


@manager.option('-p', '--password')
@manager.option('-u', '--username')
def gen_basic(username: str, password: str):
    """ Helper method for generating valid base64 encoded session tokens """
    token_string = f'{username}:{password}'
    basic_token = b64encode(token_string.encode('ascii'))
    print(f"Basic {basic_token.decode('ascii')}")


@manager.option('-u', '--user_id', help='Test User ID')
def gen_token(user_id):
    """ Helper method for generating valid base64 encoded session tokens """
    token = AuthenticationService.generate_timed_token(user_id)
    print(f"Bearer {token}")


if __name__ == '__main__':
    manager.run()

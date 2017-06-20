from base64 import b64encode
from flask_migrate import MigrateCommand
from flask_script import Manager

from server import bootstrap_app

application = bootstrap_app()  # Initialise the flask app.
manager = Manager(application)

# Enable db migrations to be run via the command line
manager.add_command('db', MigrateCommand)


@manager.option('-p', '--password')
@manager.option('-u', '--username')
def gen_basic(username: str, password: str):
    """ Helper method for generating valid base64 encoded session tokens """
    print(username)
    print(password)

    token_string = f'{username}:{password}'

    basic_token = b64encode(token_string.encode('ascii'))
    print(f"Basic {basic_token.decode('ascii')}")

    # auth_header = {
    #     'Authorization': 'Basic %s' % b64encode(b'success@simulator.amazonses.com:Secret123!').decode("ascii")
    # }
    # token = AuthenticationService.generate_session_token_for_user(user_id)
    # print(f'Raw token is: {token}')
    # b64_token = base64.b64encode(token.encode())
    # print(f'Your base64 encoded session token: {b64_token}')


if __name__ == '__main__':
    manager.run()

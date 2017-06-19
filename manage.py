from flask_migrate import MigrateCommand
from flask_script import Manager
from server import bootstrap_app

application = bootstrap_app()  # Initialise the flask app.
manager = Manager(application)

# Enable db migrations to be run via the command line
manager.add_command('db', MigrateCommand)

if __name__ == '__main__':
    manager.run()

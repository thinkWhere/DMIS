# DMIS
Disaster Management Information Service

## Getting Started

The DMIS application is split into a client and server structure.  The client can be run independently of the server code to make front-end development easier.

### Dependencies

#### Python 3.5

You need to have Python 3.5 installed in your development environment.  [Python 3 install instructions are here](https://thinkwhere.atlassian.net/wiki/display/DEV/HOWTO+-+Install+Python+3+on+Windows)

#### NodeJS

You must have nodejs installed to develop and run the app, locally.  [Get install from here](https://nodejs.org/en/)

With node installed use npm to install the following globally:

```
npm install gulp -g
```

### Getting Started with Server Development

All server development is done with Python

#### Set-up development environment
To develop on the application:

* Clone the repo and ```cd``` into the british-library-app directory
* Enter the following to create a [Virtual Environment](https://docs.python.org/3/library/venv.html#venv-def) to install the app dependencies into
    * ```pyvenv venv``` or
    * ```C:\Program Files (x86)\Python35-32\Tools\scripts\pyvenv.py venv``` (on Windows if command above does not work, or add to windows path)
* Once the venv directory has been created, you need to activate the Virtual Environment, as follows:
    * ```.\venv\scripts\activate```
* **WINDOWS ONLY** - To install on Windows you need to run the installer as follows:
    * ```.\bin\win\install.bat```
* **LINUX ONLY** - To install on Linxu use pip to install all dependencies
    * ```pip install -r requirements.txt```
* 
    
#### Running locally

* Before running you'll need to create a distribution of the client code, that we'll use Flask to serve.  This is done via gulp in from the client directory:
    * ```cd client```
    * ```gulp build-staging```
* Once the distribution has been built, you can run the app from the command line, ensure you have installed all dependencies, as described above, then:
    * ```python manage.py runserver -d```
* To see the app running, point your browser to [http://localhost:5000/](http://localhost:5000/)


### Getting Started with Client Development

### Set-Up

From the command line navigate to the root client directory and run npm install:

```
cd client
npm install
```

### Running the app

To run the app you need to first start the API, so you will need to follow the Server development instructions above.

In a terminal tab in Pycharm from the root of the application you can run:

```
python manage.py runserver -d --threaded
```

You can then run the application, using gulp as follows.  cd to /client. 

```
gulp run
```

### Testing the app

The app contains both Unit tests and E2E tests

#### Karma unit tests

To run the tests from the command line, navigate to the root client directory and run karma:

```
cd client
karma start ..\tests\client\karma.conf.js
```

#### Behave E2E tests

To run Behave

Start virtual environment:
```
.venv\scripts\activate
```
Run Behave:
```
behave tests\behave
```
To run local host, change the URL in tests.behave.steps.steps_helper and run threaded:
```
python manage.py runserver -d --threaded
```

## Dev Ops

The DMIS app is deployed to AWS within a Docker container.  It is possible to run and test the app locally within a docker container, as follows: 

* Build a new version of the container as follows:
    *  ```docker build -t dmis .```
* Run the container, as follows:
    * ```docker run -d -p 8080:8000 dmis```

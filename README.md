# DMIS
Disaster Management Information Service

## Getting Started

The DMIS application is split into a client and server structure.  The client can be run independently of the server code to make front-end development easier.

### Dependencies

#### Python 3.5 / 3.6

You need to have Python 3.5 / 3.6 installed in your development environment.  [Python 3 install instructions are here](https://thinkwhere.atlassian.net/wiki/display/DEV/HOWTO+-+Install+Python+3+on+Windows)

#### NodeJS

You must have nodejs installed to develop and run the app, locally.  [Get install from here](https://nodejs.org/en/)

With node installed use npm to install the following globally:

```
npm install gulp -g
```

Verify that you are running at least node 6.9.x and npm 3.x.x by running node -v and npm -v in a terminal/console window. Older versions produce errors, but newer versions are fine.

### Getting Started with Server Development

All server development is done with Python

#### Set-up development environment
To develop on the application:

* Clone the repo and ```cd``` into the dmis-app directory
* Enter the following to create a [Virtual Environment](https://docs.python.org/3/library/venv.html#venv-def) to install the app dependencies into
    * ```pyvenv venv``` or
    * ```C:\Program Files (x86)\Python35-32\Tools\scripts\pyvenv.py venv``` (on Windows if command above does not work, or add to windows path)
* Once the venv directory has been created, you need to activate the Virtual Environment, as follows:
    * ```.\venv\scripts\activate```
* **WINDOWS ONLY** - To install on Windows you need to run the installer as follows:
    * ```.\bin\win\install.bat```
* **LINUX ONLY** - To install on Linux use pip to install all dependencies
    * ```pip install -r requirements.txt```
* 
    
#### Running locally

TODO


### Getting Started with Client Development

### Set-Up

From the command line navigate to the root client directory and run npm install:

```
cd client
npm install
```

### Running the app

#### DMIS Angular Client

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.1.1.

#### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

#### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|module`.

#### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

#### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

#### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

#### Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

### Testing the app

TODO

## Dev Ops

The DMIS app is deployed to AWS within a Docker container.  It is possible to run and test the app locally within a docker container, as follows: 

* Build a new version of the container as follows:
    *  ```docker build -t dmis .```
* Run the container, as follows:
    * ```docker run -d -p 8080:8000 dmis```

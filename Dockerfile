FROM python:3.6

RUN apt-get update
RUN apt-get upgrade -y

# Add and install Python modules.  Note additional uwsgi install, required as not windows compatible
ADD requirements.txt /src/requirements.txt
RUN cd /src; pip install -r requirements.txt; pip install uwsgi

ADD . /src

# Expose
EXPOSE 8000

# uWSGI used to serve Flask app, configuration loaded from ini file
CMD cd /src; uwsgi --ini dmis_uwsgi.ini
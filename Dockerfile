FROM python:3.6

RUN apt-get update
RUN apt-get upgrade -y

# Add and install Python modules
ADD requirements.txt /src/requirements.txt
RUN cd /src; pip install -r requirements.txt

ADD . /src

# Expose
EXPOSE 8000

# Gunicorn configured for single-core machine, if more cores available increase workers using formula ((cores x 2) + 1))
CMD cd /src; gunicorn -b 0.0.0.0:8000 -w 3 --timeout 59 manage:application
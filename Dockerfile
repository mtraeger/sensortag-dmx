FROM node:latest
MAINTAINER Michael Traeger

RUN mkdir /opt/dmx
WORKDIR /opt/dmx

RUN apt-get update -y && apt-get install -y bluetooth bluez libbluetooth-dev libudev-dev
#TODO install python 2.7?, make?, gcc?
RUN npm install -g node-gyp


RUN npm install artnet sensortag

ADD dmx.js ./

CMD ["node", "dmx.js"]



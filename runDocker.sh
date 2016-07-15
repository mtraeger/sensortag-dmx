#!/bin/bash

locationOfScript=$(dirname "$(readlink --canonicalize-existing "$0")")

sudo docker run --interactive=true --tty=true --volume=$locationOfScript:/opt/dmx/ artnet-dmx 
#sudo docker run --interactive=true --tty=true --publish=8080:8080 artnet-dmx

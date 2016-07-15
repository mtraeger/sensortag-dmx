#!/bin/bash

sudo docker build --tag="artnet-dmx" . #1> ./dockerBuild.log 2>./dockerBuildErr.log


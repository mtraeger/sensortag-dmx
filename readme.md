# Sensortag DMX

Control your DMX light with a TI Sensortag. 


## Hardware Info

Developed with TI CC2541 SensorTag Dev Kit via sensortag node library.


## Hints

Maybe replace bluetooth-hci-socket directory in node_modules by @abandonware/bluetooth-hci-socket -> copy their directory to root of node_modules if installation of original bluetooth-hci-socket dependency fails... 

Or use older node version with e.g. docker (node 8 should work maybe)


Run scripts as root on linux...


## Node-DMX Versions
For node-dmx versions, you can use the dmx-web.conf configuration files to send the values to all configured devices. 
See e.g. https://github.com/mtraeger/dmx-webcontrol. 
Relevant part is the universes section. The other objects can be omitted. 

The standalone versions only send to channels 1-4 where 1 is the dimmer channel and 2-4 are RGB. 

## First run

You can test the node-dmx versions on your computer by running https://github.com/mtraeger/artnet-weblight on localhost. 
For viewing the result open http://localhost:3000/0 or http://localhost:3000/frames. 

After starting artnet-weblight, start your desired node-dmx script and press the connect button of your sensortag device. 

## Links

* https://www.npmjs.com/package/@abandonware/bluetooth-hci-socket
* old: https://github.com/noble/node-bluetooth-hci-socket/tree/master
* https://github.com/abandonware/node-bluetooth-hci-socket
* https://www.npmjs.com/package/sensortag
* https://github.com/noble/noble#prerequisites
* https://github.com/nodejs/node-gyp#installation
* https://github.com/sandeepmistry/node-sensortag 
* 



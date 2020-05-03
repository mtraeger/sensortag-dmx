const fs = require('fs')
const DMX = require('dmx')

// patch dmx library with custom devices
DMX.devices = require('./node-dmx-custom-devices')


class DMXWrapper {

    constructor(config) {
        this._dmx = new DMX()
        this._updateRate = 100 //in ms
        this._config = config
    }

    get dmx() {
        return this._dmx;
    }

    setUpdateRate(milliseconds) {
        this._updateRate = milliseconds
    }

    static readConfig(path) {
        return JSON.parse(fs.readFileSync(path, 'utf8'))
    }

    loadConfigPresetsAndSetup() {
        for (const universe in this._config.universes) {
            this._dmx.addUniverse(
                universe,
                this._config.universes[universe].output.driver,
                this._config.universes[universe].output.device,
                this._config.universes[universe].output.options
            )

            //preset values //TODO requires modified devices.js of dmx!
            //TODO wrapper class? or devices to config file?
            // for (const device in this._config.universes[universe].devices) {
            //     const dev = this._config.universes[universe].devices[device];
            //     if (DMX.devices[dev.type].hasOwnProperty("channelPresets")) {
            //         const presets = DMX.devices[dev.type].channelPresets;
            //         const toUpdate = {};
            //         for (const devStart in presets) {
            //             toUpdate[parseInt(devStart) + dev.address] = presets[devStart];
            //         }
            //         this._dmx.update(universe, toUpdate);
            //     }
            // }

            const toUpdate = {};
            for (const device in this._config.universes[universe].devices) {
                const dev = this._config.universes[universe].devices[device];
                const deviceType = DMX.devices[dev.type];

                const dimmerPosition = deviceType.channels.indexOf('dimmer');
                if (dimmerPosition >= 0) {
                    toUpdate[dimmerPosition + dev.address] = 255;
                }

            }
            this._dmx.update(universe, toUpdate);
        }
    }

    /**
     * Update all devices, values from 0 to 255
     *
     * @param red
     * @param green
     * @param blue
     * @param updateCallback with toUpdate objact and universe string
     */
    updateAllDevices(red, green, blue, updateCallback) {
        const defaultUpdateCallback = (toUpdate, universe) =>
            this._dmx.update(universe, toUpdate);

        updateCallback = updateCallback || defaultUpdateCallback

        for (const universe in this._config.universes) {
            const toUpdate = {};
            for (const device in this._config.universes[universe].devices) {
                const dev = this._config.universes[universe].devices[device];
                const deviceType = DMX.devices[dev.type];

                const redPosition = deviceType.channels.indexOf('red');
                if (redPosition >= 0) {
                    toUpdate[redPosition + dev.address] = red;
                }

                const greenPosition = deviceType.channels.indexOf('green');
                if (redPosition >= 0) {
                    toUpdate[greenPosition + dev.address] = green;
                }

                const bluePosition = deviceType.channels.indexOf('blue');
                if (redPosition >= 0) {
                    toUpdate[bluePosition + dev.address] = blue;
                }
            }
            updateCallback(toUpdate, universe);
        }
    }

    updateAllDevicesSoft(red, green, blue) {
        const callback = (toUpdate, universe) =>
            new this._dmx.animation().add(toUpdate, this._updateRate).run(this._dmx.universes[universe])

        this.updateAllDevices(red, green, blue, callback);
    }

    // TODO does not work well right now
    // updateAllDevicesHttp(red, green, blue) {
    //     const http = require('http');
    //     const callback = (toUpdate, universe) => {
    //         const data = JSON.stringify([{"to": toUpdate, duration: this._updateRate}]);
    //         const options = {
    //             hostname: 'localhost',
    //             port: 8080,
    //             path: '/animation/' + universe,
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Content-Length': data.length
    //             }
    //         }
    //         const request = http.request(options);
    //         request.write(data);
    //         request.end();
    //     }
    //     this.updateAllDevices(red, green, blue, callback);
    // }

}

module.exports = DMXWrapper

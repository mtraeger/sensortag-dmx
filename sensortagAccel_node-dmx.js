const fs = require('fs')
const DMX = require('dmx')
const program = require('commander');
const SensorTag = require('sensortag');

// patch dmx library with custom devices
DMX.devices = require('./node-dmx-custom-devices')


//run as root for BLE
console.log("Running DMX Sensortag Acceleration")

program
    .version("0.0.1")
    .option('-c, --config <file>', 'Read config from file [./dmx-web.conf]', './dmx-web.conf')
    .parse(process.argv)

const config = JSON.parse(fs.readFileSync(program.config, 'utf8'))

class DMXWrapper {

    constructor() {
        this._dmx = new DMX()
        this._updateRate = 100 //in ms
    }

    get dmx() {
        return this._dmx;
    }

    loadConfigPresetsAndSetup() {
        for (const universe in config.universes) {
            this._dmx.addUniverse(
                universe,
                config.universes[universe].output.driver,
                config.universes[universe].output.device,
                config.universes[universe].output.options
            )

            //preset values //TODO requires modified devices.js of dmx!
            //TODO wrapper class? or devices to config file?
            // for (const device in config.universes[universe].devices) {
            //     const dev = config.universes[universe].devices[device];
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
            for (const device in config.universes[universe].devices) {
                const dev = config.universes[universe].devices[device];
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

        for (const universe in config.universes) {
            const toUpdate = {};
            for (const device in config.universes[universe].devices) {
                const dev = config.universes[universe].devices[device];
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

class SensortagDMX {
    constructor(tag, dmxWrapper) {
        this._tag = tag;
        this._dmxWrapper = dmxWrapper;
        this._srategy = new ColorAxisStrategy(this._dmxWrapper);
        this._updateRate = this._dmxWrapper._updateRate || 100
    }

    start() {
        console.log('Connected! Now starting SetUp of Sensor.')

        this._tag.on('disconnect', () => this._onDisconnect());
        this._tag.connectAndSetUp(() => this._setUpSensors());
    }

    _setUpSensors() {
        this._tag.enableAccelerometer();
        this._tag.setAccelerometerPeriod(this._updateRate);
        this._tag.notifyAccelerometer();
        this._tag.notifySimpleKey();

        this._tag.on('accelerometerChange', (x, y, z) => {
            console.log({
                x: x.toFixed(1) + ' G',
                y: y.toFixed(1) + ' G',
                z: z.toFixed(1) + ' G',
            });

            this._srategy.call(x, y, z);
        });

        this._tag.on('simpleKeyChange', (left, right) => {
            if (left && right) {
                console.log('Both: ');
                return
            }
            if (left) {
                console.log('Coloraxis: ' + left);
                this._srategy = new ColorAxisStrategy(this._dmxWrapper);
            }
            if (right) {
                console.log('Strobo: ' + right);
                this._srategy = new StroboStrategy(this._dmxWrapper);
            }

        });

    }

    async _onDisconnect() {
        console.log('disconnected!');
        this._dmxWrapper.updateAllDevices(0, 0, 0)
        await new Promise(r => setTimeout(r, 2000))
        process.exit(0); // TODO required?
        // TODO maybe allow reconnecting?
    }
}

class Strategy {
    constructor(dmxWrapper) {
        this._dmxWrapper = dmxWrapper;
    }

    call(x, y, z) {
        console.log('Please Choose Strategy.')
    }
}

class ColorAxisStrategy extends Strategy {
    constructor(dmxWrapper) {
        super(dmxWrapper);
        //TODO add var to choose between 10 or 4 range
    }

    call(x, y, z) {
        this._dmxWrapper.updateAllDevicesSoft(
            this._processValue(x),
            this._processValue(y),
            this._processValue(z)
        );
    }

    _processValue(val) {
        return this._convertRange(Math.abs(val), [0, 10], [0, 255]);
    }

    _convertRange(value, r1, r2) {
        return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
    }
}

class StroboStrategy extends Strategy {
    constructor(dmxWrapper) {
        super(dmxWrapper);
        this._strobo_on = false;
    }

    call(x, y, z) {
        const strobo = Math.abs(x) + Math.abs(y) + Math.abs(z) - 4;
        if (Math.abs(strobo) > 5) {
            console.log(strobo)
            this._toggleStrobo();
        }
    }

    _toggleStrobo() {
        if (this._strobo_on) {
            this._dmxWrapper.updateAllDevices(255, 255, 255);
            this._strobo_on = false;
        } else {
            this._dmxWrapper.updateAllDevices(0, 0, 0);
            this._strobo_on = true;
        }
    }
}


const dmxWrapper = new DMXWrapper();
// dmxWrapper.dmx.on('update', console.log);
dmxWrapper.loadConfigPresetsAndSetup()
console.log('starting discovery - running as root?')

SensorTag.discover(function (tag) {
    new SensortagDMX(tag, dmxWrapper).start();
});


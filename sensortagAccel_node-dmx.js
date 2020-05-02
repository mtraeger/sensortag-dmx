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
     */
    updateAllDevices(red, green, blue) {
        for (const universe in config.universes) {
            for (const device in config.universes[universe].devices) {
                const toUpdate = {};
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
                this._dmx.update(universe, toUpdate);
                //TODO alternative: use dmx.animation and add new value every second
                //TODO use dmx-web rest interface
            }
        }
    }

}

class SensortagDMX {

    constructor(tag, dmxWrapper) {
        this._tag = tag;
        this._dmx_wrapper = dmxWrapper;
        this._mode = 'coloraxis';
        this._strobo_on = false;
    }

    start() {
        console.log('Connected! Now starting SetUp of Sensor.')

        this._tag.on('disconnect', () => this._onDisconnect());
        this._tag.connectAndSetUp(() => this._setUpSensors());
    }

    _setUpSensors() {
        this._tag.enableAccelerometer();
        this._tag.setAccelerometerPeriod(100);
        this._tag.notifyAccelerometer();
        this._tag.notifySimpleKey();

        this._tag.on('accelerometerChange', (x, y, z) => {
            console.log('\tx = %d G', x.toFixed(1));
            console.log('\ty = %d G', y.toFixed(1));
            console.log('\tz = %d G', z.toFixed(1));
            this._chooseStrategy(x, y, z);
        });

        this._tag.on('simpleKeyChange', (left, right) => {
            if (left && right) {
                console.log('Both: ');
                return
            }
            if (left) {
                console.log('Coloraxis: ' + left);
                this._mode = 'coloraxis';
            }
            if (right) {
                console.log('Strobo: ' + right);
                this._mode = 'strobo';
            }

        });

    }

    _chooseStrategy(x, y, z) {
        if (this._mode === 'coloraxis') {
            this._dmx_wrapper.updateAllDevices(this._processValue(x), this._processValue(y), this._processValue(z));

        } else if (this._mode === 'strobo') {
            const strobo = Math.abs(x) + Math.abs(y) + Math.abs(z) - 4;
            if (Math.abs(strobo) > 5) {
                console.log(strobo)
                this._toggleStrobo();
            }
        }
    }

    _toggleStrobo() {
        if (this._strobo_on) {
            this._dmx_wrapper.updateAllDevices(255, 255, 255);
            this._strobo_on = false;
        } else {
            this._dmx_wrapper.updateAllDevices(0, 0, 0);
            this._strobo_on = true;
        }
    }

    _processValue(val) {
        return this._convertRange(Math.abs(val), [0, 10], [0, 255]);
    }

    _convertRange(value, r1, r2) {
        return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
    }

    async _onDisconnect() {
        console.log('disconnected!');
        this._dmx_wrapper.updateAllDevices(0, 0, 0)
        await new Promise(r => setTimeout(r, 2000))
        process.exit(0); // TODO required?
        // TODO maybe allow reconnecting?
    }
}

const dmxWrapper = new DMXWrapper();
// dmxWrapper.dmx.on('update', console.log);
dmxWrapper.loadConfigPresetsAndSetup()
console.log('starting discovery - running as root?')

SensorTag.discover(function (tag) {
    new SensortagDMX(tag, dmxWrapper).start();
});


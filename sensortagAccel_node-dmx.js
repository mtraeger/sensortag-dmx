const fs = require('fs')
const DMX = require('dmx')
const program = require('commander');
const SensorTag = require('sensortag');


//run as root for BLE
console.log("Running Artnet Sensortag Example")

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
            }
        }
    }

}

class SensortagDMX {

    constructor(dmxWrapper) {
        this._dmx_wrapper = dmxWrapper;
    }

    start(tag) {
        console.log('connected!')

        tag.on('disconnect', () => this.onDisconnect());

        // TODO tmp
        var self = this;

        var mode = 'coloraxis';

        function connectAndSetUpMe() {			// attempt to connect to the tag
            console.log('connectAndSetUp');
            tag.connectAndSetUp(enableAccelMe);		// when you connect and device is setup, call enableAccelMe
        }

        function enableAccelMe() {		// attempt to enable the accelerometer
            console.log('enableAccelerometer');
            // when you enable the accelerometer, start accelerometer notifications:
            tag.enableAccelerometer(notifyMe);
            tag.setAccelerometerPeriod(100);
        }

        function notifyMe() {
            tag.notifyAccelerometer(listenForAcc);   	// start the accelerometer listener
            tag.notifySimpleKey(listenForButton);		// start the button listener
        }

        // When you get an accelermeter change, print it out:
        function listenForAcc() {
            tag.on('accelerometerChange', function (x, y, z) {
                console.log('\tx = %d G', x.toFixed(1));
                console.log('\ty = %d G', y.toFixed(1));
                console.log('\tz = %d G', z.toFixed(1));
                chooseStrategy(x, y, z);
            });
        }

        function chooseStrategy(x, y, z) {
            var oldStrobo = 0;
            if (mode == 'coloraxis') {
                self._dmx_wrapper.updateAllDevices(processValue(x), processValue(y), processValue(z));
            } else if (mode == 'strobo') {
                var strobo = Math.abs(x) + Math.abs(y) + Math.abs(z) - 4;
                if (Math.abs(oldStrobo - strobo) > 5) {
                    console.log(strobo)
                    toggleStrobo();
                }
                oldStrobo = strobo;
            }
        }

        var toggle = true;

        function toggleStrobo() {
            if (toggle) {
                self._dmx_wrapper.updateAllDevices(255, 255, 255);
                toggle = false;
            } else {
                self._dmx_wrapper.updateAllDevices(0, 0, 0);
                toggle = true;
            }
        }

        function processValue(val) {
            return convertRange(Math.abs(val), [0, 10], [0, 255]);
        }

        function convertRange(value, r1, r2) {
            return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
        }

        // when you get a button change, print it out:
        function listenForButton() {
            tag.on('simpleKeyChange', function (left, right) {
                if (left) {
                    console.log('Coloraxis: ' + left);
                    mode = 'coloraxis';
                }
                if (right) {
                    console.log('Strobo: ' + right);
                    mode = 'strobo';
                }
                if (left && right) {
                    console.log('Both: ');
                }
            });
        }

        // Now that you've defined all the functions, start the process:
        connectAndSetUpMe();

    }

    async onDisconnect() {
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
const app = new SensortagDMX(dmxWrapper);
console.log('starting discovery - running as root?')

SensorTag.discover(function (tag) {
    app.start(tag);
});


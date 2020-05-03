const DmxWrapper = require('./node-dmx-wrapper')
const program = require('commander');
const SensorTag = require('sensortag');


//run as root for BLE
console.log("Running DMX Sensortag Acceleration")

program
    .version("0.0.1")
    .option('-c, --config <file>', 'Read config from file [./dmx-web.conf]', './dmx-web.conf')
    .parse(process.argv)

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


const dmxWrapper = new DmxWrapper(DmxWrapper.readConfig(program.config));
// dmxWrapper.dmx.on('update', console.log);
dmxWrapper.loadConfigPresetsAndSetup();
console.log('starting discovery - running as root?')

SensorTag.discover(function (tag) {
    new SensortagDMX(tag, dmxWrapper).start();
});

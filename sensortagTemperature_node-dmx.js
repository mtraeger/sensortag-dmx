const DmxWrapper = require('./node-dmx-wrapper')
const program = require('commander');
const SensorTag = require('sensortag');


//run as root for BLE
console.log("Running DMX Sensortag Temperature")

program
    .version("0.0.1")
    .option('-c, --config <file>', 'Read config from file [./dmx-web.conf]', './dmx-web.conf')
    .parse(process.argv)

class SensortagDMX {
    constructor(tag, dmxWrapper) {
        this._tag = tag;
        this._dmxWrapper = dmxWrapper;
        this._srategy = new IRTemperatureStrategy(this._dmxWrapper);
        this._updateRate = 500
        this._dmxWrapper.setUpdateRate(this._updateRate)
    }

    start() {
        console.log('Connected! Now starting SetUp of Sensor.')

        this._tag.on('disconnect', () => this._onDisconnect());
        this._tag.connectAndSetUp(() => this._setUpSensors());
    }

    _setUpSensors() {
        this._tag.enableIrTemperature();
        // this._tag.setIrTemperaturePeriod(this._updateRate);
        this._tag.notifyIrTemperature();
        this._tag.notifySimpleKey();

        this._tag.on('irTemperatureChange', (objectTemp, ambientTemp) => {
            console.log('\tObject Temp = %d deg. C', objectTemp.toFixed(1));
            console.log('\tAmbient Temp = %d deg. C', ambientTemp.toFixed(1));

            this._srategy.call(objectTemp, ambientTemp);
        });

        this._tag.on('simpleKeyChange', (left, right) => {
            if (left && right) {
                console.log('Both: ');
                return
            }
            if (left) {
                console.log('IRTemp: ' + left);
                this._srategy = new IRTemperatureStrategy(this._dmxWrapper);
            }
            if (right) {
                console.log('Temp: ' + right);
                this._srategy = new AmbientTemperatureStrategy(this._dmxWrapper);
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

    call(objectTemp, ambientTemp) {
        console.log('Please Choose Strategy.')
    }
}

class TemperatureStrategy extends Strategy {
    constructor(dmxWrapper) {
        super(dmxWrapper);
        this._tempMax = 40;
        this._tempMin = 0;
    }

    call(objectTemp, ambientTemp) {
        console.log('Please Choose Strategy.')
    }

    execute(temperature) {

        console.log("Red: %s", this._processValue(temperature));
        console.log("Blue: %s", 200 - this._processValue(temperature));

        this._dmxWrapper.updateAllDevicesSoft(
            parseInt(this._processValue(temperature)),
            0,
            this._lowerblue(temperature)
        );
    }

    _lowerblue(temperature) {
        const val = 200 - parseInt(this._processValue(temperature));
        if (val < 0) {
            return 0;
        } else {
            return val;
        }
    }

    _processValue(val) {
        if (val < this._tempMin) {
            console.log("Value out of Range!!! - To low")
            return 0;
        } else if (val > this._tempMax) {
            console.log("Value out of Range!!! - To High")
            return 255;
        } else {
            return this._convertRange(Math.abs(val), [this._tempMin, this._tempMax], [0, 255])
                .toFixed(0);
        }
    }

    _convertRange(value, r1, r2) {
        return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
    }
}

class IRTemperatureStrategy extends TemperatureStrategy {
    call(objectTemp, ambientTemp) {
        super.execute(objectTemp)
    }
}

class AmbientTemperatureStrategy extends TemperatureStrategy {
    call(objectTemp, ambientTemp) {
        super.execute(ambientTemp)
    }
}

const dmxWrapper = new DmxWrapper(DmxWrapper.readConfig(program.config));
// dmxWrapper.dmx.on('update', console.log);
dmxWrapper.loadConfigPresetsAndSetup();
console.log('starting discovery - running as root?')

SensorTag.discover(function (tag) {
    new SensortagDMX(tag, dmxWrapper).start();
});

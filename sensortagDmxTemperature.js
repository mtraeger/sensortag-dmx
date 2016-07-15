console.log("Running Artnet Sensortag Example")

var options = {
    host: '192.168.1.10',
    refresh: '40000'
}
var artnet = require('artnet')(options);
var SensorTag = require('sensortag');

artnet.set(1, 255);


// listen for tags:
SensorTag.discover(function (tag) {
    // when you disconnect from a tag, exit the program:
    tag.on('disconnect', function () {
        console.log('disconnected!');
        artnet.set([0, 0, 0, 0], function (err, res) {
            artnet.close();
            process.exit(0);
        });
    });

    function connectAndSetUpMe() {			// attempt to connect to the tag
        console.log('connectAndSetUp');
        tag.connectAndSetUp(enableIrTempMe);		// when you connect, call enableIrTempMe
    }

    function enableIrTempMe() {		// attempt to enable the IR Temperature sensor
        console.log('enableIRTemperatureSensor');
        // when you enable the IR Temperature sensor, start notifications:
        tag.enableIrTemperature(notifyMe);
        //tag.setIrTemperaturePeriod(100);
    }

    function notifyMe() {
        tag.notifyIrTemperature(listenForTempReading);   	// start the accelerometer listener
        tag.notifySimpleKey(listenForButton);		// start the button listener
    }

    var tempmax = 40;
    var tempmin = 0;

    // When you get an accelermeter change, print it out:
    function listenForTempReading() {
        tag.on('irTemperatureChange', function (objectTemp, ambientTemp) {
            console.log('\tObject Temp = %d deg. C', objectTemp.toFixed(1));
            console.log('\tAmbient Temp = %d deg. C', ambientTemp.toFixed(1));

            function lowerblue() {
                var val = 200 - parseInt(processValue(objectTemp));
                if (val<0) {
                    return 0;
                }else {
                    return val;
                }
            }
            artnet.set(2, [parseInt(processValue(objectTemp)), 0, lowerblue()]);
            console.log(processValue(objectTemp));
            console.log(200 - processValue(objectTemp));
        });
    }

    function processValue(val) {
        if (val < tempmin) {
            console.log("Value out of Range!!! - To low")
            return 0;
        } else if (val > tempmax) {
            console.log("Value out of Range!!! - To High")
            return 255;
        } else {
            return convertRange(Math.abs(val), [tempmin, tempmax], [0, 255]).toFixed(0);
        }

    }

    function convertRange(value, r1, r2) {
        return ( value - r1[0] ) * ( r2[1] - r2[0] ) / ( r1[1] - r1[0] ) + r2[0];
    }

    // when you get a button change, print it out:
    function listenForButton() {
        tag.on('simpleKeyChange', function (left, right) {
            if (left) {
                console.log('left: ' + left);
            }
            if (right) {
                console.log('right: ' + right);
            }
            // if both buttons are pressed, disconnect:
            if (left && right) {
                tag.disconnect();
            }
        });
    }

    // Now that you've defined all the functions, start the process:
    connectAndSetUpMe();
});

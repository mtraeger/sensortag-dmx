//run as root for BLE
console.log("Running Artnet Sensortag Example")

//var options = {
//    host: '192.168.1.10',
//    refresh: '40000'
//}

var options = {
    host: 'localhost',
    refresh: '40000'
}
var artnet = require('artnet')(options);
var SensorTag = require('sensortag');

artnet.set(1, 255);

//setTimeout(function() {
//    artnet.set(2, [255, null, 127]);
//}, 3000);

//artnet.set(2, [255, null, 127]);

//artnet.set([0, 0, 0, 0]);

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
            artnet.set([255, processValue(x), processValue(y), processValue(z)]);
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
            artnet.set([255, 255, 255, 255]);
            toggle = false;
        } else {
            artnet.set([0, 0, 0, 0]);
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
});


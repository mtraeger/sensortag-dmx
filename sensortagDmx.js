//run as root for BLE
console.log("Running Artnet Sensortag Example")

var options = {
    host: '192.168.1.10',
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
        tag.connectAndSetUp(notifyMe);		// when you connect, call notifyMe
    }

    function notifyMe() {
        tag.notifySimpleKey(listenForButton);		// start the button listener
    }

    // when you get a button change, print it out:
    function listenForButton() {
        tag.on('simpleKeyChange', function (left, right) {
            if (left && right) {
                console.log('both');
                artnet.set(2, [255, 0, 0]);
            } else				// if left, send the left key
            if (left) {
                console.log('left: ' + left);
                artnet.set(2, [0, 255, 0]);
            } else if (right) {		// if right, send the right key
                console.log('right: ' + right);
                artnet.set(2, [0, 0, 255]);
            }
        });
    }

    // Now that you've defined all the functions, start the process:
    connectAndSetUpMe();
});
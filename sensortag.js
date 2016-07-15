//run as root for BLE
var SensorTag = require('sensortag');

SensorTag.discover(function (tag) {
    // when you disconnect from a tag, exit the program:
    tag.on('disconnect', function () {
        console.log('disconnected!');
        process.exit(0);
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

            } else				// if left, send the left key
            if (left) {
                console.log('left: ' + left);

            } else if (right) {		// if right, send the right key
                console.log('right: ' + right);

            }
        });
    }

    // Now that you've defined all the functions, start the process:
    connectAndSetUpMe();
});
//run as root for BLE
console.log("Running Artnet Sensortag Example")

var DMX = require('node-dmx')
var A = DMX.Animation

var dmx = new DMX()

var universe = dmx.addUniverse('demo', 'art-net')

var SensorTag = require('sensortag');

universe.update({0:255}) //TODO setting chanel 1 (dimmer of flat-par) to 255 in beginning
//universe.update({8:255})

//attention: chanels starting at 0 !!!

function done() {console.log('DONE')}


SensorTag.discover(function (tag) {
    // when you disconnect from a tag, exit the program:
    tag.on('disconnect', function () {
        console.log('disconnected!');
        var x = new A().add({0: 0, 1:0, 2:0, 3:0},1000).delay(1500); //Delay required because no real callback after finishing available
        x.run(universe, function () {
            universe.close(function () {
                process.exit(0);
            });
        });
    });

    var effects = ['none', 'linear', 'inOutQuad', 'outBounce', 'inQuart', 'outCirc']
    var effectnr = 0;

    var colors = [{1:255, 2:0, 3:0}, {1:0, 2:255, 3:0}, {1:0, 2:0, 3:255}, {1:255, 2:0, 3:255}, {1:255, 2:200, 3:0}, {1:0, 2:255, 3:255}]
    var colornr = 0;

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
                console.log('both: Black');
                if(effects[effectnr] == 'none') {
                    var x = new A().add({0: 255, 1: 0, 2: 0, 3: 0}).run(universe, done);
                }else {
                    var x = new A().add({0: 255, 1: 0, 2: 0, 3: 0}, 3000, effects[effectnr]).run(universe, done);
                }
                return;
            } else				// if left, send the left key
            if (left) {
                if (colornr < colors.length - 1) {
                    colornr++;
                } else {
                    colornr = 0;
                }
                console.log('Color: ' + colornr + " " + left);

                if(effects[effectnr] == 'none') {
                    var x = new A().add(colors[colornr]).run(universe, done);
                }else {
                    var x = new A().add(colors[colornr], 3000, effects[effectnr]).run(universe, done);
                }

            } else if (right) {		// if right, send the right key
                if (effectnr < effects.length - 1) {
                    effectnr++;
                } else {
                    effectnr = 0;
                }
                console.log('EasingMode: ' + effects[effectnr] + " " + right);
            }
        });
    }

    // Now that you've defined all the functions, start the process:
    connectAndSetUpMe();
});

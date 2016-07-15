console.log("Running Artnet DMX Test")

var options = {
    host: '192.168.1.10',
    refresh: '4000'
}
 
var artnet = require('artnet')(options);

artnet.set(1, [255, 20, 30]); 

setTimeout(function() {
    artnet.set(2, [255, null, 127]);
    console.log("send1");
}, 5000);

//artnet.set(2, [255, null, 127]);

//artnet.set([0, 0, 0, 0]);


setTimeout(function() {
    console.log("send close");
    artnet.set([0,0,0,0], function (err, res) {
        artnet.close();
    });
}, 9000);

//artnet.set([0,0,0,0], function (err, res) {
// artnet.close();
//});




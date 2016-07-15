

var options = {
    host: '192.168.1.10'
}
 
var artnet = require('artnet')(options);
 
//// set channel 1 to 255 and disconnect afterwards. 
//artnet.set(1, 255, function (err, res) {
//    artnet.close();
//});

// set channel 1 to 10, channel 2 to 20 and channel 3 to 30 
artnet.set(1, [10, 20, 30]); 


// set channel 2 to 255 and channel 4 to 127 
artnet.set(2, [255, null, 127]);

// Set channel 1 to 255 and channel 2 to 127: 
artnet.set([255, 127]);

//This lib throttles the maximum send rate to ~40Hz. Unchanged data is refreshed every ~4s.
//Options
//    host (Default "255.255.255.255")
//    port (Default 6454)
//    refresh (millisecond interval for sending unchanged data to the Art-Net node. Default 4000)
//    iface (optional string IP address - bind udp socket to specific network interface)

//Methods
//set( [ [ uint15 universe , ] uint9 channel , ] uint8 value [ , function(err, res) callback ] )
//set( [ [ uint15 universe , ] uint9 channel , ] array[uint8] values [ , function(err, res) callback ] )

//Every parameter except the value(s) is optional. If you supply a universe you need to supply the channel also. Defaults: universe = 0, channel = 1

//Callback is called with (error, response) params. If error and response are null data remained unchanged and therefore nothing has been sent.

//close( )
//Closes the connection and stops the send interval.

//artnet.close();

// set channel 1 to 255 and disconnect afterwards. 
artnet.set(1, 255, function (err, res) {
    artnet.close();
});

"use strict"

var DMX = require('node-dmx')
var A = DMX.Animation

var dmx = new DMX()

var universe = dmx.addUniverse('demo', 'art-net')

//universe.update({0: 1, 1: 0})
//universe.update({1: 255, 2:90, 3: 120, 4: 230})

universe.update({0:255}) //TODO setting chanel 1 (dimmer of flat-par) to 255 in beginning
universe.update({8:255})

//attention: chanels starting at 0 !!!

// ###################################################################################
// ## All examples for a single LED par on chanel 1 with dim,r,g,b (4 channel mode) ##
// ###################################################################################


function done() {console.log('DONE')}

var colors = [
	[160, 230, 20],
	[255, 255, 0],
	[110, 255, 10]
];

//var colors = [
//	[160, 230, 20],
//	[255, 255, 0],
//	[110, 255, 10],
//	[30, 100, 200],
//	[10, 50, 250],
//	[10, 10, 250]
//];

function green_water(universe, channels, duration) {
	for(var c in channels) {
		var r = Math.floor((Math.random()*colors.length))
		var u = {}

		for(var i = 0; i < 3; i++) {
			u[channels[c] + i] = colors[r][i]
		}
		new A().add(u, duration).run(universe)
	}
	setTimeout(function() {green_water(universe, channels, duration);}, duration * 2)
}

function warp(universe, channel, min, max, duration) {
	var a = {}, b = {}
	a[channel] = min;
	b[channel] = max;
	new A().add(a, duration).add(b, duration).run(universe, function() {
		warp(universe, channel, min, max, duration)
	})
}

//uncomment a (single) line for an example
//warp(universe, 1, 10, 220, 360)
//green_water(universe, [1], 1000)
green_water(universe, [1,9], 3000)



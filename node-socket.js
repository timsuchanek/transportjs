var socket = 
var constants = require('./constants');
var util   = require('./util');

var myID   = util.getRandomID(constants.HASH_SPACE);
var webrtc = require('./index');


socket.on('connect', function() {
	socket.emit('setID', myID);
});

socket.on('disconnect', function() {

});

socket.on('setID', function(data) {
	console.log(data);
});

socket.on('offer', function(data) {

	var id    = data.id;
	var offer = data.offer;

	webrtc.addOffer(offer)
	.then(function success(answer) {
		socket.emit('answer', answer);
	}, function fail() {
		// :/
	});

});

socket.on('answer', function(answer) {
	webrtc.addAnswer(answer);
});


function sendOffer(offer) {
	socket.emit('offer', offer);
}


function sendAnswer(answer) {
	socket.emit('answer', answer);
}

// I wanna connect :D :D :D
'1289712937102987'


var transport = new Transport(myID);

transport
	.send('somerandomid')
	.payload('some test')
	.then(function() {
		
	})












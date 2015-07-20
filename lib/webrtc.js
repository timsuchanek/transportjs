var rtc = null;
var constants = require('./constants');

var serverURL = 'http://' + constants.HOST + ':' + constants.PORT;
var socket = require('socket.io-client')(serverURL);
var settings = require('./settings');
var EventEmitter = require('eventemitter3');
var util = require('./util');
var nodeUtil = require('util');
var registered = false;
var NODE = false;


var logging = require('logging').transportjs.webrtc;

var monsole = {};
if (logging === false) {
	monsole.log = monsole.trace = function() {};
} else {
	monsole.log = console.log.bind(console);
	monsole.trace = console.trace.bind(console);
}


if (typeof window === 'undefined') {
	// we're in NODE.
	rtc = require('wrtc');
	settings = settings.node;
	NODE = true;
} else {
	// we're in the browser
	rtc = require('./adapter');
	settings = settings.browser;
	NODE = false;
}

var _handleSDP = function() {
	// if there is no offer, we want to create it!

	var sdp = this.peerConnection.localDescription;


	if (!this.offerData) {
		// monsole.log('sending my offer now', this.peerID);
		socket.emit('offer', {
			peerID: this.peerID,
			offer: sdp
		});
	} else {
		// monsole.log('sending my answer now', this.peerID);
		socket.emit('answer', {
			peerID: this.peerID,
			answer: sdp
		});
	}
};

var _handleAnswer = function(answer) {
	this.answer = new rtc.RTCSessionDescription(answer);
	this.peerConnection.setRemoteDescription(this.answer,
		function success() {
			// monsole.log('set answer successfully');
		}, function fail(err) {
			// monsole.log('error while setting answer');
		});
};

function register(myID) {
	if (!registered) {
		registered = true;
		socket.emit('register', myID);
	}
}

var _setChannelListeners = function() {

	this.channel.onopen = function () {
		// monsole.log('channel open');
		this.emit('ready');

		while(this.pendingPayloads.length > 0) {
			var payload = this.pendingPayloads.shift();
			this.channel.send(payload);
		}

	}.bind(this);

	this.channel.onmessage = function(event) {
		var data = event.data;
		this.emit('message', data);
		// monsole.log('Received message with', data.length, ' bytes');
	}.bind(this);

	this.channel.onerror = function(err) {
		// monsole.log('Error on the Channel: ', err);
	};

};

function Connection(peerID, offerData) {

	this.offerData       = offerData || null;
	this.offer           = null;
	this.answer          = null;
	this.peerConnection  = null;
	this.channel         = null;
	this.myOffer         = null;
	this.myAnswer        = null;
	this.pendingPayloads = [];
	this.peerID          = peerID;
	this.chunking        = false;
	if (typeof peerID !== 'string') {
		// debugger
		throw new Error('invalid peer id');
	}
	this.channelID      = util.getRandomID();

	if (this.offerData) {
		this.offer = new rtc.RTCSessionDescription(offerData);
	}

	if (NODE) {
		this.peerConnection = new rtc.RTCPeerConnection(settings.peerConnection);
	} else {
		this.peerConnection = new rtc.RTCPeerConnection(settings.peerConnection.config, settings.peerConnection.browser);
	}


	// monsole.log('created new peerConnection');

	this.peerConnection.onicecandidate = function(candidate) {

		// if trickling is over
		if (candidate.candidate == null) {
			_handleSDP.call(this, peerID);
		}

	}.bind(this);

	this.peerConnection.ondatachannel = function(event) {
		// monsole.log('got data channel');
		this.channel = event.channel;


		_setChannelListeners.call(this)

	}.bind(this);

	this.peerConnection.onsignalingstatechange = function(state) {
		// monsole.log('signalingstatechange', state);
	};

	this.peerConnection.oniceconnectionstatechange = function(state) {
		// monsole.log('iceconnectionsstatechange', state);
	};

	this.peerConnection.onicegatheringstatechange = function(state) {
		// monsole.log('icegatheringstatechange', state);
	};

	if (this.offerData) {
		// monsole.log('jo, we have an offer');
		this.peerConnection.setRemoteDescription(this.offer, function success() {
			// monsole.log('setRemoteDescription was successfull');
			this.peerConnection.createAnswer(function success(answer) {
				this.myAnswer = answer;
				this.peerConnection.setLocalDescription(answer, undefined, function(err) {
					// monsole.log('Error with setLocalDescription in the Incoming Case: ', err);
				});
			}.bind(this), function fail() {
				// log fail
			});
		}.bind(this), function fail() {
			// log fail
		});
	} else {
		// monsole.log('there is not offa');

		this.channel = this.peerConnection.createDataChannel(this.channelID, { reliable: true, ordered: true });

		_setChannelListeners.call(this);

		this.peerConnection.createOffer(function (desc) {
			// monsole.log('we have a local desc', desc);
			this.peerConnection.setLocalDescription(desc, function() {
				// monsole.log('and set it');
			});
		}.bind(this));
	}

	socket.on('answer', function(data) {
		var peerID = data.peerID;
		var answer = data.answer;


		if (this.peerID === peerID) {
			// monsole.log('Received Answaaa', peerID);
			_handleAnswer.call(this, answer);
		}
	}.bind(this));

	EventEmitter.call(this);
}

nodeUtil.inherits(Connection, EventEmitter);

Connection.prototype.send = function(payload) {

	// monsole.log('sending', ' (' + payload.length + ' bytes) to', this.peerID);

	if (this.channel && this.channel.readyState === 'open') {
		this.channel.send(payload);
	} else {
		this.pendingPayloads.push(payload);
	}

}

module.exports.socket     = socket;
module.exports.register   = register;
module.exports.Connection = Connection;

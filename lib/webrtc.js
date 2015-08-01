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

	if (this.sdpSend) {
		return;
	}

	this.sdpSend = true;

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

var _sendCandidate = function(candidate) {
	// console.log('sending candidate', candidate);
	socket.emit('trickle', {
		peerID: this.peerID,
		candidate: candidate
	});
}

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
		console.log('channel open');
		this.emit('ready');

		while(this.pendingPayloads.length > 0) {
			console.log('sending pendingPayloads');
			var payload = this.pendingPayloads.shift();
			this.channel.send(payload);
		}

	}.bind(this);

	this.channel.onmessage = function(event) {
		var data = event.data;
		console.log('dada');
		this.emit('message', data);
		// monsole.log('Received message with', data.length, ' bytes');
	}.bind(this);

	this.channel.onerror = function(err) {
		console.log('Error on the Channel: ', err);
	};

	this.channel.onclose = function(e) {
		console.log('chanel closed', e);
	}

};

function Connection(peerID, offerData, trickle) {

	this.offerData       = offerData || null;
	this.offer           = null;
	this.answer          = null;
	this.peerConnection  = null;
	this.channel         = {};
	this.myOffer         = null;
	this.myAnswer        = null;
	this.pendingPayloads = [];
	this.peerID          = peerID;
	this.chunking        = false;
	this.trickle         = typeof trickle === 'boolean' ? trickle : true;
	this.sdpSend         = false;

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


	this.peerConnection.onicecandidate = function(event) {


		if (event.candidate === null && !this.trickling) {

			_handleSDP.call(this);

		} else {

			_sendCandidate.call(this, event.candidate);

		}



	}.bind(this);

	this.peerConnection.ongatheringchange = function(e) {
		if (e.currentTarget && e.currentTarget.iceGatheringState === 'complete') {
			console.log('gather');
      _handleSDP.call(this);
    }
	}.bind(this);

	var self = this;

	this.peerConnection.ondatachannel = function(event) {

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
					if (this.trickle) {
						_handleSDP.call(this);
					}
				}.bind(this));
			}.bind(this), function fail() {
				// log fail
			});
		}.bind(this), function fail() {
			// log fail
		});
	} else {
		console.log('i am the babo');

		this.channel = this.peerConnection.createDataChannel(this.channelID, { reliable: true, ordered: true });

		_setChannelListeners.call(this);

		this.peerConnection.createOffer(function (desc) {
			// monsole.log('we have a local desc', desc);
			this.peerConnection.setLocalDescription(desc, function() {
				if (this.trickle) {
					_handleSDP.call(this);
				}
			}.bind(this));
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

	socket.on('trickle', function(data) {
		var peerID = data.peerID;
		var candidate = data.candidate;


		if (this.peerID === peerID) {
			// monsole.log('Received Answaaa', peerID);
			// console.log('Adding candidate', candidate);
			this.peerConnection.addIceCandidate(new rtc.RTCIceCandidate(candidate));

		}

	}.bind(this));


	Object.observe(this.channel, function(changes) {
		console.log('change of this.channel', changes, this.channel);
	});


	EventEmitter.call(this);
}

nodeUtil.inherits(Connection, EventEmitter);

Connection.prototype.send = function(payload) {

	// monsole.log('sending', ' (' + payload.length + ' bytes) to', this.peerID);

	if (this.channel && this.channel.readyState === 'open') {
		// console.log('already sending', payload);
		this.channel.send(payload);
	} else {

		// console.log('queueing', payload, this.channel);

		// console.log(this);

		this.pendingPayloads.push(payload);
	}

}

module.exports.socket     = socket;
module.exports.register   = register;
module.exports.Connection = Connection;

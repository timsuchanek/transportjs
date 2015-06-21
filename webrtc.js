var rtc = null;
var socket = require('socket.io-client')('http://localhost:3000');
var settings = require('./settings');

if (typeof window === 'undefined') {
	// we're in node.
	rtc = require('wrtc');
} else {
	rtc = require('./adapter');
}

function WebRTC() {
	this.connections = {};
}

WebRTC.prototype.createConnection = function(peerID, offerData) {

	var offer = null
	if (offerData) {
		offer = new rtc.RTCSessionDescription(offerData);
	}

	if (!this.peerConnections[peerID]) {

		var peerConnection = new rtc.RTCPeerConnection(settings.peerConnection);
		var connection = {
			peerConnection: peerConnection,
			dataChannel: null,
			offer: !!offer,
			myOffer: null,
			myAnswer: null
		};

		this.connections[peerID] = connection;

		peerConnection.onicecandidate = function(candidate) {

			// if trickling is over
			if (candidate.candidate == null) {
				this.sendAnswer(peerID);
			}

		}.bind(this);

		peerConnection.ondatachannel = function(event) {
			var channel = event.channel;
			connection.channel = channel;
		};


		if (offer) {
			peerConnection.setRemoteDescription(offer, function success() {
				peerConnection.createAnswer(function success(answer) {
					connection.myAnswer = answer;
				}.bind(this), function fail() {
					// log fail
				});
			}.bind(this), function fail() {
				// log fail
			});
		}

	} else {
		return this.peerConnections[peerID];
	}
}
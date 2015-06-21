var webrtc = require('webrtc');
var EventEmitter = require('eventemitter3');

function Transport(myID) {
	this.connections = {};
	this.requests    = {};

	EventEmitter.call(this);
}

Transport.prototype.send = function(id) {
	return new Request(id, this);
}




var _request = function() {
	var connections = this.transport.connections;

	var connection = connections[this.peerID];

	if (connection) {

		this.requestID     = ++connection.requestCount;

		var queue          = connection.queue;
		var channel        = connection.channel;

		if (channel.readyState == 'open') {
			channel.send(this.payload);
		} else {
			queue.push(this.payload);
		}
	} else {

		/**
		 * creates {
		 *   peerConnection: RTCPeerConnection,
		 *   channel: RTCDataChannel
		 * }
		 */
		var connection = webrtc.createConnection(this.peerID);

		connection.queue = [];

		connection.requestCount = 0;

		this.requestID     = ++connection.requestCount;

		connection.requests = [this];

		connections[this.peerID] = connection;

		connection.channel.onopen = function() {
			while (connection.queue.length > 0) {
				connection.channel.send(queue.pop());
			}
		};

		connection.channel.onmessage = function(event) {
			var data = JSON.parse(event.data);
			this.transport.emit('message', {
				peerID: peerID,
				data:   data});
		};
	}
}

/**
 *
 * Achtung Achtung: Was wir brauchen sind IncomingRequest und OutgoingRequest Objekte.
 * Alle Requests müssen praktisch hier gehandelt werden.
 * Noch ne Sache: wenn ein Request dann fertig ist, kann er ja schlecht delete this aufrufen.
 * Ein paar Ideen: this.transport ... delete blub aufrufen lassen
 * Die Referenz deleten (also delete INCOMING_REQUESTS[peerID])
 * Deine Mudda.
 */

function Request(peerID, transport) {
	this.peerID    = peerID;
	this.payload   = null;
	this.transport = transport;
	this.requestID = null;
	this.success   = null;
	this.fail      = null;
}

Request.prototype.payload = function(payload) {
	this.payload = JSON.stringify(payload);
	return this;
};

Request.prototype.then = function(success, fail) {
	this.success = success;
	this.fail    = fail;

	// make the request.
	_request.call(this);
};


module.exports = Transport;
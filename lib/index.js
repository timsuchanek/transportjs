var constants = require('./constants');
var webrtc = require('./webrtc');
var socket = webrtc.socket;
var EventEmitter = require('eventemitter3');
var InRequest = require('./InRequest')(webrtc);
var OutRequest = require('./OutRequest')(webrtc);
var util = require('./util');
var nodeUtil = require('util');


var logging = require('logging').transportjs.index;

var monsole = {};
if (logging === false) {
	monsole.log = monsole.trace = function() {};
} else {
	monsole.log = console.log.bind(console);
	monsole.trace = console.trace.bind(console);
}

var CHUNKS = {};


function _handleMessage(peerID, data) {


	var requestID = data.substring(0, constants.B64_LENGTH);
	var pipe      = data.substr(constants.B64_LENGTH, 1);
	var payload   = data.substring(constants.B64_LENGTH + 1, data.length);

	console.log('incoming reqID', requestID);

	try {
		payload = JSON.parse(payload);
	} catch (e) {
		payload = null;
	}


	if (pipe === '|') {

		var outRequest = this.outRequests[peerID] && this.outRequests[peerID][requestID];

		if (outRequest) {

			outRequest.success(payload);

			// remove outRequest from pending queue
			delete this.outRequests[peerID][requestID];

		} else {
			var request = this.createInRequest(peerID, requestID, payload);
			this.emit('request', request);
		}

	} else {

		var err = new Error("Can't identify message. Found " + pipe + ' instead of |');
		console.trace(err, data.length);
	}

}

function _receiveChunk(peerID, data, connection) {

	var cb = data.substring(0, 2);


	// we MUST NOT be chunking AND the chunking symbols must be here
	if (!connection.chunking && cb === 'cb') {

		var rest = data.substring(3, data.length);
		var pipeIndex = rest.indexOf('|');
		var size = parseInt(rest.substring(0, pipeIndex), 10);
		var data = rest.substring(pipeIndex + 1, rest.length);



		if (isNaN(size)) {
			console.trace('Invalid chunk size', size);
		} else {
		  console.log(this.myID.substr(this.myID.length - 2) + ': YES. Now expecting ' + size + ' bytes!');
		}

		CHUNKS[peerID] = {
			size: size,
			data: data
		};

		connection.chunking = true;

	} else if (connection.chunking) {

		var chunk = CHUNKS[peerID];

		var newLength = data.length + chunk.data.length;

		// if we didn't reach the max size, we're not finished
		if (newLength < chunk.size) {
			chunk.data += data;
		// successfully chunked :-)
		} else if (newLength === chunk.size) {

			connection.chunking = false;
			chunk.data += data;

			_handleMessage.call(this, peerID, chunk.data);

			chunk.data = null;

		} else {
			var err = new Error('We got more data (' + newLength + ' byte) in the last message than expected (' + chunk.size + ' byte)');
			console.trace(err);

		}




	} else {
		var err = new Error("Chunking not possible, got cb=", cb, 'but chunking=', connection.chunking);
		console.trace(err);
	}


}


function Transport(myID) {

	myID = myID || null;

	this.connections = {};
	this.myID        = myID || util.getRandomID();

	/**
	 * inRequests and outRequests have the following structure: {
	 *   'peerid1': {
	 *     'requestid123': outRequest,...
	 *   } // it contains only the PENDING requests
	 *   'peerid2': ...
	 * }
	 * @type {Object}
	 */
	this.inRequests  = {};
	this.outRequests = {};

	EventEmitter.call(this);

	socket.on('connect', function() {
		monsole.log('connected to socket server');
		socket.emit('register', this.myID);
	}.bind(this));

	socket.on('disconnect', function() {
		monsole.log('disconnected from socket server');
	});




	// monsole.log('Connected to the socket, registered as ' + this.myID);

	socket.on('offer', function(data) {
		var peerID = typeof data.peerID === 'string' ? data.peerID : null;
		if (peerID === null) {
			throw new Error("peerID is not a string");
		}
		var offer  = data.offer;

		// monsole.log('Received offfaa from', peerID);

		var connection = new webrtc.Connection(peerID, offer);
		this.connections[peerID] = connection;

		connection.on('message', function(data) {
			this.receive(peerID, data, connection);
		}.bind(this));

		connection.on('close', function() {
			// delete connections[]
		});


	}.bind(this));

	socket.on('error', function(err) {
		monsole.trace('Error with socket', err);
	});
}

nodeUtil.inherits(Transport, EventEmitter);

Transport.prototype.bootstrap = function(cb, scope) {
	var called = false;
	socket.emit('bootstrap', "");

	socket.on('bootstrap', function(peers) {
		if (!called) {
			cb.call(scope, peers);
			called = true;
		}
	})
}

Transport.prototype.send = function(id) {
	if (typeof id !== 'string') {
		throw new Error('Invalid peer id', id);
	}
	return this.createOutRequest(id);
};

Transport.prototype.receive = function(peerID, data, connection) {
	// VERY IMPORTANT. FIRST: Look, if this message doesn't belong to
	// any request, we've already send.

	// DEBUG!!!

	var chunk = data.substring(0, 2);

	if (chunk === 'cb' || connection.chunking) {
		_receiveChunk.call(this, peerID, data, connection);
	} else {
		_handleMessage.call(this, peerID, data);
	}

};

Transport.prototype.createOutRequest = function(id) {

	if (!this.outRequests[id]) {
		this.outRequests[id] = {};
	}

	var request = new OutRequest(id, this);


	var requests = this.outRequests[id];
	requests[request.requestID] = request;

	request.on('done', function() {
		delete requests[request.requestID];
	}.bind(this));

	return request;

};


Transport.prototype.createInRequest = function(peerID, requestID, payload) {

	if (!this.inRequests[peerID]) {
		this.inRequests[peerID] = {};
	}

	var request = new InRequest(peerID, requestID, payload, this);

	var requests = this.inRequests[peerID];
	requests[requestID] = request;


	request.on('done', function() {
		delete requests[requestID];
	}.bind(this));

	return request;

};




/**
 *
 * Achtung Achtung: Was wir brauchen sind IncomingRequest und OutgoingRequest Objekte.
 * Alle Requests müssen praktisch hier gehandelt werden.
 * Noch ne Sache: wenn ein Request dann fertig ist, kann er ja schlecht delete this aufrufen.
 * Ein paar Ideen: this.transport ... delete blub aufrufen lassen
 * Die Referenz deleten (also delete INCOMING_REQUESTS[peerID])
 */


module.exports = Transport;

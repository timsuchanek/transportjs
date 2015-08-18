var constants = require('./constants');
var util = require('./util');
var EventEmitter = require('eventemitter3');
var nodeUtil = require('util');

var logging = false;

var monsole = {};
if (logging === false) {
	monsole.log = monsole.trace = function() {};
} else {
	monsole.log = console.log.bind(console);
	monsole.trace = console.trace.bind(console);
}


module.exports = function(webrtc) {

	var _send = function(connection, payload, id) {

		var data = id + '|' + payload;
		if (data.length < constants.MTU) {
			connection.send(data);
		} else {
			// chunk data and send chunks
			var chunks = util.chunkData(data);
			chunks.forEach(function(chunk) {
				connection.send(chunk);
			});
		}

	};

	var _respond = function() {

		var connection = this.transport.connections[this.peerID];

		if (connection) {
			_send.call(this, connection, this.__payload, this.requestID);
			// if we could send the message, it's done.

			this.success(this.__payload);

		} else {
			//log
		}

	};

	function InRequest(peerID, requestID, data, transport) {

		this.peerID          = peerID;
		this.requestID       = requestID;
		// this.data is the data that came in
		this.data            = data;
		// this.__payload is our answer we want to send
		this.__payload       = null;
		this.transport       = transport;
		this.responding      = false;
		this.finished        = false;
		this.successFunction = null;
		this.failFunction    = null;
		this.__scope         = this;

	}

	nodeUtil.inherits(InRequest, EventEmitter);

	InRequest.prototype.respond = function() {
		this.responding = true;
		return this;
	};

	InRequest.prototype.payload = function(payload) {
		this.__payload = JSON.stringify(payload);
		return this;
	};

	InRequest.prototype.scope = function(scope) {
		this.__scope = scope;
		return this;
	};

	InRequest.prototype.success = function(payload) {

		if (!this.finished) {

			this.finished = true;

			var rtt = Date.now() - this.begin;

			if (typeof this.successFunction === 'function') {
				this.successFunction.call(this.__scope, payload, rtt);
			}

			this.emit('done');

		} else {
			// log
		}

	};

	InRequest.prototype.then = function(success, fail) {
		this.successFunction = success;
		this.failFunction    = fail;

		if (!this.responding) {
			throw new Error("Didn't call .respond()");
		}

		// make the request.
		_respond.call(this);
	};

	return InRequest;
};
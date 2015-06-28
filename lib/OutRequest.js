var constants = require('./constants');
var util  = require('./util');

module.exports = function(webrtc) {

	var _send = function(connection, payload, id) {
		var data = id + '|' + payload;
		connection.send(data);
		console.log('sent', JSON.parse(payload));
	};

	var _request = function() {
		var connections = this.transport.connections;

		var connection = connections[this.peerID];

		if (!connection) {

			/**
			 * creates {
			 *   peerConnection: RTCPeerConnection,
			 *   channel: RTCDataChannel
			 * }
			 */

			connections[this.peerID] = connection = new webrtc.Connection(this.peerID);

			connection.on('message', function(data) {
				this.transport.receive(this.peerID, data);
			}.bind(this));

			connection.on('close', function() {
				// delete connections[]
			});

		}

		_send.call(this, connection, this.__payload, this.requestID);

	}


	function OutRequest(peerID, transport, timeout) {

		this.requestID       = util.getRandomID();
		this.peerID          = peerID;
		this.__payload       = null;
		this.transport       = transport;
		this.successFunction = null;
		this.failFunction    = null;
		this.finished        = false;
		this.__scope         = this;
		this.begin           = Date.now();
		this.__timeout       = !isNaN(timeout) || constants.TIMEOUT;

	}

	OutRequest.prototype.success = function(payload) {

		if (!this.finished) {

			this.finished = true;

			var rtt = Date.now() - this.begin;

			if (typeof this.successFunction === 'function') {
				this.successFunction.call(this.__scope, payload, rtt);
			}

		} else {
			// log
		}

	}

	OutRequest.prototype.scope   = function(scope) {
		this.__scope = scope;
		return this;
	}


	OutRequest.prototype.timeout   = function(timeout) {
		timeout = typeof timeout === 'number' ? timeout : 1000;
		this.__timeout = timeout;
		return this;
	}

	OutRequest.prototype.payload = function(payload) {
		this.__payload = JSON.stringify(payload);
		return this;
	};

	OutRequest.prototype.then = function(success, fail) {
		this.successFunction = success;
		this.failFunction    = fail;

		// make the request.
		_request.call(this);


		setTimeout(function() {
			if (!this.finished) {
				this.finished = true;
				this.failFunction.call(this, new Error('Timeout: ' + constants.TIMEOUT + 'ms over.'));
			}
		}.bind(this), this.__timeout);

	};

	return OutRequest;
}
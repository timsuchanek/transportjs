var Server = require('socket.io');
var constants = require('./lib/constants');
var util = require('./lib/util');

var io = new Server();

var peers = {};

var _getPeer = function(peerID) {

	if (peerID === null) return null;

	var fittingPeers = Object.keys(peers).filter(function(peer) {
		return peers[peer].kademliaID === peerID;
	});

	if (fittingPeers.length > 0) {
		return peers[fittingPeers[0]];
	} else {
		return null;
	}

};

var _getSocketID = function(peerID) {

	if (peerID === null) return null;

	var fittingPeers = Object.keys(peers).filter(function(peer) {
		return peers[peer].kademliaID === peerID;
	});

	if (fittingPeers.length > 0) {
		return fittingPeers[0];
	} else {
		return null;
	}

}

var _getOnlinePeers = function() {
	return Object.keys(peers).filter(function(key) {
		var peer = peers[key];
		return peer.online === true;
	}).length;
};

io.on('connection', function(socket) {

	// console.log('Socket ', socket.id, 'connected');

	// console.log(_getOnlinePeers() + ' peers online');

	peers[socket.id] = {
		socket: socket,
		kademliaID: null,
		online: true
	};

	socket.on('register', function(id) {
		// console.log('received register', id);
		if (util.b64ToBinary(id).length === constants.HASH_SPACE) {

			// check, if that kademliaID is already present on an offline socket

			var peer = _getPeer(id) || null;
			var socketID = _getSocketID(id) || null;

			if (peer !== null) {
				if (peer.online === true) {
					return;
				}

				// remove the offline peer, because it would cause conflicts
				delete peers[socketID];
				// console.log('removed old socket');

			}

			peers[socket.id].kademliaID = id;

		} else {
			// console.log('Got invalid id :/ The length doesnt match to the HASH SPACE');
			socket.emit('register', 'Your ID is not valid.');
		}
	});

	socket.on('offer', function(data) {
		var peerID = data.peerID || null;
		var offer  = data.offer  || null;


		if (peerID !== null && offer !== null) {

			var peer = _getPeer(peerID) || null;


			if (peer === null) {
				// console.log(socket.id + ' wants to connect to a peer that doesnt exist: ' + peerID);
				return;
			}

			var kademliaID = peers[socket.id].kademliaID;

			// console.log('received offer from', kademliaID, 'to', peerID);

			// console.log('sending offer to', peerID);


			peer.socket.emit('offer', {
				peerID: kademliaID,
				offer: offer
			});

		} else {
			// console.log('Receiving Offer failed');
		}
	});

	socket.on('answer', function(data) {
		var peerID = data.peerID || null;
		var answer  = data.answer  || null;

		if (peerID !== null && answer !== null) {
			var peer = _getPeer(peerID);
			var kademliaID = peers[socket.id].kademliaID;

			// console.log('received answer from', kademliaID, 'to', peerID);

			// console.log('sending answer from', kademliaID, 'to', peerID);
			peer.socket.emit('answer', {
				peerID: kademliaID,
				answer: answer
			});
		} else {
			// console.log('Receiving Answer failed');
		}
	});

	socket.on('trickle', function(data) {
		var peerID = data.peerID || null;
		var candidate  = data.candidate  || null;

		if (peerID !== null && candidate !== null) {
			var peer = _getPeer(peerID);
			var kademliaID = peers[socket.id].kademliaID;

			// console.log('received trickle from', kademliaID, 'to', peerID);

			// console.log('sending trickle from', kademliaID, 'to', peerID);
			peer.socket.emit('trickle', {
				peerID: kademliaID,
				candidate: candidate
			});
		} else {
			// console.log('Receiving Answer failed');
		}
	});

	socket.on('connect', function() {
		peers[socket.id].online = true;
		// console.log('Socket ', peers[socket.id].kademliaID, 'disconnected');
		peers[socket.id].online = false;
		// console.log(_getOnlinePeers() + ' peers online');
	})

	socket.on('disconnect', function(K) {
		// console.log('Socket ', peers[socket.id].kademliaID, 'disconnected');
		peers[socket.id].online = false;
		// console.log(_getOnlinePeers() + ' peers online');
	});

	socket.on('error', function(err) {
		err = err.stack ? err.stack : err;
		// console.log(socket.id, 'makes some trouble :/', err);
	});

	socket.on('bootstrap', function() {
		var peerIDs = Object.keys(peers).filter(function(key) {
			return peers[key].online === true;
		}).map(function(key) {
			return peers[key].kademliaID;
		})
		.filter(function(id) {
			return id !== null;
		});

		// console.log('send  bootstrap peers', peerIDs);

		socket.emit('bootstrap', peerIDs);
	});
});

console.log('Server Running at port ' + constants.PORT);

io.listen(constants.PORT);

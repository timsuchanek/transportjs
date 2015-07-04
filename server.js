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

var _getOnlinePeers = function() {
	return Object.keys(peers).filter(function(key) {
		var peer = peers[key];
		return peer.online === true;
	}).length;
};

io.on('connection', function(socket) {

	console.log('Socket ', socket.id, 'connected');

	console.log(_getOnlinePeers() + ' peers online');

	peers[socket.id] = {
		socket: socket,
		kademliaID: null,
		online: true
	};

	socket.on('register', function(data) {
		console.log('received register', data);
		if (util.b64ToBinary(data).length === constants.HASH_SPACE) {
			peers[socket.id].kademliaID = data;
		} else {
			socket.emit('register', 'Your ID is not valid.');
		}
	});

	socket.on('offer', function(data) {
		var peerID = data.peerID || null;
		var offer  = data.offer  || null;


		if (peerID !== null && offer !== null) {

			var peer = _getPeer(peerID);
			var kademliaID = peers[socket.id].kademliaID;

			console.log('received offer from', kademliaID, 'to', peerID);

			console.log('sending offer to', peerID);

			peer.socket.emit('offer', {
				peerID: kademliaID,
				offer: offer
			});

		} else {
			console.log('Receiving Offer failed');
		}
	});

	socket.on('answer', function(data) {
		var peerID = data.peerID || null;
		var answer  = data.answer  || null;

		if (peerID !== null && answer !== null) {
			var peer = _getPeer(peerID);
			var kademliaID = peers[socket.id].kademliaID;

			console.log('received answer from', kademliaID, 'to', peerID);

			console.log('sending answer from', kademliaID, 'to', peerID);
			peer.socket.emit('answer', {
				peerID: kademliaID,
				answer: answer
			});
		} else {
			console.log('Receiving Answer failed');
		}
	});

	socket.on('connect', function() {
		peers[socket.id].online = true;
		console.log('Socket ', peers[socket.id].kademliaID, 'disconnected');
		peers[socket.id].online = false;
		console.log(_getOnlinePeers() + ' peers online');
	})

	socket.on('disconnect', function(K) {
		console.log('Socket ', peers[socket.id].kademliaID, 'disconnected');
		peers[socket.id].online = false;
		console.log(_getOnlinePeers() + ' peers online');
	});

	socket.on('error', function(err) {
		err = err.stack ? err.stack : err;
		console.log(peers[socket.id].kademliaID, 'makes some trouble :/', err);
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

		console.log('send  bootstrap peers', peerIDs);

		socket.emit('bootstrap', peerIDs);
	});
});

io.listen(constants.PORT);

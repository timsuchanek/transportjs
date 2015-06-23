var Server = require('socket.io');
var constants = require('./constants');
var util = require('./util');

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

io.on('connection', function(socket) {

	console.log('Socket ', socket.id, 'connected');

	peers[socket.id] = {
		socket: socket,
		kademliaID: null
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


	socket.on('disconnect', function(K) {
		console.log('Socket ', socket.id, 'disconnect :/');
		delete peers[socket.id];
		console.log(Object.keys(peers).length + ' peers still online');
	});
});

io.listen(constants.PORT);


/**
 * io.emit               -> An Alle.
 * socket.emit           -> Nur an socket
 * socket.broadcast.emit -> An Alle außer socket
 */
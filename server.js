var Server = require('socket.io');
var constants = require('./constants');
var util = require('./util');

var io = new Server();

var peers = {};

io.on('connection', function(socket) {

	console.log('Socket ', socket.id, 'connected');

	peers[socket.id] = {
		socket: socket,
		kademliaID: null
	};

	socket.on('setID', function(data) {
		console.log(data);
		console.log(util.b64ToBinary(data));
		console.log(util.b64ToBinary(data).length);
		if (util.b64ToBinary(data).length === constants.HASH_SPACE) {
			peers[socket.id].kademliaID = data;
		} else {
			socket.emit('setID', 'Nein du Opfa');
		}
	});

	socket.on('offer', function(data) {

	});

	socket.on('disconnect', function(K) {
		console.log('Socket ', socket.id, 'disconnect :/')
	});
});

io.listen(3000);


/**
 * io.emit               -> An Alle.
 * socket.emit           -> Nur an socket
 * socket.broadcast.emit -> An Alle außer socket
 */
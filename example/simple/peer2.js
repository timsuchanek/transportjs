var Transport = require('../../src/index');
var ids = require('./ids');

var transport = new Transport(ids[1]);

var messageCount = 0;

transport.on('request', function(req) {

	messageCount++;
	console.log('peer2: Got request', req.data);

	req.respond()
	.payload({'Hallo': 'Zu®uck.'})
	.then(function success() {
		console.log('Yuhuu, answered!', messageCount);
	}, function fail(err) {
		console.log('Oops', err);
	});

});
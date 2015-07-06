var Transport = require('../../lib/index');
var ids       = require('../simple/ids');

var transport = new Transport(ids[1]);

var messageCount = 0;

transport.on('request', function(req) {

	messageCount++;

	req.respond()
	.payload({'Hallo': 'Zu®uck.'})
	.then(function success() {
		console.log('Yuhuu, answered!', messageCount);
	}, function fail(err) {
		console.log('Oops', err);
	});

});
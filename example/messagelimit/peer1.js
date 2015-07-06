var Transport = require('../../lib/index');
var ids       = require('../simple/ids');

var transport = new Transport(ids[0]);



transport
	.send(ids[1])
	.payload({hello: 'world'})
	.scope(this)
	.then(function success(res, rtt) {

		console.log('Yes! Got a response!',
			res, 'It took ' + rtt + 'ms for the first time');


	}, function fail(err) {
		console.log('errör1', err);
	});


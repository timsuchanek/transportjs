var Transport = require('../../index');
var ids       = require('./ids')

var transport = new Transport(ids[0]);


transport
	.send(ids[1])
	.payload({hello: 'world'})
	.scope(this)
	.then(function success(res, rtt) {

		console.log('Yes! Got a response!',
			res, 'It took ' + rtt + 'ms for the first time');

		transport
			.send(ids[1])
			.payload({hello: 'world'})
			.then(function success(res, rtt) {

				console.log('Yes! Got a response!',
					res, 'It took ' + rtt + 'ms for the second time');

			}, function fail(err) {
				console.log('errör2', err);
			});


	}, function fail(err) {
		console.log('errör1', err);
	});
var Transport = require('../../lib/index');
var ids       = require('../simple/ids');
var util      = require('../../lib/util');

var transport = new Transport(ids[0]);

var n = 1;

if (process.argv.length > 2) {
	var x = parseInt(process.agrv[2], 10);
	if (!isNaN(x)) {
		n = x;
	}
}

var garbage = util.randomGarbage(n * 1024);


transport
	.send(ids[1])
	.payload({
		'hallo': 'yeay'
	})
	.scope(this)
	.then(function success(res) {

		transport
			.send(ids[1])
			.payload({garbage)
			.scope(this)
			.then(function success(res, rtt) {

				console.log('Yes! Got a response!',
					res, 'It took ' + rtt + 'ms for the second time');


			}, function fail(err) {
				console.log('errör1', err);
			});

	}, function fail(err) {
		console.log('errör1', err);
	});


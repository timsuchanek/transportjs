var Transport = require('../../lib/index');
var ids       = require('../simple/ids');
var util      = require('../../lib/util');

var transport = new Transport(ids[0]);

var garbage = util.randomGarbage(10 * 1000 * 1000);


var data = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Modi nesciunt ex vitae natus ducimus nulla quo sunt exercitationem, illum. Ipsam itaque hic dolor, odio accusantium omnis recusandae repudiandae rerum nihil.';



transport
	.send(ids[1])
	.payload(garbage)
	.scope(this)
	.then(function success(res, rtt) {

		console.log('Yes! Got a response!',
			res, 'It took ' + rtt + 'ms for the first time');


	}, function fail(err) {
		console.log('errör1', err);
	});


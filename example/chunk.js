var util = require('../lib/util');

var data = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Modi nesciunt ex vitae natus ducimus nulla quo sunt exercitationem, illum. Ipsam itaque hic dolor, odio accusantium omnis recusandae repudiandae rerum nihil.';

var chunks = util.chunkData(data);

console.log(chunks);

console.log(chunks[0].substring(0,2));
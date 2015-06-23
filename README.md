transport.js
============
transport.js is a WebRTC DataChannel Library that is designed for building p2p networks.

## Usage
```
$ npm install --save transportjs
```

Requester:
```javascript
var Transport = require('transportjs');

var id = 'E4CKnjXC1_ru4lz0Iqz_-Op68wH';

var transport = new Transport(id);

transport.
	send('CrlAkeQ9rzgbq7Kz-QWj_KLZGS0')
	.payload({
		hi: 'my friend'
	})
	.then(function success(res, rtt) {
		console.log('Response: ', res, 'Round Trip Time: ', rtt + ' ms');
	}, function fail(err) {
		console.log('Oops');
	});

```

Responder:
```javascript
var Transport = require('transportjs');

var id = 'CrlAkeQ9rzgbq7Kz-QWj_KLZGS0';

var transport = new Transport(id);

transport.on('request', function(req) {

	req.respond()
	.payload({
		whoot: 'why "friend"??'
	})
	.then(function succes() {
		console.log(':p')
	}, function fail() {
		console.log('Fail :/')
	});

});

```

## Running the Demo
### node
```
$ cd example/simple

--> First Terminal tab or window
$ node peer2.js

--> Second Terminal tab or window
$ node peer1.js

THE ORDER IS IMPORTANT! FIRST RUN peer2.js then peer1.js
```
### browser
```
$ cd example/simple
$ python -m SimpleHTTPServer
```
Open in first browser Tab/Window
```
http://localhost:8000/index2.html
```

Open in the second browser Tab/Window

```
http://localhost:8000/index1.html
```


### both
Of course Node and Browser work together, too.
You can combine index1 with peer2 or index2 with peer1.

# License
MIT
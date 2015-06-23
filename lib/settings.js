module.exports = {
	node: {
		peerConnection: [
		  { iceServers: [{url:'stun:stun.l.google.com:19302'}] },
		  { optional: [{ DtlsSrtpKeyAgreement: true }] }
		]
	},
	browser: {
		peerConnection: {
			config: {
				iceServers: [{url:'stun:stun.l.google.com:19302'}],
				connection: {
					optional: [{ DtlsSrtpKeyAgreement: true }]
				}
			}
		}
	}

}
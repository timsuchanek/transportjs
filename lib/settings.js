module.exports = {
	node: {
		peerConnection: [
		  { iceServers: [{url:'stun:turn.five.netsyno.com:3478'}] },
		  { optional: [{ DtlsSrtpKeyAgreement: true }] }
		]
	},
	browser: {
		peerConnection: {
			config: {
				iceServers: [{url:'stun:turn.five.netsyno.com:3478'}],
				connection: {
					optional: [{ DtlsSrtpKeyAgreement: true }]
				}
			}
		}
	}

}
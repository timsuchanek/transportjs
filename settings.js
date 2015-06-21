module.exports = {
	peerConnection: [
	  { iceServers: [{url:'stun:stun.l.google.com:19302'}] },
	  { optional: [{DtlsSrtpKeyAgreement: false}] }
	]
}
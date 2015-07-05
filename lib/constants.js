module.exports = {
  // Network Config
  PING_TIMEOUT: 1000,
  STORE_TIMEOUT: 1000,
  FIND_NODE_TIMEOUT: 1000,
  FIND_VALUE_TIMEOUT: 1000,

  TIMEOUT: 5000,

  HOST: 'localhost',
  PORT: 3000,

  // Kademlia Config
  HASH_SPACE: 192,
  B64_LENGTH: 32,

  K: 8,
  CONCURRENCY_FACTOR: 3,

  // Logging Config
  LOG_PING: true,
  LOG_STORE: true,
  LOG_FIND_VALUE: true,
  LOG_FIND_NODE: true,
  LOG_PEERJS: true
}
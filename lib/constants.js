module.exports = {
  // Network Config

  TIMEOUT: 2000,

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
  LOG_PEERJS: true,

  // reference peer.js
  MTU: 16200,

  RPCS: {
    PING_REQ: 10000,
    PING_RES: 10001,

    FIND_NODE_REQ: 10002,
    FIND_NODE_RES: 10003,

    FIND_VALUE_REQ: 10004,
    FIND_VALUE_RES: 10005,

    STORE_REQ: 10006,
    STORE_RES: 10007,

    NODE_LOOKUP_REQ: 10008,
    NODE_LOOKUP_RES: 10009,

    VALUE_LOOKUP_REQ: 10010,
    VALUE_LOOKUP_RES: 10011,

    BULK_STORE_REQ: 10012,
    BULK_STORE_RES: 10013
  },
}
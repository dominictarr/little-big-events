var redis = require('node-redis')
  , LittleBigEventEmitter = require('./').LittleBigEventEmitter
  , inherits      = require('util').inherits
  , u             = require('ubelt')
  
exports.EventEmitter = RedisEventEmitter
exports.RedisEventEmitter = RedisEventEmitter

inherits(RedisEventEmitter, LittleBigEventEmitter)

function createClient (opts) {
  return redis.createClient(opts.port || 6379, opts.host || 'localhost', opts.auth)
}

function RedisEventEmitter (opts) {
  if(!(this instanceof RedisEventEmitter ))
    return new RedisEventEmitter (opts)
  LittleBigEventEmitter.call(this)

  console.error(this.__proto__.__proto__)

  this._opts = opts || {}
  this._subscriptions = {}
  var self = this
  var c = 0
  function onConnect () {
    console.error('connection')
    c ++
    if(c == 2)
      self._emit('connect')
  }
  //need two clients to be able to emit and listen
  this._listener = createClient(this._opts)
  this._emitter = createClient(this._opts)
  this._listener.on('connect', onConnect)
  this._emitter.on('connect', onConnect)
}

RedisEventEmitter.prototype._remoteOn = function (event, listener) {
  consol.error(event, listener)
  var self = this
  if(!this._listener) this._listener = createClient(this._opts)
  if(!this._subscriptions[event]) {
    this._listener.subscribe(event)
    this._listener.on(event, function (json) {
      self._emit.apply(null, [event].concat(JSON.parse))
    })
  }
  this._subscriptions[event] = (this._subscriptions[event] || 0) + 1
  this._on(event, listener)
}

//RedisEventEmitter.prototype.addListener = RedisEventEmitter.prototype.on

RedisEventEmitter.prototype._remoteEmit = function () {
  var args = [].slice.call(arguments)
    , event = args.shift()
  //redis requires two connections if you are subscribing and publishing.
  if(!this._emitter) this._emitter = createClient(this._opts)
  
  var emitter = this._emitter
  
  emitter.publish(event, JSON.stringify(args))
}

RedisEventEmitter.prototype.removeAllListeners = function () {
  
}
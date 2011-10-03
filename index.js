
var EventEmitter  = require('events').EventEmitter
  , inherits      = require('util').inherits
  , u             = require('ubelt')
  
exports.EventEmitter = LittleBigEventEmitter
exports.LittleBigEventEmitter = LittleBigEventEmitter

inherits(LittleBigEventEmitter, EventEmitter)

function LittleBigEventEmitter (opts, internal) {
  if(!opts)
    return new EventEmitter()

  if(opts.type == 'redis')
    return new (require('./redis').EventEmitter)(opts)

  if(!(this instanceof LittleBigEventEmitter))
    return new LittleBigEventEmitter (opts)

  EventEmitter.call(this)
  
  this.addListener = this.emit = u.defer(this._remoteEmit)
  this.on = u.defer(this._remoteOn)
  this.removeAllListeners = u.defer(this._remoteRemoveAllListeners )
  
  this._on('connect', this.emit.flush)
  this._on('connect', this.on.flush)
  this._on('disconnect', this.emit.buffer)
  this._on('disconnect', this.on.buffer)
  
  this.on.buffer()
  this.emit.buffer()
}
var lbeeProto = LittleBigEventEmitter.prototype

//
// private emit,
//
// subclasses should call this when they recieving events from remote.
// it will emit events like EventEmitter.emit
// 


/*
 inner api
 
 connect(callback)
 disconnect(callback)
 listen(event, listener)
 unlisten(event)

only use one listener on the inside, 
because the remote hub shouldn't know about each listener function.

then, LBEE will keep track of each listener, and disconnect automat

*/
lbeeProto._emit = EventEmitter.prototype.emit

//
// private on
//
// use this to listen to local events, if necessary.

lbeeProto._on = EventEmitter.prototype.on

//
// private remote emit,
//
// subclasses should overwrite this and send events to remote when this is called.
//

lbeeProto._remoteEmit = function () {
 //overwrite this
 this._emit.apply(this, arguments)
}

lbeeProto._remoteOn = function () {
 //overwrite this
 this._on.apply(this, arguments)
}

lbeeProto._remoteRemoveListener = function () {
 //overwrite this
 this._removeListener.apply(this, arguments)
}


/*
  LitteBigEventEmitter backend template 

  to make a backend for LitteBigEventEmitter
  just overwrite each of these methods. 
*/

exports.create = LBEEBackend

function LBEEBackend (opts) {
  if(!(this instanceof LBEEBackend)
    return new LBEEBackend (opts)
  this.listeners = {}
}

LBEEBackend.prototype.connect = function (cb) {
  process.nextTick(cb)
}
LBEEBackend.prototype.disconnect = function (cb) {
  process.nextTick(cb)
}
LBEEBackend.prototype.listen = function (event, listener) {
  if (this.listeners[event])
    throw new Error('there is already an event registered to ' + JSON.stringify(event))
  this.listeners[event] = listener
}
LBEEBackend.prototype.unlisten = function (event, listener) {
  this.listeners[event] = null
}
LBEEBackend.prototype.emit = function (event, data) {
  if(this.listeners[event])
    this.listeners[event](data)
}
LBEEBackend.prototype.events = function () {
  return Object.keys(this.listeners)
}
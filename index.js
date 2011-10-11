
var EventEmitter = require('events').EventEmitter

exports.EventEmitter = LittleBigEventEmitter 
exports.LittleBigEventEmitter = LittleBigEventEmitter 

function LittleBigEventEmitter (opts) {

  opts = opts || {}
  
  switch(opts.type) {
    case 'redis':
      return new (require('./redis').EventEmitter)(opts)
    default:
      return new EventEmitter()
  }

}
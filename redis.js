var EventEmitter  = require('events').EventEmitter
  , inherits      = require('util').inherits
  , u             = require('ubelt')
  , Redis         = require('redis-raw').Redis
  
exports.RedisEventEmitter = RedisEventEmitter
exports.EventEmitter = RedisEventEmitter

//
// same API as EventEmitter, but with redis
//

/************
 querks:
 
 redis cannot listen for events and publish events on the same connection.


*/

function connect (opts, cb) {
  return Redis(opts.port || 6379, opts.host,function (err, redis) {
    if(err) return cb(err)
    
    if(opts.auth)
      redis.req(['AUTH', opts.auth], function (err) {
        if(err) return cb(err)
          callback(null, redis)        
      })
    else
      callback(null, redis)
  })
}

function RedisEventEmitter (opts) {
  if(!(this instanceof RedisEventEmitter )) return new RedisEventEmitter(opts)
  var ree = this
    , l = null
    , e = null
  //EventEmitter.call(this)  
  var emitter = new EventEmitter()
  function emitError (err, reply) {
    if(err) emitter.emit(err)
  }

  ree.addListener = ree.on = function (event, func) {
    if(!l) {
      l = connect(emitError)
      l.onMessage = function (event, args) {
        try { args = JSON.parse(args) } catch (_err) {err = _err}
        args.unshift(event)
        emitter.emit.apply(emitter, args)
      }
    }
    //subscribe on the backend if we arn't already
    if(!emitter.listeners(event).length)
      l.req(['SUBSCRIBE', event], emitError)
    emitter.on(event, func)
  }

  ree.emit = function () {
    var args = [].slice.call(arguments)
      , event = args.shift()
    if(!e) {
      e = connect(emitError)
    }
    e.req(['PUBLISH', event, JSON.stringify(args)], emitError)   
  }

  ree.removeListener = function (event, listener) {
    emitter.removeListener(event, listener)
    if(!emitter.listeners(event).length)
      l.req(['UNSUBSCRIBE', event], emitError)
  }

  ree.removeAllListeners = function (event) {
    emitter.removeAllListener(event)
     l.req(
      ( event ? ['UNSUBSCRIBE', event]
              : ['UNSUBSCRIBE'] )
      , emitError)
  }

  ree.end = function () {
    if(l) l.socket.end(), l = null
    if(e) e.socket.end(), e = null
  }
  ree.destroy = function () {
    if(l) l.socket.destroy(), l = null
    if(e) e.socket.destroy(), e = null
  }
}

if(!module.parent) {
  var r = new RedisEventEmitter()
  
  r.on('hello', console.error)
  r.on('goodbye', function () {
    r.end && r.end () //keep thing as expressions
    console.error('goodbye')
  })
  
  var emit = u.delay(
  r.emit.bind(r)
  , 0)

  emit('hello', 'eonutonte')
  emit('hello', Math.random())
  emit('hello', [1,2,3])
  emit('goodbye')
}

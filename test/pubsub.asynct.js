var PubSub  = require('../redis-pubsub')
  , it      = require('it-is')
  , ctrl    = require('ctrlflow')
  , u       = require('ubelt')

exports ['test interface'] = function (test) {

  var ps = new PubSub()

  it(ps).has({
    connect       : it.isFunction (),
    disconnect    : it.isFunction (),
    
    publish       : it.isFunction (),
    subscribe     : it.isFunction (),
    unsubscribe   : it.isFunction (), 
  
    //users overwrite these, but should expect defaults.
    onError       : it.isFunction (), 
    onMessage     : it.isFunction (), 
    onDisconnect  : it.isFunction (), 
  })

  test.done()
}

exports ['test connect disconnect'] = function (test) {

  var ps = new PubSub()
 
  ps.connect(function (err) {
    if(err) throw err
    ps.disconnect(function (err) {
      if(err) throw err
      test.done()
    })
  })
}

exports ['test subscribe publish'] = function (test) {

  var ps = new PubSub()
    , random = Math.random()

  ps.onMessage = function (event, message) {
    console.log('MESSAGE!',arguments)
    ps.disconnect(function () {
      it(message).equal(random)
      it(event).equal('hello')
      test.done()
    })
  }

  ctrl(
    ps.connect,
    [ps.subscribe, 'hello'],
    [ps.publish, 'hello', random]
  ).call(ps, function (err) {
    console.error('published!!!', arguments)
    if(err)
      throw err
  })
}

exports ['one hundred events'] = function (test) {

  var ps = new PubSub()
    , called = 0
    , randoms = u.times(100, function () {
        return [Math.random(), {hello: Math.random()}]
      })
    , randoms2 = u.times(100, function () {
        return ['hehehehe', Math.random(), {different: Math.random(), moreRandomness: Math.random()}]
      })


  //redis happens to be request/response, and answers will be in order.
  //I don't actually care about that... so should relax this test.

  ps.onMessage = function (random, message) {
    it(random).equal('random')
    it(message).deepEqual(randoms[called ++])
    console.error(message)
    if(called >= 100) {
      ps.disconnect(test.done)
    }
  }

  ctrl(
    ps.connect,
    [ps.subscribe, 'random']
    [ps.subscribe, 'random']
  ).call(ps, function (err) {
    console.log('enui !!!!!!!!')
    if(err)
      throw err
    randoms.forEach(function (i){
      ps.publish('random', i, function () {})
    })
//    randoms2.forEach(function (i){
  //    ps.publish('random2', i, function () {})
    //})
  })
  
}
//*/

#LittleBigEvents

LittleBigEvents is behaves almost exactly like node's EventEmitter.  
By default in runs is memory, in one node process.  
Exactly like EventEmitter, that is the 'little' part.  

The 'Big' part is that you can set it to connect to a remote backend,   
and then have a scalable backend that can communicate across processes and servers.

##example

`little-big-events` is be drop-in compatible with core's `events`:

>i'll give an example where a new user is created on some webservice,  
>which emits a 'new user' event, a worker in the app is listening for  
>new users are performs some action, i.e, emailing the new user

``` js

var EventEmitter = //require('events').EventEmitter
      require('little-big-events').EventEmitter 
  , emitter = new EventEmitter()
  ;
  
app.post('/users/:name/new', function (req, res) {

  //create the user, whatever
  var user = new User() 
  emitter.emit('new-user', user)

})

emitter.on('new-user', function (user) {
  sendMail(user.email, 'welcome to our great platform!!!')
})

```

Of course, our service starts getting really popular,  
and we want to run each part of the app in a seperate process,  
on a seperate server.  

Here is how we do that:

First, refactor our app,

``` js

//emitter.js

var EventEmitter = //require('events').EventEmitter
      require('little-big-events').EventEmitter 
  , emitter = new EventEmitter()
  ;

  module.exports = emitter
  
```

``` js
//server.js

var emitter = require('./emitter')

app.post('/users/:name/new', function (req, res) {

  //create the user, whatever
  var user = new User() 
  emitter.emit('new-user', user)

})

```

``` js
// mailer.js

var emitter = require('./emitter')

emitter.on('new-user', function (user) {
  sendMail(user.email, "welcome to our great platform!!!')
})

```

If we run mailer.js and server.js in the same process, 
it will be just the same as before,  
an ordinary EventEmitter running in memory,  

Now, this is what we have to do to start it running across processes.

``` js
// emitter.js

var EventEmitter = //require('events').EventEmitter
      require('little-big-events').EventEmitter 
  , emitter = new EventEmitter({
      id: 'awesowe'
    , type: 'couchdb'
    , url {hostname: 'localhost', port: 5984} 
    , auth {username: U, password: P}
    })
  ;

  module.exports = emitter

```

This will write emit events by saving them to couchdb, and listen for them on the couchdb changes feed.
This new couchdb-backed EventEmitter still has exactly the same public API as before, which means that it is possible to just 'drop in' scaling.  
<em>And it is still possible to scaledown to a single process for testing.</em>

>note: all events will be buffered until the LittleBigEventEmitter is connected to the backend.

The only caveat here is that the `mailer` and the `server` cannot share any common object references.
That is a bad way to design an application anyway. When the only way for `server` to affect `mailer`
is to emit a 'new-user' event, then we only need to test that it's emitting valid 'new-user' events, which is easy!

>note: a dnode based backend, i.e. hook.io, would allow references to functions to be passed to event listeners, although in my opinion, it's better to avoid that complexity.

So, what we get is a scalable application that is easy to fix and hard to break!

## possible backend implementations:

  * couchdb
  * redis
  * rabbitMQ
  * Hook.io
  * a custom streaming node server
  * others ?

each of these backends will have different scaling abilities, so must be chosen (any implemented) according to your needs.

## implementing a backend

`LitteBigEventEmitter` backends are easy to implement.

all that is needed is a create function that returns an object with these 5 methods:

  * `connect (callback)`  
  connect to backend
  * `disconnect (ready)`  
  disconnect from backend
  * `emit (eventName, data, callback)`  
  send event to backend. callback must be called when backend has recieved event.
  if an error has occured, this event will be retried later.
  * `listen (eventName, listener, callback)`  
  register a listener. note it is only necessary to register one listener.
  LittleBigEventListener will not call listen more that once for the same event name.
  if callback returns an error, registering this listener will be retried later.
  if `listener` is called twice with the same eventName it is okay to throw.
  * `unlisten (eventName, listener)`  
  if necessary, deregister the event on the backend.
  * `events ()`
  return the list of events.

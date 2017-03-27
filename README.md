# brightsocket.io

#### Currently in beta.

Brightsocket.io is an abstraction over Socket.io that makes managing socket connection pools and building websocket-based APIs easier than ever before!

It works like this:

### 1. Start with a Socket.io-compatible webserver.

In this case, we'll use express, just because most people are familiar with it.

```javascript
import http from 'http';
import express from 'express';
import brightsocket from 'brightsocket.io';

const app = express();
const server = http.Server(app);

server.listen(8080);

app.get('/', (req, res) => res.sendFile('index.html'));
```

### 2. Launch brightsocket and pass it the server.

The server object you pass in here is the same one you would pass to Socket.io if you were using it raw.

```javascript
const api = brightsocket(server);
```

### 3. Create a connection channel.

The first thing our client side code is going to do when it connects is tell us which connection channel it wants to use. Connection channels are just arbitrarily named chunks of your API. Using channels allows you to do things like divide your API into partitions based on user type, and even require authentication right away.

```javascript
api.connect('BASIC_CHANNEL', (connection, identity, webserver) => {
  connection.send('IDENTIFIED', 'Congratulations, you identified yourself!');

  // Your socket API will be defined here //
});
```

This tiny snippet of code does many things. First, it sets up a connection listener. Whenever a new connection is detected, it will set up a subsequent listener for an incoming connection to identify which channel it would like to use. No other socket events will be acknowledged until the client side sends us this event. Using the Brightsocket client-side library, that would look like this:

```javascript
// Client Side (using brightsocket.io-client library)
const socket = brightsocket();
socket.connect('BASIC_CHANNEL', <OPTIONAL_PAYLOAD>);
```

On the server side, any connections that correctly identify a channel will get filtered into the `connect` callback. That callback takes the connection itself, the payload that came through with the channel-identification action, and your raw webserver, in case you need it.

### 4. Define the rest of your API.

```javascript
// We already wrote this line in step 3. You don't need to write it again.
api.connect('BASIC_CHANNEL', (connection, identity, webserver) => {
  connection.send('IDENTIFIED', 'Congratulations, you identified a channel!');

  connection.receive('GET_USER', payload => {
    database.getUser(payload.id).then(user => connection.send('GOT_USER', user));
  })
});
```

## Well that seems pretty cool.

Correct.

## But can you really write a full-featured API with it?

Yes. Here's an example using authentication and middleware:

```javascript
// Server Side

// Import all of our dependencies. In this case we'll use
// brightsocket in connection with express and
// jsonwebtoken for authentication.
import express from 'express';
import http from 'http';
import path from 'path';
import jwt from 'jsonwebtoken';
import brightsocket from 'brightsocket.io'

// Create our express server.
const app = express();
const server = http.Server(app);

// Create our brightsocket API builder.
const api = brightsocket(server);

// Normally this would be in the database, obviously,
// but for simplicity sake, here's the auth record we'll
// need the client side to match.
const expectedCred = {
  username: 'fake@fake.com',
  password: 'password'
};

// And here's an example of a full user record. We'll
// return this to the browser when it successfully
// authenticates.
const userRecord = {
  id: 123,
  firstname: 'John',
  lastname: 'Doe',
  email: 'fake@fake.com'
};

// A random secret for signing json web tokens.
const jwtSecret = 'How much wood would a wood chuck chuck?';

// Ok, let's start up our webserver.
server.listen(8080);

// And let's serve up an html file when the user
// connects via http.
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, './index.html'));
});

// Listen for new socket connections that identify
// themselves as `MY_CHANNEL` connections.
api.connect('MY_CHANNEL', (connection, identity, webserver) => {

  // Check this out. We're going to store our web token
  // here and never even hand it back to the browser.
  let token;

  // So let's say a new USER connection comes in. We
  // expect the payload to have
  // a `username` and `password` key.
  // First lets handle what we do when we don't get a
  // match.
  if (identity.username !== expectedCred.username ||
      identity.password !== expectedCred.password) {

    // If the username and password combo is bad, we'll
    // tell the user they've got a problem.
    connection.send('UNAUTHORIZED', "Username or pwd didn't match");

  // If login credentials DO match, we can authenticate
  // the user and give the connection access to the rest of
  // the socket API.
  } else {

    // We'll go ahead and sign a web token with the user
    // record then store it here in this closure. We can do that
    // in some cases because the websocket connection is
    // inextricably tied to a browser session.
    token = jwt.sign({
      data: userRecord,
      exp: Math.floor(Date.now() / 1000) + (60 * 60)
    }, jwtSecret);

    // Now we're going to apply middleware to all incoming messages.
    // For anything that comes in on this connection, we'll attempt to
    // verify the token.
    connection.addFilter((action, payload, next) => {
      jwt.verify(token, jwtSecret, (err) => {

        // If there's no error, the token is valid and we'll call
        // `next`. This allows the incoming message to be passed
        // down to the rest of the event handlers.
        if (!err) {
          next();

        // If the token is invalid, we'll tell the user they're not
        // authorized. Since we don't call `next` here, the rest
        // of our event listeners will never even see this message.
        } else {
          connection.send('UNAUTHORIZED', 'Sorry, bro.');
        }
      });
    });

    // Now it's time to tell the user they were successfully identified.
    connection.send('AUTHENTICATED', userRecord);

    // And lastly, we can define the rest of our API. Each of these
    // event listeners will only be triggered if the incoming message
    // passes our token verification step. Since the token is only
    // applicable to this connection, we lose it as soon as the socket
    // connection is severed.
    connection.receive('FAVORITE_FOOD', () => {
      connection.send('GOT_FAVORITE_FOOD', 'spaghetti');
    });
    connection.receive('FAVORITE_MOVIE', () => {
      connection.send('GOT_FAVORITE_MOVIE', 'Moana');
    });

  }

});
```

And here's the corresponding client side code:

```javascript
// Client Side (using brightsocket.io-client included on index.html)

// We'll begin by turning on Socket.io.
const socket = brightsocket();

// And, based on our server side code, the first thing we
// need to do is identify a channel.
socket.connect('MY_CHANNEL', {
  username: 'fake@fake.com',
  password: 'password'
});

// If at any point something goes wrong, we'll set up
// a handler for when the server tells us we're not
// authorized.
socket.receive('UNAUTHORIZED', msg => {
  console.log('Unauthorized because:', msg);
});

// Now let's set up a handler for when the server
// lets us know that we've successfully authenticated.
socket.receive('AUTHENTICATED', usr => {
  console.log('The user record:', usr);

  // Since we know we're authenticated now, this is a
  // good time to start asking the server for more things.
  socket.send('FAVORITE_FOOD');
  socket.send('FAVORITE_MOVIE');
});

// Might as well actually handle responses to those
// other requests too.
socket.receive('GOT_FAVORITE_FOOD', food => console.log(food));
socket.receive('GOT_FAVORITE_MOVIE', movie => console.log(movie));
```

## Can I use the server library without the client library?

If you must. Here's what you'd need to do to get around the client library:

```javascript
// using socket.io
var socket = io();
socket.emit("BRIGHTSOCKET:IDENTIFY", {
  "BRIGHTSOCKET:CHANNEL": "MY_CHANNEL",
  // any other values to send go in this object
});
// From here, just use socket.on and socket.emit
// instead of receive and send but it might get
// a little clunky.
```

## Can I combine pre-identified user channels?

You sure can. Here's an example:

```javascript
const api = brightsocket(server);

api.connect('ALL_USERS', connection => {
  connection.receive('MESSAGE', () => {
    console.log('This should be logged for all users');
  });
});

api.connect('BASIC_USER', ['ALL_USERS'], connection => {
  connection.receive('MESSAGE', () => {
    console.log('This only gets logged for basic users');
  });
});

api.connect('ADMIN_USER', ['ALL_USERS'], connection => {
  connection.receive('MESSAGE', () => {
    console.log('This only gets logged for admins');
  });
});
```

In the above example, basic user and admin user channels each have their own console log that occurs whenever a `MESSAGE` comes through. However, because each of these channels "extends" the `ALL_USERS` channel, the `ALL_USERS` console log will occur whenever a `MESSAGE` comes through for either of the other channels as well.

And that's all there is to it. Super easy.

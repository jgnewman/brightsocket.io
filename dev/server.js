import express from 'express';
import http from 'http';
import path from 'path';
import jwt from 'jsonwebtoken';
import brightsocket from '../bin/brightsocket'

const app = express();
const server = http.Server(app);
const api = brightsocket(server);

const expectedCred = {
  username: 'fake@fake.com',
  password: 'password'
};

const userRecord = {
  id: 123,
  firstname: 'John',
  lastname: 'Doe',
  email: 'fake@fake.com'
};

const jwtSecret = 'How much wood would a wood chuck chuck?';

// Serve up the html file when the user connects via http.
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, './index.html'));
});

// Listen for a new socket connection to identify as a USER type.
api.identify('USER', (connection, identity, webserver) => {
  let token;

  // When we get a new user connection, check to make sure their
  // login credentials match.
  if (identity.username === expectedCred.username &&
      identity.password === expectedCred.password) {

    // When login credentials match, sign a jsonwebtoken.
    token = jwt.sign({
      data: userRecord,
      exp: Math.floor(Date.now() / 1000) + (60 * 60)
    }, jwtSecret);

    // Apply middleware to incoming messages. For anything that comes in
    // on this connection, verify the token. If it's invalid, consider the
    // user unauthorized. If it's valid, allow the connection to go through.
    connection.addFilter((action, payload, next) => {
      jwt.verify(token, jwtSecret, (err) => {
        if (err) {
          connection.send('err:UNAUTHORIZED', 'Username or password did not match');
        } else {
          next();
        }
      });
    });

    // Tell the user they're authorized
    connection.send('ok:IDENTIFIED', userRecord);

    // Define the rest of the API
    connection.receive('FAVORITE_FOOD', () => connection.send('ok:FAVORITE_FOOD', 'spaghetti'));
    connection.receive('FAVORITE_MOVIE', () => connection.send('ok:FAVORITE_MOVIE', 'Moana'));

  // If login credentials don't match, consider them unauthorized.
  } else {
    connection.send('err:UNAUTHORIZED', 'Username or password did not match');
  }


});

export default server;

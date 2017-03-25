import brightsocket from 'brightsocket.io-client';

const socket = brightsocket();

socket.identify('USER');

socket.receive('err:UNAUTHORIZED', function (payload) {
  console.log(payload);
  console.log('trying again');
  socket.identify('USER', {
    username: 'fake@fake.com',
    password: 'password'
  });
});

socket.receive('ok:IDENTIFIED', function (payload) {
  console.log('successfully identified', payload);
  socket.send('FAVORITE_FOOD');
  socket.send('FAVORITE_MOVIE');
});

socket.receive('ok:FAVORITE_FOOD', function (payload) {
  console.log('favorite food is', payload);
});

socket.receive('ok:FAVORITE_MOVIE', function (payload) {
  console.log('favorite movie is', payload);
});

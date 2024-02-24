const io = require('socket.io-client');

const socket = io('wss://srv.aiaegis.org', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected to server');

  // Emit a test event
  socket.emit('test', { message: 'Hello from client' });

  // Listen for a response
  socket.on('testResponse', data => {
    console.log('Response from server:', data);
    socket.disconnect();
  });
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('connect_error', error => {
  console.error('Connection error:', error);
});

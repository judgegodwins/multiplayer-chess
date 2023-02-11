const express = require('express');
const app = express();
const http = require('http');
const { v4: uuidV4 } = require('uuid');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: '*'
});

const port = 8080

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('username', (username) => {
    console.log(username);  
    socket.data.username = username;
  })

  socket.on('createRoom', async (callback) => {
    const roomId = uuidV4();
    await socket.join(roomId);
    rooms.set(roomId, [socket.data?.username]);
    callback(roomId);
  });

  socket.on('joinRoom', async (args, callback) => {
    const room = await io.in(args.roomId).fetchSockets();
    if (room.length === 0) {
      if (callback) callback({
        error: true,
        message: 'room is empty'
      });

      return;
    }

    rooms.set(args.roomId, [...rooms.get(args.roomId), socket.data.username]);

    await socket.join(args.roomId);

    const players = rooms.get(args.roomId);
    callback({
      roomId: args.roomId,
      players,
    })

    socket.to(args.roomId).emit('opponentJoined', players)
  });

  socket.on('move', (data) => {
    console.log('move', data.move);
    socket.to(data.room).emit('move', data.move);
  })

});

server.listen(port, () => {
  console.log(`listening on *:${port}`);
});
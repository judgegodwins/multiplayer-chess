const express = require('express');
const { Server } = require("socket.io");
const { v4: uuidV4 } = require('uuid');
const http = require('http');

const app = express(); // initialize express

const server = http.createServer(app);


// set port to value received from environment variable or 8080 if null
const port = process.env.PORT || 8080 

// upgrade http server to websocket server
const io = new Server(server, {
  cors: '*', // allow connection from any origin
});

const rooms = new Map();

// io.connection
io.on('connection', (socket) => {
  // socket refers to the client socket that just got connected.
  // each socket is assigned an id
  console.log(socket.id, 'connected');

  socket.on('username', (username) => {
    console.log('username:', username);
    socket.data.username = username;
  });

  socket.on('createRoom', async (callback) => { // callback here refers to the callback function from the client passed as data
    const roomId = uuidV4(); // <- 1 create a new uuid
    await socket.join(roomId); // <- 2 make creating user join the room
	 
    // set roomId as a key and roomData including players as value in the map
    rooms.set(roomId, { // <- 3
      roomId,
      players: [{ id: socket.id, username: socket.data?.username }]
    });
    // returns Map(1){'2b5b51a9-707b-42d6-9da8-dc19f863c0d0' => [{id: 'socketid', username: 'username1'}]}

    callback(roomId); // <- 4 respond with roomId to client by calling the callback function from the client
  });

  socket.on('joinRoom', async (args, callback) => {
    // check if room exists and has a player waiting
    const room = rooms.get(args.roomId);
    let error, message;
  
    if (!room) { // if room does not exist
      error = true;
      message = 'room does not exist';
    } else if (room.length <= 0) { // if room is empty set appropriate message
      error = true;
      message = 'room is empty';
    } else if (room.length >= 2) { // if room is full
      error = true;
      message = 'room is full'; // set message to 'room is full'
    }

    if (error) {
      // if there's an error, check if the client passed a callback,
      // call the callback (if it exists) with an error object and exit or 
      // just exit if the callback is not given

      if (callback) { // if user passed a callback, call it with an error payload
        callback({
          error,
          message
        });
      }

      return; // exit
    }

    await socket.join(args.roomId); // make the joining client join the room

    // add the joining user's data to the list of players in the room
    const roomUpdate = {
      ...room,
      players: [
        ...room.players,
        { id: socket.id, username: socket.data?.username },
      ],
    };

    rooms.set(args.roomId, roomUpdate);

    callback(roomUpdate); // respond to the client with the room details.

    // emit an 'opponentJoined' event to the room to tell the other player that an opponent has joined
    socket.to(args.roomId).emit('opponentJoined', roomUpdate);
  });

  socket.on('move', (data) => {
    // emit to all sockets in the room except the emitting socket.
    socket.to(data.room).emit('move', data.move);
  });

  socket.on("disconnect", () => {
    const gameRooms = Array.from(rooms.values()); // <- 1

    gameRooms.forEach((room) => { // <- 2
      const userInRoom = room.players.find((player) => player.id === socket.id); // <- 3

      if (userInRoom) {
        if (room.players.length < 2) {
          // if there's only 1 player in the room, close it and exit.
          rooms.delete(room.roomId);
          return;
        }

        socket.to(room.roomId).emit("playerDisconnected", userInRoom); // <- 4
      }
    });
  });

  socket.on("closeRoom", async (data) => {
    socket.to(data.roomId).emit("closeRoom", data); // <- 1 inform others in the room that the room is closing

    const clientSockets = await io.in(data.roomId).fetchSockets(); // <- 2 get all sockets in a room

    // loop over each socket client
    clientSockets.forEach((s) => {
      s.leave(data.roomId); // <- 3 and make them leave the room on socket.io
    });

    rooms.delete(data.roomId); // <- 4 delete room from rooms map
  });
});

server.listen(port, () => {
  console.log(`listening on *:${port}`);
});
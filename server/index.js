require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const {Server} = require("socket.io")

app.use(cors());



const harperSaveMessage = require('./services/harper-save-message')
const harperGetMessages = require('./services/harper-get-messages');
const server = http.createServer(app);
const CHAT_BOT = 'ChatBot'
let chatRoom = ""
let allUsers = []
const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  // Listen for when the client connects via socket.io-client
io.on('connection', (socket) => {
    console.log(`User connected ${socket.id}`);



    socket.on('join_room', (data) => {

        const { username, room } = data; // Data sent from client when join_room event emitted
      
        socket.join(room);
        let __createdtime__ = Date.now();

        harperGetMessages(room)
        .then((last100Messages) => {
 
          socket.emit('last_100_messages', last100Messages);
        })
        .catch((err) => console.log(err));

        socket.to(room).emit('receive_message', {
            message: `${username} has joined the chat room`,
            username: CHAT_BOT,
            __createdtime__,
            });
        socket.emit('receive_message', {
            message: `Welcome ${username}`,
            username: CHAT_BOT,
            __createdtime__,
            });


        chatRoom = room
        allUsers.push({ id: socket.id, username, room });
        chatRoomUsers = allUsers.filter((user) => user.room === room);
        socket.to(room).emit('chatroom_users', chatRoomUsers);
        socket.emit('chatroom_users', chatRoomUsers);


    });
    socket.on('send_message', (data) => {
        const { message, username, room, __createdtime__ } = data;
        io.in(room).emit('receive_message', data); // Send to all users in room, including sender
        harperSaveMessage(message, username, room, __createdtime__) // Save message in db
          .then((response) => console.log(response))
          .catch((err) => console.log(err));
      });




});


app.get("/", (req,res)=>{
    res.send("This is the server responding")
})





server.listen(4000, () => 'Server is running on port 4000');
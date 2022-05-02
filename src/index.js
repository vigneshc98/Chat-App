const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require('./utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');

const app = express(); //generate new application
const server = http.createServer(app); //manually doing it, actually its done in background by express
const io = socketio(server); //socket io expects to be called by a server, now our server support websocket 

const port = process.env.PORT;

const publicDirectoryPath = path.join(__dirname,'../public');
app.use(express.static(publicDirectoryPath));

//server (emit) => client (recieves) - countUpdated
//client (emit) => server (recieves) - increment

let count =0;
io.on('connection',(socket)=>{
    console.log('new socket connection');

    // socket.emit('message',generateMessage("welcome sir"));
    // socket.broadcast.emit('message',generateMessage('A new user has joined the chat!'));

    //socket.emit, socket.io, socket.broadcast.emit  := to everyone 
    //io.to.emit, socket.broadcast.to.emit           := to specific room

    socket.on('join',(options,callback)=>{
        const {error, user} = addUser({'id':socket.id,...options });
        // console.log(user);
        if(error){
            return callback(error);
        }
        socket.join(user.room);

        socket.emit('message',generateMessage("welcome sir","Admin"));
        socket.broadcast.to(user.room).emit('message',generateMessage(`${user.username} has joined the chat!`,"Admin"));
        io.to(user.room).emit('roomData',{
            'room':user.room,
            'users': getUsersInRoom(user.room)
        });

        callback();
    });

    // socket.emit('countUpdated',count); //if we use io.emit(..), on refreshing of single page all other page will get effected (will get log message from chat.js ie., "Count has been updated ',count" , count value will not change)

    // socket.on('increment',()=>{
    //     count++;
    //     // socket.emit('countUpdated',count); //emit to specific or single connections
    //     io.emit('countUpdated',count); //emit to all the connections
    // });

    socket.on('message-send',(msg,callback)=>{  
        const user = getUser(socket.id);

        const filter = new Filter();
        if(filter.isProfane(msg)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message',generateMessage(msg,user.username));
        callback();
    });

    socket.on('sendLocation',(data,callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage',generateLocationMessage(`https://google.com/maps?q=${data.latitude},${data.longitude}`,user.username));
        callback('Location shared successfully')
    });

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message',generateMessage(`${user.username} has left the chat!`,"Admin"));
            io.to(user.room).emit('roomData',{
                'room':user.room,
                'users': getUsersInRoom(user.room)
            });
        }
    });
});

server.listen(port, ()=>{
    console.log('server started on port ',port);
});
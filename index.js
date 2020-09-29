var express = require('express');
var path = require('path');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var port = 3000;

//Listen for calls to our static pages
app.use(express.static(path.join(__dirname, 'static')));

//A list of objects in our game
let objects = [];

//Listen for clients to connect
io.on('connection', function (socket) {
  console.log('a user connected');

  //Listen for a user to request a new game object
  socket.on('join', function (msg) {

    console.log(msg);

    //Create a new game object
    let newObject = { id: socket.id, x: Math.random() * 500, y: Math.random() * 500 };

    //Add the game object to our list of game objects
    objects.push(newObject)
    console.log(objects);

    //Tell the new user about the game object
    socket.emit('joinaccept', newObject);

    //Tell the new user about the other new objects
    for (let object of objects) {
      if (object.id != socket.id)
        socket.emit('update', object);
    }

    //Tell all the other users about the new user
    socket.broadcast.emit('update', newObject);

  });

  //Listen for the user to move
  socket.on('move', msg => {
    let object = objects.find(i => i.id == socket.id);
    if (object) {
      //Update the object
      object.x = msg.x;
      object.y = msg.y;
      //Update the other objects
      socket.broadcast.emit('update', object);
    }
  });

  //Listen for a user to leave
  socket.on('disconnect', function () {
    console.log("disconnected");

    //Remove the user from our list of game objects
    objects = objects.filter(i => i.id != socket.id);
    console.log(objects);

    //Update all remaining users on the list of valid users
    io.sockets.emit("valid", objects.map(i => i.id));
  })
});


// Listen for requests
var server = http.listen(port, function () {
  console.log('listening on http://localhost:' + port);
});
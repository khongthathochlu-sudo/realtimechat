const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log(`Người dùng kết nối: ${socket.id}`);

  socket.on('join', (username) => {
    socket.username = username;
    socket.broadcast.emit('user-joined', { username, id: socket.id });
    console.log(`${username} đã tham gia phòng chat`);
  });

  socket.on('chat-message', (data) => {
    io.emit('chat-message', {
      id: socket.id,
      username: socket.username || 'Khách',
      message: data.message,
      timestamp: Date.now(),
    });
  });

  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username || 'Khách',
    });
  });

  socket.on('stop-typing', () => {
    socket.broadcast.emit('stop-typing');
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('user-left', { username: socket.username, id: socket.id });
      console.log(`${socket.username} đã rời phòng chat`);
    } else {
      console.log(`Người dùng ngắt kết nối: ${socket.id}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

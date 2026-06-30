const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

// Đối tượng lưu trữ danh sách người dùng đang online (id: username)
const users = {};

io.on('connection', (socket) => {
    console.log('Có người kết nối:', socket.id);

    // Khi người dùng gửi tên của họ lên lúc vừa vào web
    socket.on('join', (username) => {
        users[socket.id] = username || 'Người dùng ẩn danh';
        // Gửi danh sách cập nhật mới nhất cho TẤT CẢ mọi người
        io.emit('updateUserList', Object.values(users));
        
        // Thông báo hệ thống có người vào phòng
        socket.broadcast.emit('message', {
            user: 'Hệ thống',
            text: `${users[socket.id]} đã tham gia phòng chat.`
        });
    });

    // Khi có tin nhắn mới
    socket.on('chatMessage', (msg) => {
        io.emit('message', {
            user: users[socket.id] || 'Ẩn danh',
            text: msg
        });
    });

    // Khi có người thoát (đóng tab)
    socket.on('disconnect', () => {
        if (users[socket.id]) {
            const leftUser = users[socket.id];
            delete users[socket.id];
            // Cập nhật lại danh sách cho những người còn lại
            io.emit('updateUserList', Object.values(users));
            io.emit('message', {
                user: 'Hệ thống',
                text: `${leftUser} đã rời phòng chat.`
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});

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

    // 1. Khi người dùng vừa vào web và gửi tên của họ lên
    socket.on('join', (username) => {
        users[socket.id] = username || 'Người dùng ẩn danh';
        
        // Gửi danh sách cập nhật mới nhất cho TẤT CẢ mọi người
        io.emit('updateUserList', Object.values(users));
        
        // Gửi thông báo hệ thống là có người mới vào phòng
        socket.broadcast.emit('message', {
            user: 'Hệ thống',
            text: `${users[socket.id]} đã tham gia phòng chat.`
        });
    });

    // 2. Khi có người gửi tin nhắn mới
    socket.on('chatMessage', (msg) => {
        io.emit('message', {
            user: users[socket.id] || 'Ẩn danh',
            text: msg
        });
    });

    // 3. Khi có người thoát (đóng tab hoặc mất mạng)
    socket.on('disconnect', () => {
        if (users[socket.id]) {
            const leftUser = users[socket.id];
            delete users[socket.id];
            
            // Gửi lại danh sách mới sau khi đã xóa người thoát ra
            io.emit('updateUserList', Object.values(users));
            
            // Thông báo cho mọi người biết có người rời phòng
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

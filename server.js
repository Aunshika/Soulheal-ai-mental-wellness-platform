require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const Message = require('./models/Message');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io for real-time chat
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/assessment', require('./routes/assessment'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'SoulHeal API running ✅' }));

// Socket.io chat
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_room', ({ userId, roomId }) => {
    socket.join(roomId);
    onlineUsers.set(userId, socket.id);
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });

  socket.on('send_message', async (data) => {
    const timestamp = new Date().toISOString();
    const finalMsg = { ...data, timestamp };
    
    io.to(data.roomId).emit('receive_message', finalMsg);

    const match = data.roomId.match(/^appt_(.+)$/);
    if (match) {
      try {
        await Message.create({
          appointmentId: match[1],
          roomId: data.roomId,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          attachment: data.attachment,
          timestamp: timestamp
        });
      } catch (err) { console.error('Error saving message to DB:', err.message); }
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    onlineUsers.forEach((sId, userId) => {
      if (sId === socket.id) onlineUsers.delete(userId);
    });
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 SoulHeal server running on port ${PORT}`));


import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.SIGNALING_SERVICE_PORT || 5506;

const usersInRoom = {};

io.on('connection', (socket) => {
  console.log(`[Signaling] User connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`[Signaling] User ${socket.id} joined room: ${roomId}`);

    if (!usersInRoom[roomId]) {
      usersInRoom[roomId] = [];
    }
    usersInRoom[roomId].push(socket.id);

    socket.to(roomId).emit('user-connected', socket.id);
  });

  socket.on('send-offer', ({ target, offer }) => {
    console.log(`[Signaling] Relay offer from ${socket.id} to ${target}`);
    socket.to(target).emit('receive-offer', { sender: socket.id, offer });
  });

  socket.on('send-answer', ({ target, answer }) => {
    console.log(`[Signaling] Relay answer from ${socket.id} to ${target}`);
    socket.to(target).emit('receive-answer', { sender: socket.id, answer });
  });

  socket.on('send-ice-candidate', ({ target, candidate }) => {
    console.log(`[Signaling] Relay ICE candidate from ${socket.id} to ${target}`);
    if (target === 'broadcast') {
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
            if (room !== socket.id) {
                socket.to(room).emit('receive-ice-candidate', { sender: socket.id, candidate });
            }
        });
    } else {
        socket.to(target).emit('receive-ice-candidate', { sender: socket.id, candidate });
    }
  });

  socket.on('disconnecting', () => {
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room !== socket.id) {
        socket.to(room).emit('user-disconnected', socket.id);
        if (usersInRoom[room]) {
          usersInRoom[room] = usersInRoom[room].filter(id => id !== socket.id);
        }
      }
    });
  });

  socket.on('disconnect', () => {
    console.log(`[Signaling] User disconnected: ${socket.id}`);
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Signaling-Service' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Signaling Server running on http://localhost:${PORT}`);
});

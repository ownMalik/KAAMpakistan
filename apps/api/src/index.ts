import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.routes.ts';
import providerRoutes from './routes/provider.routes.ts';
import searchRoutes from './routes/search.routes.ts';
import requestRoutes from './routes/request.routes.ts';
import messageRoutes from './routes/message.routes.ts';
import providerRoutes from './routes/provider.routes.ts';
import reviewRoutes from './routes/review.routes.ts';
import safetyRoutes from './routes/safety.routes.ts';
import adminRoutes from './routes/admin.routes.ts';
import trustRoutes from './routes/trust.routes.ts';
import adminRoutes from './routes/admin.routes.ts';

// ...






dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trust', trustRoutes);
app.use('/api/admin', adminRoutes);



app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'KAAM PAKISTAN API' });
});

// Real-time socket connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('send_message', (data) => {
    io.to(data.conversationId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`KAAM PAKISTAN API running on port ${PORT}`);
});
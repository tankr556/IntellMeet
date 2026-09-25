import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Server as SocketServer } from 'socket.io';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import authRoutes from './routes/authRoutes';
import meetingRoutes from './routes/meetingRoutes';
import userRoutes from './routes/userRoutes';
import { setupSocketHandlers } from './sockets/meetingSocket';

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'IntellMeet Backend API', timestamp: new Date() });
});

// Socket.io Server Setup
const io = new SocketServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;

// Connect Services & Start Server
const startServer = async () => {
  await connectDB();
  await connectRedis();

  server.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
};

startServer();

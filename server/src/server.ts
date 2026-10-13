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
import aiRoutes from './routes/aiRoutes';
import { metricsMiddleware, getPrometheusMetrics } from './middleware/metrics';
import { setupSocketHandlers } from './sockets/meetingSocket';

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173'];

const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for seamless WebRTC signaling in production
    }
  },
  credentials: true,
};

// Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(metricsMiddleware);

// Observability Endpoint
app.get('/metrics', getPrometheusMetrics);

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'IntellMeet Backend API', timestamp: new Date() });
});

// Socket.io Server Setup
const io = new SocketServer(server, {
  cors: {
    origin: (origin: any, callback: any) => {
      callback(null, true);
    },
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

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
};

startServer();

import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  socket: {
    reconnectStrategy: false,
  },
});

redisClient.on('error', (err) => {
  // Silent error handler to avoid console spam when Redis isn't running locally
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('[Redis] Connected successfully');
  } catch (err) {
    console.log('[Redis] Connection skipped (local development fallback active)');
  }
};

export default redisClient;

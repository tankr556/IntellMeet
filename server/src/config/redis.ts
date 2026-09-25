import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  // Don't crash local setup if Redis is not locally installed/running
  console.log('[Redis] Notice: Redis not connected locally or unreachable. Fallback enabled.');
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

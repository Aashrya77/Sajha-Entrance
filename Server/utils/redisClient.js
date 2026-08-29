import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_URI || process.env.REDIS;
let redisClient = null;

if (REDIS_URL) {
  try {
    redisClient = new IORedis(REDIS_URL);
    redisClient.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.warn('Redis client error:', err?.message || err);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to initialize Redis client:', err?.message || err);
    redisClient = null;
  }
}

export { redisClient };

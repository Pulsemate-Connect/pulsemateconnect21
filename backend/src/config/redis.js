const Redis = require('ioredis');
const logger = require('./logger');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 5) return null; // stop retrying after 5 attempts
    return Math.min(times * 200, 3000);
  },
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('ready', () => logger.info('Redis ready'));
redis.on('error', (err) => logger.warn('Redis error (non-fatal)', { message: err.message }));
redis.on('close', () => logger.warn('Redis connection closed'));

// Attempt lazy connect — failure is non-fatal; app works without Redis
redis.connect().catch((err) => {
  logger.warn('Redis unavailable — continuing without cache', { message: err.message });
});

module.exports = redis;

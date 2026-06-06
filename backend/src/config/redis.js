const Redis = require('ioredis');
const logger = require('./logger');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times) => {
    if (times > 10) return null; // stop retrying
    return Math.min(times * 100, 3000);
  },
  lazyConnect: false,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { message: err.message }));
redis.on('close', () => logger.warn('Redis connection closed'));

module.exports = redis;

const redis = require('../config/redis');
const logger = require('../config/logger');

/**
 * Cache GET responses in Redis.
 * Key is scoped to user ID + URL to prevent cross-user cache leaks.
 *
 * @param {number} ttlSeconds - Cache TTL in seconds (default 300)
 */
const cache = (ttlSeconds = 300) => async (req, res, next) => {
  if (req.method !== 'GET') return next();

  // Scope cache key to user to prevent cross-user leakage
  const userId = req.user?.id || 'anon';
  const key = `cache:${userId}:${req.originalUrl}`;

  try {
    const cached = await redis.get(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) {
        redis.setex(key, ttlSeconds, JSON.stringify(body)).catch((err) =>
          logger.warn('Cache write failed', { key, error: err.message })
        );
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  } catch (err) {
    // Fail open — never block a request because Redis is down
    logger.warn('Cache lookup failed, proceeding without cache', { error: err.message });
    next();
  }
};

/**
 * Invalidate all cache keys matching a glob pattern.
 * Example: invalidateCache('cache:*:/api/v1/clinic/my*')
 */
const invalidateCache = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug('Cache invalidated', { pattern, count: keys.length });
    }
  } catch (err) {
    logger.warn('Cache invalidation failed', { pattern, error: err.message });
  }
};

module.exports = { cache, invalidateCache };

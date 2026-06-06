const promClient = require('prom-client');

const register = new promClient.Registry();

// Default Node.js metrics (memory, CPU, event loop lag, etc.)
promClient.collectDefaultMetrics({
  register,
  labels: { service: 'pulsemate-api', env: process.env.NODE_ENV },
});

// ── Custom metrics ────────────────────────────────────────────────────────────

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const activeSocketConnections = new promClient.Gauge({
  name: 'socket_active_connections_total',
  help: 'Number of currently active Socket.io connections',
  registers: [register],
});

const appointmentsCreated = new promClient.Counter({
  name: 'appointments_created_total',
  help: 'Total number of appointments created',
  registers: [register],
});

const otpSent = new promClient.Counter({
  name: 'otp_sent_total',
  help: 'Total OTPs sent',
  labelNames: ['provider'],
  registers: [register],
});

const cacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total Redis cache hits',
  registers: [register],
});

const cacheMisses = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total Redis cache misses',
  registers: [register],
});

// Middleware to instrument HTTP requests
const metricsMiddleware = (req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route?.path || req.path || 'unknown';
    const labels = { method: req.method, route, status_code: res.statusCode };
    end(labels);
    httpRequestsTotal.inc(labels);
  });
  next();
};

module.exports = {
  register,
  httpRequestDuration,
  httpRequestsTotal,
  activeSocketConnections,
  appointmentsCreated,
  otpSent,
  cacheHits,
  cacheMisses,
  metricsMiddleware,
};

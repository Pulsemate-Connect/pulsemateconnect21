# PulseMate Connect — Production Deployment Roadmap

> Target: First real clinic onboarded within **30 days**
> Stack: Node.js / Express / PostgreSQL / Prisma / React / Expo / Socket.io
> Author: Generated from codebase audit — June 2026

---

## Executive Summary

PulseMate has a solid MVP with auth, queues, appointments, clinic verification, and real-time updates all working. The gap is entirely infrastructure — there is no Docker, no CI/CD, no Redis, no monitoring, no backup strategy, and the logger only writes to console with no file transport. This roadmap closes all those gaps in priority order across 4 weeks.

---

## Priority Legend

| Symbol | Meaning |
|---|---|
| 🔴 Critical | Blocks going live. Must be done in Week 1. |
| 🟡 Important | Required before onboarding real clinics. Week 2–3. |
| 🟢 Optional | Nice to have. Can ship after launch. |

---

## Week-by-Week Timeline

| Week | Focus |
|---|---|
| Week 1 | Docker, Nginx, env config, DB production setup, basic security hardening |
| Week 2 | CI/CD pipeline, Redis caching, API versioning, logging to file |
| Week 3 | Monitoring (Prometheus + Grafana), Sentry, backup strategy |
| Week 4 | Healthcare compliance docs, launch checklist, load testing |

---

## 1. Production Folder Structure 🔴

```
pulsemate/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf              ← frontend static file server
│   └── .dockerignore
├── PulseMateApp/               ← Expo mobile (deployed separately via EAS)
├── infra/
│   ├── nginx/
│   │   └── nginx.conf          ← reverse proxy config
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   ├── postgres/
│   │   └── init.sql
│   └── redis/
│       └── redis.conf
├── scripts/
│   ├── backup-db.sh
│   ├── restore-db.sh
│   ├── migrate.sh
│   └── rollback.sh
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── docker-compose.yml          ← development
├── docker-compose.prod.yml     ← production
└── .env.production.example
```

---

## 2. Docker Setup 🔴

### `backend/Dockerfile`

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build (generate Prisma client)
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

# Production image
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY . .

RUN addgroup -S pulsemate && adduser -S pulsemate -G pulsemate
RUN chown -R pulsemate:pulsemate /app
USER pulsemate

EXPOSE 5000
CMD ["node", "src/server.js"]
```

### `backend/.dockerignore`

```
node_modules
.env
.env.*
uploads
*.log
.git
prisma/migrations
```

> **Note:** `uploads/` should be a mounted volume or an S3/Cloudflare R2 bucket in production — not inside the container.

### `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### `frontend/nginx.conf`

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Security headers
  add_header X-Frame-Options "SAMEORIGIN";
  add_header X-Content-Type-Options "nosniff";
  add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

---

## 3. Docker Compose 🔴

### `docker-compose.yml` (development)

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: pulsemate_db
      POSTGRES_USER: pulsemate
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server /usr/local/etc/redis/redis.conf
    volumes:
      - redis_data:/data
      - ./infra/redis/redis.conf:/usr/local/etc/redis/redis.conf
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      target: builder
    restart: unless-stopped
    env_file: ./backend/.env
    environment:
      DATABASE_URL: postgresql://pulsemate:${DB_PASSWORD}@db:5432/pulsemate_db
      REDIS_URL: redis://redis:6379
    ports:
      - "5000:5000"
    depends_on:
      - db
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules
      - uploads:/app/uploads

  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
  uploads:
```

### `docker-compose.prod.yml` (production overlay)

```yaml
version: "3.9"

services:
  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - certbot_www:/var/www/certbot:ro
    depends_on:
      - backend
      - frontend

  backend:
    build:
      context: ./backend
      target: runner
    restart: always
    environment:
      NODE_ENV: production
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first

  db:
    restart: always
    deploy:
      placement:
        constraints:
          - node.role == manager

  certbot:
    image: certbot/certbot
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt
      - certbot_www:/var/www/certbot

volumes:
  certbot_www:
```

---

## 4. Nginx Reverse Proxy 🔴

### `infra/nginx/nginx.conf`

```nginx
events { worker_connections 1024; }

http {
  upstream backend {
    least_conn;
    server backend:5000;
    keepalive 64;
  }

  # Rate limiting zones
  limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
  limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

  # Redirect HTTP → HTTPS
  server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location /.well-known/acme-challenge/ {
      root /var/www/certbot;
    }

    location / {
      return 301 https://$host$request_uri;
    }
  }

  server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    client_max_body_size 20M;

    # API routes
    location /api/ {
      limit_req zone=api burst=50 nodelay;
      proxy_pass http://backend;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_cache_bypass $http_upgrade;
      proxy_read_timeout 60s;
    }

    # Auth routes — stricter rate limit
    location /api/auth/send-otp {
      limit_req zone=auth burst=3 nodelay;
      proxy_pass http://backend;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Socket.io
    location /socket.io/ {
      proxy_pass http://backend;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_read_timeout 86400s;
    }

    # Uploaded files (serve directly, with auth check if needed)
    location /uploads/ {
      proxy_pass http://backend;
      proxy_set_header Host $host;
    }

    # Frontend SPA
    location / {
      proxy_pass http://frontend:80;
      proxy_set_header Host $host;
    }
  }
}
```

---

## 5. Environment Configuration 🔴

### `.env.production.example`

```env
# ── Server ────────────────────────────────────────────────────────────────────
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://pulsemate:STRONG_PASSWORD@db:5432/pulsemate_db
DB_POOL_MIN=2
DB_POOL_MAX=10

# ── Redis ─────────────────────────────────────────────────────────────────────
REDIS_URL=redis://:REDIS_PASSWORD@redis:6379
REDIS_TTL_SECONDS=300

# ── JWT ───────────────────────────────────────────────────────────────────────
JWT_ACCESS_SECRET=GENERATE_WITH: openssl rand -hex 64
JWT_REFRESH_SECRET=GENERATE_WITH: openssl rand -hex 64
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
COOKIE_SECRET=GENERATE_WITH: openssl rand -hex 32

# ── OTP ───────────────────────────────────────────────────────────────────────
OTP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=xxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60

# ── Email ─────────────────────────────────────────────────────────────────────
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxx
RESEND_FROM_EMAIL=PulseMate <noreply@yourdomain.com>

# ── Payments ──────────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_live_xxxxxx
RAZORPAY_KEY_SECRET=xxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxx

# ── Firebase ──────────────────────────────────────────────────────────────────
FIREBASE_SERVER_KEY=xxxxxx

# ── Sentry ────────────────────────────────────────────────────────────────────
SENTRY_DSN=https://xxxxxx@sentry.io/xxxxxx

# ── Monitoring ────────────────────────────────────────────────────────────────
PROMETHEUS_METRICS_TOKEN=GENERATE_WITH: openssl rand -hex 32
```

> Store all secrets in **GitHub Actions Secrets** or a vault like **Doppler / AWS Secrets Manager**. Never commit `.env.production`.

---

## 6. CI/CD — GitHub Actions 🔴

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop, feature/**]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: pulsemate_test
          POSTGRES_USER: pulsemate
          POSTGRES_PASSWORD: testpassword
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: backend/package-lock.json

      - name: Install backend deps
        run: npm ci
        working-directory: backend

      - name: Generate Prisma client
        run: npx prisma generate
        working-directory: backend
        env:
          DATABASE_URL: postgresql://pulsemate:testpassword@localhost:5432/pulsemate_test

      - name: Run migrations
        run: npx prisma migrate deploy
        working-directory: backend
        env:
          DATABASE_URL: postgresql://pulsemate:testpassword@localhost:5432/pulsemate_test

      - name: Run tests
        run: npm test --if-present
        working-directory: backend
        env:
          DATABASE_URL: postgresql://pulsemate:testpassword@localhost:5432/pulsemate_test
          NODE_ENV: test
          JWT_ACCESS_SECRET: test-access-secret-32-chars-minimum
          JWT_REFRESH_SECRET: test-refresh-secret-32-chars-min

      - name: Install frontend deps
        run: npm ci
        working-directory: frontend

      - name: Build frontend
        run: npm run build
        working-directory: frontend
```

### `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker images
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/backend:latest
            ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
        env:
          DOCKER_BUILDKIT: 1

      - name: Deploy to server via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/pulsemate
            git pull origin main
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --no-deps --build backend
            docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
            docker image prune -f

      - name: Health check
        run: |
          sleep 15
          curl -f https://yourdomain.com/health || exit 1

      - name: Notify on failure
        if: failure()
        uses: 8398a57/action-slack@v3
        with:
          status: failure
          text: "🚨 PulseMate production deploy FAILED on ${{ github.sha }}"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 7. API Versioning Strategy 🟡

Add versioning to all routes. Current routes are unversioned — this will break mobile app users who can't force-update.

### In `backend/src/server.js` — replace current route mounting:

```js
// v1 routes (current)
const v1Router = express.Router();
v1Router.use('/auth', authRoutes);
v1Router.use('/admin', adminRoutes);
v1Router.use('/clinic', clinicRoutes);
v1Router.use('/clinics', clinicRoutes);
v1Router.use('/doctor', doctorRoutes);
v1Router.use('/reception', receptionRoutes);
v1Router.use('/patient', patientRoutes);
v1Router.use('/prescriptions', prescriptionRoutes);
v1Router.use('/payments', paymentRoutes);
v1Router.use('/notifications', notificationRoutes);
v1Router.use('/approvals', approvalRoutes);
v1Router.use('/marketplace', marketplaceRoutes);
v1Router.use('/sessions', sessionRoutes);

app.use('/api/v1', v1Router);

// Keep /api/* as alias for v1 during transition
app.use('/api', v1Router);
```

Add `X-API-Version: 1` response header via middleware so clients know which version they hit.

---

## 8. Redis Caching 🟡

Install ioredis and add a cache layer for hot-read endpoints.

```bash
npm install ioredis
```

### `backend/src/config/redis.js`

```js
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

module.exports = redis;
```

### Cache middleware for GET routes:

```js
// backend/src/middleware/cache.middleware.js
const redis = require('../config/redis');

const cache = (ttlSeconds = 300) => async (req, res, next) => {
  if (req.method !== 'GET') return next();

  const key = `cache:${req.user?.id || 'anon'}:${req.originalUrl}`;

  try {
    const cached = await redis.get(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    // Intercept response to cache it
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) {
        redis.setex(key, ttlSeconds, JSON.stringify(body)).catch(() => {});
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  } catch {
    next(); // fail open — don't block requests if Redis is down
  }
};

// Invalidate a cache key
const invalidateCache = async (pattern) => {
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(...keys);
};

module.exports = { cache, invalidateCache };
```

**Apply to hot endpoints:**
```js
// In marketplace.routes.js
router.get('/doctors', cache(60), marketplaceController.searchDoctors);

// In clinic.routes.js
router.get('/:id', authenticate, cache(120), clinicController.getClinic);
```

**Rate limiting with Redis** (replace in-memory rate limiter):
```bash
npm install rate-limit-redis
```
```js
const RedisStore = require('rate-limit-redis');
const limiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  windowMs: 15 * 60 * 1000,
  max: 100,
});
```

---

## 9. Logging Strategy 🟡

Current logger only writes to console. In production you need file rotation + structured logs.

```bash
npm install winston-daily-rotate-file
```

### Updated `backend/src/config/logger.js`

```js
const winston = require('winston');
require('winston-daily-rotate-file');

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',         // retain 30 days
  maxSize: '50m',
  zippedArchive: true,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
});

const errorRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '90d',         // keep errors longer
  maxSize: '50m',
  zippedArchive: true,
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'pulsemate-api' },
  transports: [
    fileRotateTransport,
    errorRotateTransport,
  ],
});

// Console only in non-production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

module.exports = logger;
```

Add `logs/` to `.gitignore` and mount it as a Docker volume.

---

## 10. Sentry Error Tracking 🟡

```bash
npm install @sentry/node @sentry/profiling-node
```

### In `backend/src/server.js` — add at the very top, before other imports:

```js
const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
    Sentry.prismaIntegration(), // traces Prisma queries
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  enabled: !!process.env.SENTRY_DSN,
});
```

### Update `backend/src/middleware/error.middleware.js`:

```js
const Sentry = require('@sentry/node');

const errorHandler = (err, req, res, next) => {
  // Capture in Sentry (skip 4xx client errors)
  if (!err.status || err.status >= 500) {
    Sentry.captureException(err, {
      user: req.user ? { id: req.user.id, role: req.user.role } : undefined,
      extra: { path: req.path, method: req.method },
    });
  }
  // ... rest of handler unchanged
};
```

---

## 11. Monitoring — Prometheus + Grafana 🟡

```bash
npm install prom-client
```

### `backend/src/config/metrics.js`

```js
const promClient = require('prom-client');

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const activeSocketConnections = new promClient.Gauge({
  name: 'socket_active_connections',
  help: 'Number of active Socket.io connections',
  registers: [register],
});

const appointmentsCreated = new promClient.Counter({
  name: 'appointments_created_total',
  help: 'Total appointments created',
  registers: [register],
});

module.exports = { register, httpRequestDuration, activeSocketConnections, appointmentsCreated };
```

### Add metrics endpoint in `server.js`:

```js
const { register, httpRequestDuration } = require('./config/metrics');

// Metrics middleware
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
  });
  next();
});

// Protected metrics endpoint
app.get('/metrics', (req, res) => {
  const token = req.headers['x-metrics-token'];
  if (token !== process.env.PROMETHEUS_METRICS_TOKEN) {
    return res.status(403).send('Forbidden');
  }
  res.set('Content-Type', register.contentType);
  register.metrics().then((data) => res.end(data));
});
```

### `infra/prometheus/prometheus.yml`

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "pulsemate-api"
    static_configs:
      - targets: ["backend:5000"]
    metrics_path: /metrics
    bearer_token: YOUR_METRICS_TOKEN

  - job_name: "postgres"
    static_configs:
      - targets: ["postgres-exporter:9187"]

  - job_name: "redis"
    static_configs:
      - targets: ["redis-exporter:9121"]
```

Add to `docker-compose.prod.yml`:

```yaml
  prometheus:
    image: prom/prometheus:latest
    restart: always
    volumes:
      - ./infra/prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'

  grafana:
    image: grafana/grafana:latest
    restart: always
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_USERS_ALLOW_SIGN_UP: "false"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./infra/grafana/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3001:3000"

volumes:
  prometheus_data:
  grafana_data:
```

**Recommended Grafana dashboards to import:**
- Node.js API: ID `11159`
- PostgreSQL: ID `9628`
- Redis: ID `11835`

---

## 12. PostgreSQL Production Setup 🔴

### `infra/postgres/init.sql`

```sql
-- Create dedicated app user with limited privileges
CREATE USER pulsemate_app WITH PASSWORD 'STRONG_PASSWORD';
GRANT CONNECT ON DATABASE pulsemate_db TO pulsemate_app;
GRANT USAGE ON SCHEMA public TO pulsemate_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pulsemate_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO pulsemate_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pulsemate_app;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Optimize for production
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET archive_mode = 'on';
SELECT pg_reload_conf();
```

### Connection pooling with PgBouncer (add to docker-compose.prod.yml):

```yaml
  pgbouncer:
    image: edoburu/pgbouncer:latest
    restart: always
    environment:
      DATABASE_URL: postgres://pulsemate:${DB_PASSWORD}@db:5432/pulsemate_db
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 200
      DEFAULT_POOL_SIZE: 25
    depends_on:
      - db
```

Then update `DATABASE_URL` in backend to point to `pgbouncer:5432`.

---

## 13. Database Migration Strategy 🔴

### `scripts/migrate.sh`

```bash
#!/bin/bash
set -e

echo "▶ Running PulseMate DB migration..."

# Check if migrations are pending
cd /opt/pulsemate/backend

# Deploy migrations (never run migrate dev in production)
npx prisma migrate deploy

echo "✅ Migrations applied successfully"

# Optionally run seed for reference data only
# node prisma/seed-reference.js
```

### `scripts/rollback.sh`

```bash
#!/bin/bash
set -e

TARGET_MIGRATION=$1

if [ -z "$TARGET_MIGRATION" ]; then
  echo "Usage: ./rollback.sh <migration_name>"
  echo "Example: ./rollback.sh 20260526000000_baseline"
  exit 1
fi

echo "⚠️  Rolling back to migration: $TARGET_MIGRATION"
echo "This will drop all data added after that migration. Are you sure? (yes/no)"
read confirm

if [ "$confirm" != "yes" ]; then
  echo "Rollback cancelled."
  exit 0
fi

# Take a backup first
./scripts/backup-db.sh "pre-rollback-$(date +%Y%m%d-%H%M%S)"

# Prisma doesn't have native rollback — resolve via migration squash or manual SQL
echo "Review prisma/migrations/${TARGET_MIGRATION}/migration.sql for reversal SQL"
echo "Apply manually via: docker compose exec db psql -U pulsemate pulsemate_db"
```

> **Prisma note:** Prisma doesn't support automatic rollback. The strategy is: always take a DB snapshot before deploying, use `prisma migrate deploy` (never `migrate dev`) in production, and keep a manual reversal SQL script in each migration folder.

---

## 14. Backup and Disaster Recovery 🔴

### `scripts/backup-db.sh`

```bash
#!/bin/bash
set -e

BACKUP_NAME=${1:-"backup-$(date +%Y%m%d-%H%M%S)"}
BACKUP_DIR="/var/backups/pulsemate"
S3_BUCKET="s3://pulsemate-backups"

mkdir -p "$BACKUP_DIR"

echo "▶ Creating backup: $BACKUP_NAME"

# Dump PostgreSQL
docker compose exec -T db pg_dump \
  -U pulsemate \
  -d pulsemate_db \
  --format=custom \
  --compress=9 \
  > "$BACKUP_DIR/$BACKUP_NAME.dump"

# Compress and encrypt
gpg --symmetric --cipher-algo AES256 \
  --passphrase "$BACKUP_ENCRYPTION_KEY" \
  --batch \
  "$BACKUP_DIR/$BACKUP_NAME.dump"

# Upload to S3
aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.dump.gpg" "$S3_BUCKET/$BACKUP_NAME.dump.gpg"

# Cleanup local (keep last 7 days)
find "$BACKUP_DIR" -name "*.dump*" -mtime +7 -delete

echo "✅ Backup complete: $BACKUP_NAME"
```

### `scripts/restore-db.sh`

```bash
#!/bin/bash
set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-db.sh <backup-file.dump.gpg>"
  exit 1
fi

echo "▶ Restoring from: $BACKUP_FILE"
echo "⚠️  This will REPLACE the current database. Confirm? (yes/no)"
read confirm
if [ "$confirm" != "yes" ]; then exit 0; fi

# Download from S3 if needed
if [[ "$BACKUP_FILE" == s3://* ]]; then
  aws s3 cp "$BACKUP_FILE" /tmp/restore.dump.gpg
  BACKUP_FILE="/tmp/restore.dump.gpg"
fi

# Decrypt
gpg --decrypt --passphrase "$BACKUP_ENCRYPTION_KEY" --batch \
  "$BACKUP_FILE" > /tmp/restore.dump

# Restore
docker compose exec -T db pg_restore \
  -U pulsemate \
  -d pulsemate_db \
  --clean --if-exists \
  < /tmp/restore.dump

echo "✅ Restore complete"
```

**Backup schedule (add to server crontab):**
```cron
# Daily full backup at 2 AM
0 2 * * * /opt/pulsemate/scripts/backup-db.sh

# Weekly backup retained for 90 days — handled by S3 lifecycle policy
```

**Recovery Time Objective (RTO):** ~30 minutes
**Recovery Point Objective (RPO):** 24 hours (daily backup) — move to hourly WAL streaming for RPO < 1 hour.

---

## 15. Security Hardening 🔴

Issues found in the current codebase and fixes:

### 15.1 JWT secrets must be strong
```bash
# Generate proper secrets — run these and put them in production env
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 15.2 Add request ID for tracing
```js
// npm install uuid
const { v4: uuidv4 } = require('uuid');
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});
```

### 15.3 Sanitize inputs against NoSQL/SQL injection
```bash
npm install express-mongo-sanitize xss-clean
```
```js
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
app.use(mongoSanitize()); // strip $ and . from user input
app.use(xss());           // strip HTML tags
```

### 15.4 Hide server fingerprint
```js
app.disable('x-powered-by'); // Helmet does this but be explicit
```

### 15.5 Uploads must be validated server-side
Current Multer config accepts files but doesn't validate MIME types.
```js
// In upload.middleware.js — add fileFilter
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};
```

### 15.6 CORS in production must be strict
```js
// In server.js — production CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:3000'];
```
Current code has a dev fallback `return callback(null, true)` that allows all origins — remove this in production.

### 15.7 Cookie flags
```js
// Ensure cookies use Secure + SameSite=Strict in production
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

### 15.8 Dependency audit
```bash
npm audit --audit-level=high
# Fix critical vulnerabilities before going live
```

---

## 16. Healthcare Compliance 🟡

### 16.1 Privacy Policy (required before real patient data)

Must cover:
- What PII is collected (name, mobile, health data, location)
- How it is stored (encrypted at rest, PostgreSQL with TLS in transit)
- Who it is shared with (clinic staff only, no third-party sale)
- Patient rights (access, correction, deletion requests)
- Data retention period (see 16.4)
- Contact for data requests: privacy@yourdomain.com
- Applicable law (IT Act 2000 + DPDP Act 2023 for India)

### 16.2 Terms of Service

Must cover:
- Platform is a scheduling/queue tool, not a medical service
- Liability disclaimer — PulseMate is not responsible for clinical decisions
- Clinic obligations — clinics are responsible for accuracy of their data
- Account termination conditions
- Governing law and dispute resolution

### 16.3 Consent Management 🔴

Current gap: Patient consent is not explicitly captured.

```prisma
// Add to schema.prisma
model PatientConsent {
  id          String   @id @default(uuid())
  userId      String
  type        String   // "TERMS_OF_SERVICE" | "PRIVACY_POLICY" | "HEALTH_DATA"
  version     String   // "v1.0"
  acceptedAt  DateTime @default(now())
  ipAddress   String?
  userAgent   String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("patient_consents")
}
```

Capture consent on first login and whenever policy version changes.

### 16.4 Data Retention Policy

| Data Type | Retention Period | Basis |
|---|---|---|
| Appointment records | 7 years | Medical records law (India) |
| Prescriptions | 7 years | Drugs and Cosmetics Act |
| Payment records | 8 years | GST compliance |
| Audit logs | 3 years | IT Act |
| OTP records | 90 days | Security |
| Session tokens | Until expiry + 1 day | Security |
| Deleted user data | 30 days then purge | DPDP Act |

Add a scheduled cleanup job:
```js
// scripts/data-retention.js — run weekly via cron
const prisma = require('./src/config/database');

async function runRetention() {
  const cutoff90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const cutoff3y  = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000);

  // Clean OTP records
  await prisma.otpVerification.deleteMany({ where: { createdAt: { lt: cutoff90d } } });

  // Clean old revoked refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { revokedAt: { lt: cutoff90d } }
  });

  // Clean old audit logs (keep 3 years)
  await prisma.auditLog.deleteMany({ where: { createdAt: { lt: cutoff3y } } });

  console.log('Data retention job complete');
}

runRetention().catch(console.error).finally(() => process.exit(0));
```

### 16.5 Audit Logging ✅ Already built

The `AuditLog` model and service are in place. Ensure these events are always logged:
- Login / logout
- Failed login attempts (5+)
- Appointment CRUD
- Prescription create
- Payment create
- Clinic approval status changes ✅
- Admin actions ✅
- Patient data access (for compliance)

### 16.6 Encryption at Rest

- Enable PostgreSQL TDE or use encrypted EBS volumes on AWS
- Encrypt S3 backup bucket with SSE-S3 or SSE-KMS
- Uploaded documents (licenses, PAN, GST) must be in private S3, not served publicly

---

## 17. Infrastructure Diagram

```
Internet
   │
   ▼
[Cloudflare DNS + DDoS Protection]
   │
   ▼
[Nginx: SSL Termination + Reverse Proxy + Rate Limiting]
   │
   ├─────────────────────────────────────────┐
   │                                         │
   ▼                                         ▼
[React Frontend]                    [Node.js API (×2 replicas)]
[Static via Nginx]                  [Express + Socket.io]
                                             │
                         ┌───────────────────┼───────────────────┐
                         │                   │                   │
                         ▼                   ▼                   ▼
                  [PostgreSQL]           [Redis]           [File Storage]
                  [+ PgBouncer]      [Session Cache]       [S3 / R2]
                  [Primary + Read     [Rate Limiting]     [Clinic Docs
                   Replica]           [Queue Cache]        Uploads]

Observability Layer:
[Prometheus] ←── scrapes ──── [API /metrics] + [postgres-exporter] + [redis-exporter]
     │
     ▼
[Grafana Dashboards]

Error Tracking:
[Sentry] ←── auto-captured by SDK in API and Frontend

CI/CD:
[GitHub] → [GitHub Actions CI] → [Docker Build] → [SSH Deploy] → [Server]
```

---

## 18. Launch Readiness Checklist

### 🔴 Critical (must be done before any real patient data)

- [ ] Docker + Docker Compose working locally
- [ ] Production Docker Compose with all services
- [ ] Nginx reverse proxy with SSL (Let's Encrypt)
- [ ] All secrets in environment variables, none hardcoded
- [ ] JWT secrets replaced with cryptographically strong values
- [ ] `NODE_ENV=production` set correctly
- [ ] CORS restricted to production domain only
- [ ] Database using production user with least-privilege
- [ ] PgBouncer connection pooling active
- [ ] Daily automated database backup to S3
- [ ] Backup restore tested at least once
- [ ] `prisma migrate deploy` runs as part of CI/CD (not `migrate dev`)
- [ ] Multer MIME type validation added
- [ ] `/uploads` moved to S3/R2 (not local disk)
- [ ] Rate limiting on OTP and auth endpoints active
- [ ] HTTPS enforced, HTTP → HTTPS redirect active
- [ ] Health check endpoint (`/health`) returning 200
- [ ] Patient consent capture on registration

### 🟡 Important (before scaling to multiple clinics)

- [ ] Redis deployed and connected
- [ ] Rate limiter using Redis store (not in-memory)
- [ ] API versioning (`/api/v1/`) applied to all routes
- [ ] Log files writing to disk with rotation (not just console)
- [ ] Sentry DSN configured and error capture verified
- [ ] Prometheus metrics endpoint protected and scraping
- [ ] Grafana dashboard operational
- [ ] Razorpay webhook endpoint active and signature verified
- [ ] FCM push notifications tested on real device
- [ ] Email delivery tested with real Resend domain
- [ ] Admin `ROOT` account created and password secured
- [ ] Privacy Policy page live on the domain
- [ ] Terms of Service page live on the domain
- [ ] Data retention cron job scheduled
- [ ] `npm audit` clean (no critical vulnerabilities)
- [ ] Dependency versions pinned exactly in package.json

### 🟢 Optional (post-launch)

- [ ] Read replica PostgreSQL for analytics queries
- [ ] CDN for static frontend assets (Cloudflare)
- [ ] EAS Build for mobile app production build
- [ ] Load testing with k6 or Artillery (target: 500 concurrent users)
- [ ] Penetration testing by external party
- [ ] SOC 2 / ISO 27001 assessment initiated
- [ ] Multi-region backup (primary + secondary region)
- [ ] Uptime monitoring (BetterUptime / UptimeRobot)
- [ ] On-call rotation and runbook documentation
- [ ] Grafana alerts on anomalies (error rate > 1%, latency > 2s)

---

## 19. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Database credentials leaked | Medium | Critical | Use secrets manager, rotate quarterly, audit logs on DB access |
| OTP brute force | High | High | Redis rate limiting (5/15min, already built — ensure Redis store in prod) |
| Upload directory traversal | Medium | High | Multer MIME validation + S3 move |
| JWT secret compromise | Low | Critical | Strong secrets (64-byte hex), rotate with zero-downtime key rollover |
| DB data loss | Low | Critical | Daily encrypted backups to S3, tested restore, consider WAL streaming |
| Redis downtime blocks auth | Medium | High | Fail-open cache middleware (already designed above) |
| Prisma migration failure | Low | High | Always backup before migration, staging environment mirrors prod |
| Razorpay webhook replay attack | Medium | High | Verify signature + idempotency key on every webhook |
| CORS misconfiguration | Low | High | Dev CORS allowAll removed before prod deploy |
| Socket.io connection storm | Medium | Medium | Nginx upstream keepalive + Socket.io connection backoff on client |

---

## 20. Estimated Timeline

| Week | Deliverables | Est. Hours |
|---|---|---|
| **Week 1** | Docker, Compose, Nginx, SSL, env, DB hardening, CORS fix, MIME validation, backup scripts | 25–30h |
| **Week 2** | CI/CD pipeline, Redis, API versioning, log rotation, Sentry | 20–25h |
| **Week 3** | Prometheus, Grafana, Razorpay webhooks, FCM testing, S3 uploads | 20–25h |
| **Week 4** | Compliance docs, consent model, data retention job, launch checklist sign-off, load test | 15–20h |
| **Total** | | **~80–100h** |

---

## Quick Start — Spin Up Locally with Docker

```bash
# 1. Copy env
cp backend/.env.example backend/.env
# Fill in DATABASE_URL, JWT secrets, etc.

# 2. Build and start
docker compose up --build

# 3. Run migrations
docker compose exec backend npx prisma migrate deploy

# 4. Seed
docker compose exec backend node prisma/seed.js

# 5. Open
# Frontend: http://localhost:3000
# API:      http://localhost:5000
# Grafana:  http://localhost:3001 (prod compose only)
```

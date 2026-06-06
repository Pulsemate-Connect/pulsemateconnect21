FROM node:20-alpine AS base
WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# ── Builder (generate Prisma client) ─────────────────────────────────────────
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

# ── Production runner ─────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY . .

# Non-root user for security
RUN addgroup -S pulsemate && adduser -S pulsemate -G pulsemate
RUN mkdir -p /app/uploads /app/logs && chown -R pulsemate:pulsemate /app
USER pulsemate

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "src/server.js"]

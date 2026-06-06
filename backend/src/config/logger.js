const winston = require('winston');
const path = require('path');

// Only require file rotation in environments where we want file logs
let DailyRotateFile;
try {
  DailyRotateFile = require('winston-daily-rotate-file');
} catch (_) {
  // optional dep — falls back to console only
}

const logDir = path.join(__dirname, '../../logs');

const transports = [];

// ── Console transport (always on in non-production) ───────────────────────────
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    })
  );
}

// ── File transports (production + when winston-daily-rotate-file is installed) ─
if (DailyRotateFile) {
  // All logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '50m',
      zippedArchive: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    })
  );

  // Error logs — keep longer for audit purposes
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '90d',
      maxSize: '50m',
      zippedArchive: true,
    })
  );
} else if (process.env.NODE_ENV === 'production') {
  // Fallback: plain console JSON in production if rotate not installed
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'pulsemate-api' },
  transports,
});

module.exports = logger;

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

// ✅ SECURITY FIX: Sensitive fields that must NEVER be logged
const SENSITIVE_FIELDS = [
  'password', 'passwordHash', 'passwordConfirm', 'newPassword', 'oldPassword', 'currentPassword',
  'token', 'accessToken', 'refreshToken', 'idToken', 'firebaseIdToken', 'firebaseUid',
  'otp', 'otpCode', 'otpHash', 'verificationCode', 'code',
  'secret', 'apiKey', 'apiSecret', 'privateKey', 'private_key', 'serviceAccount',
  'razorpayKey', 'razorpaySecret', 'razorpaySignature',
  'cvv', 'cardNumber', 'card_number', 'pin', 'ssn', 'social_security',
  'authorization', 'cookie', 'x-api-key',
];

// ✅ SECURITY FIX: PII fields that should be masked
const PII_FIELDS = [
  'email', 'mobile', 'phone', 'phoneNumber',
  'address', 'dob', 'dateOfBirth', 'birthDate',
  'bloodGroup', 'allergies', 'existingDiseases',
  'symptoms', 'medicalNotes', 'diagnosis', 'prescription',
];

// ✅ SECURITY: Masking helpers
const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '[MASKED]';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '[MASKED]';
  return `${local[0]}***@${domain}`;
};

const maskPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '[MASKED]';
  return phone.slice(0, 3) + '****' + phone.slice(-4);
};

// ✅ SECURITY FIX: Redaction format to remove sensitive data
const redactSensitive = winston.format((info) => {
  const redact = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Remove sensitive fields completely
      if (SENSITIVE_FIELDS.some(s => lowerKey.includes(s.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      }
      // Mask PII fields
      else if (PII_FIELDS.some(p => lowerKey.includes(p.toLowerCase()))) {
        if (typeof obj[key] === 'string') {
          if (lowerKey.includes('email')) {
            obj[key] = maskEmail(obj[key]);
          } else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
            obj[key] = maskPhone(obj[key]);
          } else {
            obj[key] = '[MASKED]';
          }
        } else {
          obj[key] = '[MASKED]';
        }
      }
      // Recursively redact nested objects
      else if (typeof obj[key] === 'object' && obj[key] !== null) {
        redact(obj[key]);
      }
    }
    
    return obj;
  };
  
  redact(info);
  return info;
});

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
    redactSensitive(), // ✅ SECURITY: Redact sensitive data before logging
    winston.format.json()
  ),
  defaultMeta: { service: 'pulsemate-api' },
  transports,
});

module.exports = logger;

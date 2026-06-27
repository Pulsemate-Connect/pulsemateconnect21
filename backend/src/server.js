require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const logger = require('./config/logger');
const { errorHandler, notFound } = require('./middleware/error.middleware');
const { initializeSocket } = require('./socket');
const { startReminderJob } = require('./jobs/appointmentReminder.job');
const { initFirebase } = require('./config/firebase');

// Routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const clinicRoutes = require('./routes/clinic.routes');
const doctorRoutes = require('./routes/doctor.routes');
const receptionRoutes = require('./routes/reception.routes');
const patientRoutes = require('./routes/patient.routes');
const paymentRoutes = require('./routes/payment.routes');
const notificationRoutes = require('./routes/notification.routes');
const approvalRoutes = require('./routes/approval.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const sessionRoutes = require('./routes/session.routes');
const availabilityRoutes = require('./routes/availability.routes');
const deviceTokenRoutes = require('./routes/deviceToken.routes');
const campaignRoutes = require('./routes/campaign.routes');
const webhookRoutes = require('./routes/webhook.routes');
const clinicSessionRoutes = require('./routes/clinicSession.routes');

const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://pulsemateconnect.in',
      'https://www.pulsemateconnect.in',
      'https://pulsemate-frontend.onrender.com',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

initializeSocket(io);
app.set('io', io); // Make io accessible in controllers

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  // Always allow both www and non-www versions of the custom domain
  'https://pulsemateconnect.in',
  'https://www.pulsemateconnect.in',
  // Render default URLs
  'https://pulsemate-frontend.onrender.com',
  // Local development
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any local network IP (for Expo on real devices)
    if (/^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin)) return callback(null, true);
    if (/^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)) return callback(null, true);
    if (/^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/.test(origin)) return callback(null, true);
    if (/^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)) return callback(null, true);
    if (/^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/.test(origin)) return callback(null, true);
    // In development only — allow all origins for local testing
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    // In production — block unknown origins
    return callback(new Error(`CORS: origin ${origin} not allowed`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Global rate limiter — generous limits for dev/clinic use
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 500,                 // 500 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: () => process.env.NODE_ENV === 'development', // skip entirely in dev
});
app.use(globalLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// Webhook routes need raw body for signature verification — must come BEFORE json()
app.use('/api/webhooks', express.raw({ type: 'application/json' }), (req, _res, next) => {
  // Preserve raw body string for HMAC verification
  if (Buffer.isBuffer(req.body)) {
    req.rawBody = req.body.toString('utf8');
    try { req.body = JSON.parse(req.rawBody); } catch { req.body = {}; }
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Request Logging ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PulseMate API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Root Route ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'PulseMate Connect API',
    version: '1.0.0',
    status: 'running',
    docs: '/health',
    api: '/api',
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
  });
});

// ─── Privacy Policy ───────────────────────────────────────────────────────────
app.get('/privacy-policy', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy – PulseMate Connect</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.7; }
    header { background: #0f172a; color: #fff; padding: 28px 24px; text-align: center; }
    header h1 { font-size: 1.8rem; font-weight: 700; }
    header p { color: #94a3b8; margin-top: 6px; font-size: 0.95rem; }
    .container { max-width: 820px; margin: 40px auto; padding: 0 24px 60px; }
    h2 { font-size: 1.15rem; font-weight: 600; color: #0f172a; margin: 32px 0 10px; border-left: 4px solid #3b82f6; padding-left: 12px; }
    p, li { font-size: 0.97rem; color: #334155; margin-bottom: 10px; }
    ul { padding-left: 20px; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .card { background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
    .last-updated { font-size: 0.85rem; color: #64748b; margin-bottom: 24px; }
    footer { text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 24px; }
  </style>
</head>
<body>
  <header>
    <h1>PulseMate Connect</h1>
    <p>Privacy Policy</p>
  </header>
  <div class="container">
    <div class="card">
      <p class="last-updated">Last updated: June 27, 2026</p>

      <p>PulseMate Connect ("we", "our", or "us") operates the PulseMate mobile application and related services. This Privacy Policy explains how we collect, use, and protect your information when you use our platform.</p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Personal Information:</strong> Name, email address, phone number, date of birth, and gender provided during registration.</li>
        <li><strong>Health Information:</strong> Appointment details, doctor and clinic interactions, and any health-related data you voluntarily provide.</li>
        <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers (for push notifications), and app usage data.</li>
        <li><strong>Location Data:</strong> General location (city/district) to help you find nearby clinics. Precise GPS is only used when you explicitly allow it.</li>
        <li><strong>Payment Information:</strong> Transaction identifiers processed through Razorpay. We do not store card or bank details.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To create and manage your account and appointments.</li>
        <li>To send appointment reminders, confirmations, and important notifications via SMS, email, and push notifications.</li>
        <li>To connect you with doctors and clinics on the platform.</li>
        <li>To process payments securely through Razorpay.</li>
        <li>To improve app performance and user experience.</li>
        <li>To comply with applicable laws and regulations.</li>
      </ul>

      <h2>3. Sharing of Information</h2>
      <p>We do not sell your personal information. We share data only with:</p>
      <ul>
        <li><strong>Clinics and Doctors:</strong> Your appointment details are shared with the healthcare provider you book with.</li>
        <li><strong>Service Providers:</strong> Firebase (auth &amp; notifications), Razorpay (payments), Cloudinary (file storage), and Render (cloud hosting) — each under their own privacy policies.</li>
        <li><strong>Legal Requirements:</strong> When required by law, court order, or government authority.</li>
      </ul>

      <h2>4. Data Storage and Security</h2>
      <p>Your data is stored on secure servers hosted on Render in the Singapore region. We use industry-standard encryption (TLS/HTTPS) for all data in transit, and access controls to protect data at rest. We retain your data for as long as your account is active or as required by law.</p>

      <h2>5. Your Rights</h2>
      <ul>
        <li>Access, correct, or delete your personal information by contacting us.</li>
        <li>Withdraw consent for notifications at any time through app settings.</li>
        <li>Request a copy of your data or ask for account deletion.</li>
      </ul>

      <h2>6. Children's Privacy</h2>
      <p>PulseMate Connect is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we discover such data has been collected, we will delete it promptly.</p>

      <h2>7. Third-Party Services</h2>
      <p>Our app uses the following third-party services, each governed by their own privacy policies:</p>
      <ul>
        <li><a href="https://firebase.google.com/support/privacy" target="_blank">Google Firebase</a> – Authentication and push notifications</li>
        <li><a href="https://razorpay.com/privacy/" target="_blank">Razorpay</a> – Payment processing</li>
        <li><a href="https://cloudinary.com/privacy" target="_blank">Cloudinary</a> – Media storage</li>
      </ul>

      <h2>8. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via the app or email. Continued use of the app after changes constitutes acceptance of the updated policy.</p>

      <h2>9. Contact Us</h2>
      <p>If you have any questions or requests regarding this Privacy Policy, please contact us at:</p>
      <ul>
        <li>Email: <a href="mailto:pulsemateconnect@gmail.com">pulsemateconnect@gmail.com</a></li>
        <li>Website: <a href="https://www.pulsemateconnect.in" target="_blank">www.pulsemateconnect.in</a></li>
      </ul>
    </div>
  </div>
  <footer>© 2026 PulseMate Connect. All rights reserved.</footer>
</body>
</html>`);
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
// Clinic session routes MUST come before general clinic routes for proper matching
app.use('/api/clinics', clinicSessionRoutes); // Public: /:clinicId/sessions
app.use('/api/clinic', clinicRoutes);
app.use('/api/clinics', clinicRoutes);
// Availability routes MUST be registered before doctorRoutes because doctorRoutes
// applies authenticate middleware to everything under /api/doctor, which would
// block the public slot/availability endpoints (/:doctorId/slots, /:doctorId/availability).
app.use('/api/doctor', availabilityRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/reception', receptionRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/device-token', deviceTokenRoutes);
app.use('/api/webhooks', webhookRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const os = require('os');
const getLocalIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
};

const PORT = process.env.PORT || 5000;

// Only bind to a port when NOT running under Jest — integration tests use
// supertest which calls app.listen() internally on a random port.
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    logger.info(`🚀 PulseMate API running on port ${PORT}`);
    logger.info(`📡 Socket.io ready`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    logger.info(`📱 LAN access: http://${localIP}:${PORT}`);

    // Initialize Firebase Admin SDK
    initFirebase();

    // Start scheduled jobs
    startReminderJob();
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server };

/**
 * webhook.routes.js
 *
 * Razorpay webhooks MUST receive the raw unparsed body for HMAC verification.
 * We apply express.raw() before the route so req.rawBody contains the original bytes.
 *
 * Route: POST /api/webhooks/razorpay
 * No authentication middleware — Razorpay sends from their servers directly.
 * Security is via HMAC signature verification in the controller.
 */

const express = require('express');
const { razorpayWebhook } = require('../controllers/webhook.controller');

const router = express.Router();

// Capture raw body for signature verification
router.post(
  '/razorpay',
  express.raw({ type: 'application/json' }),
  (req, _res, next) => {
    // Store raw body string for HMAC verification
    req.rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : String(req.body || '');
    // Also parse JSON so controller can read event fields
    try {
      req.body = JSON.parse(req.rawBody);
    } catch {
      // body remains as string — controller handles it
    }
    next();
  },
  razorpayWebhook
);

module.exports = router;

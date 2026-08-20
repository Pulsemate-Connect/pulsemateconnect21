/**
 * Webhook routes — public endpoints, NO auth middleware.
 * Raw body must be preserved for signature verification.
 */
const express = require('express');
const router = express.Router();
const { razorpayWebhook } = require('../controllers/payment.controller');

// Razorpay webhook — verify using x-razorpay-signature header
// Body is parsed as raw buffer via express.raw() in server.js
router.post('/razorpay', razorpayWebhook);

module.exports = router;

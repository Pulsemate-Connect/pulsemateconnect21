/**
 * SMS / OTP delivery service — PulseMate Connect
 *
 * IMPORTANT: This service is DEPRECATED for patient login.
 * Patient login now uses Firebase Phone Authentication on the client.
 * Firebase sends real SMS directly via Google infrastructure.
 *
 * This service is kept ONLY for:
 *   - Legacy backward compatibility with old app versions
 *   - Staff/clinic owner OTP flows (not patient login)
 *   - Email verification codes
 *
 * SMS_PROVIDER options (for legacy flows only):
 *   2factor   — 2Factor.in (India, recommended for testing)
 *   msg91     — MSG91 Flow API (India, recommended for production)
 *   twilio    — Twilio SMS (international)
 *   mock      — Console log only (development default)
 *
 * DO NOT USE FOR PATIENT LOGIN — Use Firebase Phone Auth instead.
 */
const logger = require('../config/logger');

const SMS_PROVIDER       = (process.env.SMS_PROVIDER        || 'mock').toLowerCase().trim();
const WHATSAPP_PROVIDER  = (process.env.WHATSAPP_PROVIDER   || '').toLowerCase().trim();
const SMS_API_KEY        = process.env.SMS_API_KEY           || '';
const SMS_SENDER_ID      = process.env.SMS_SENDER_ID         || 'PULSE';
const SMS_TEMPLATE_ID    = process.env.SMS_TEMPLATE_ID       || '';
const WHATSAPP_TEMPLATE_ID = process.env.WHATSAPP_TEMPLATE_ID || '';

const OTP_MESSAGE = (otp) =>
  `Your PulseMate OTP is ${otp}. Valid for 5 minutes. Do not share it with anyone. -PULSE`;

// ── Public entry point ────────────────────────────────────────────────────────
const sendOtpSms = async (mobile, otp) => {
  const smsResult = await sendSms(mobile, otp);
  if (WHATSAPP_PROVIDER) {
    sendWhatsApp(mobile, otp).catch((err) =>
      logger.warn(`[WhatsApp] Non-blocking failure: ${err.message}`)
    );
  }
  return smsResult;
};

const sendSms = async (mobile, otp) => {
  switch (SMS_PROVIDER) {
    case 'msg91':    return sendViaMSG91(mobile, otp);
    case '2factor':  return sendVia2Factor(mobile, otp);
    case 'twilio':   return sendViaTwilio(mobile, otp);
    case 'mock':
    default:         return sendMock(mobile, otp);
  }
};

// ── Mock (dev only) ───────────────────────────────────────────────────────────
const sendMock = async (mobile, otp) => {
  logger.warn(`[SMS-MOCK] Sent to ${mobile} (mock SMS, for testing only)`);
  return { success: true, provider: 'mock' };
};

// ── MSG91 ─────────────────────────────────────────────────────────────────────
const sendViaMSG91 = async (mobile, otp) => {
  if (!SMS_API_KEY || !SMS_TEMPLATE_ID) {
    logger.warn('[MSG91] Missing SMS_API_KEY or SMS_TEMPLATE_ID — falling back to mock');
    return sendMock(mobile, otp);
  }
  const cleanMobile = mobile.replace(/^\+/, '');
  const payload = JSON.stringify({ flow_id: SMS_TEMPLATE_ID, sender: SMS_SENDER_ID, mobiles: cleanMobile, otp });
  logger.info(`[MSG91] Sending OTP to ${cleanMobile}`);
  return new Promise((resolve, reject) => {
    const https = require('https');
    const req = https.request({
      hostname: 'control.msg91.com', path: '/api/v5/flow/', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), authkey: SMS_API_KEY },
    }, (res) => {
      let raw = ''; res.on('data', (c) => (raw += c));
      res.on('end', () => {
        let p; try { p = JSON.parse(raw); } catch { p = { type: 'error', message: raw }; }
        if (p.type === 'success') { logger.info(`[MSG91] Sent. id: ${p.request_id}`); resolve({ success: true, provider: 'msg91' }); }
        else { logger.error(`[MSG91] Failed: ${JSON.stringify(p)}`); resolve({ success: false }); }
      });
    });
    req.on('error', (e) => { logger.error(`[MSG91] Network: ${e.message}`); reject(e); });
    req.write(payload); req.end();
  });
};

// ── 2Factor ───────────────────────────────────────────────────────────────────
const sendVia2Factor = async (mobile, otp) => {
  if (!SMS_API_KEY) { logger.warn('[2Factor] No API key'); return sendMock(mobile, otp); }
  const clean = mobile.replace(/^\+91/, '').replace(/^\+/, '');
  const tmpl  = SMS_TEMPLATE_ID ? `/${encodeURIComponent(SMS_TEMPLATE_ID)}` : '';
  const path  = `/API/V1/${SMS_API_KEY}/SMS/${clean}/${otp}${tmpl}`;
  logger.info(`[2Factor] Sending OTP to ${clean}`);
  return new Promise((resolve, reject) => {
    const https = require('https');
    const req = https.request({ hostname: '2factor.in', path, method: 'GET' }, (res) => {
      let raw = ''; res.on('data', (c) => (raw += c));
      res.on('end', () => {
        let p; try { p = JSON.parse(raw); } catch { p = { Status: 'Error', Details: raw }; }
        if (p.Status === 'Success') { logger.info(`[2Factor] Sent. id: ${p.Details}`); resolve({ success: true, provider: '2factor' }); }
        else { logger.error(`[2Factor] Failed: ${JSON.stringify(p)}`); resolve({ success: false }); }
      });
    });
    req.on('error', (e) => { logger.error(`[2Factor] Network: ${e.message}`); reject(e); });
    req.end();
  });
};

// ── Twilio ────────────────────────────────────────────────────────────────────
const sendViaTwilio = async (mobile, otp) => {
  if (!SMS_API_KEY) { logger.warn('[Twilio] No API key'); return sendMock(mobile, otp); }
  const [accountSid, authToken] = SMS_API_KEY.includes(':') ? SMS_API_KEY.split(':') : [process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN];
  if (!accountSid || !authToken) { logger.warn('[Twilio] Missing SID/Token'); return sendMock(mobile, otp); }
  try {
    const client = require('twilio')(accountSid, authToken);
    const msg = await client.messages.create({ body: OTP_MESSAGE(otp), from: SMS_SENDER_ID, to: mobile });
    logger.info(`[Twilio] Sent. SID: ${msg.sid}`);
    return { success: true, provider: 'twilio' };
  } catch (err) {
    logger.error(`[Twilio] Failed: ${err.message}`);
    return { success: false };
  }
};

// ── WhatsApp ──────────────────────────────────────────────────────────────────
const sendWhatsApp = async (mobile, otp) => {
  if (WHATSAPP_PROVIDER === '2factor') return sendVia2FactorWhatsApp(mobile, otp);
  if (WHATSAPP_PROVIDER === 'twilio')  return sendViaTwilioWhatsApp(mobile, otp);
  return null;
};

const sendVia2FactorWhatsApp = async (mobile, otp) => {
  if (!SMS_API_KEY) return null;
  const clean = mobile.replace(/^\+91/, '').replace(/^\+/, '');
  const tmpl  = WHATSAPP_TEMPLATE_ID ? `/${encodeURIComponent(WHATSAPP_TEMPLATE_ID)}` : '';
  return new Promise((resolve) => {
    const https = require('https');
    const req = https.request({ hostname: '2factor.in', path: `/API/V1/${SMS_API_KEY}/WHATSAPP/${clean}/${otp}${tmpl}`, method: 'GET' }, (res) => {
      let raw = ''; res.on('data', (c) => (raw += c));
      res.on('end', () => { resolve(null); });
    });
    req.on('error', () => resolve(null)); req.end();
  });
};

const sendViaTwilioWhatsApp = async (mobile, otp) => {
  const [sid, token] = (SMS_API_KEY || '').includes(':') ? SMS_API_KEY.split(':') : [process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN];
  if (!sid || !token) return null;
  try {
    const client = require('twilio')(sid, token);
    const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
    const to   = mobile.startsWith('whatsapp:') ? mobile : `whatsapp:${mobile}`;
    await client.messages.create({ body: OTP_MESSAGE(otp), from, to });
    return null;
  } catch { return null; }
};

module.exports = { sendOtpSms };

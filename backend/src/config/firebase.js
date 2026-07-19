/**
 * Firebase Admin SDK initializer.
 *
 * Uses FIREBASE_SERVICE_ACCOUNT_JSON env var (single-line minified JSON string).
 * Falls back to console-only logging / graceful no-op when the env var is missing.
 *
 * Responsibilities:
 *  1. FCM push notifications (existing)
 *  2. Firebase Phone Auth token verification (new — for patient login)
 */
const logger = require('./logger');

let adminApp = null;
let isInitialized = false;

const initFirebase = () => {
  if (isInitialized) return adminApp;

  // Try env var first, then fall back to Render secret file
  let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    const fs = require('fs');
    const secretPath = '/etc/secrets/firebase.json';
    if (fs.existsSync(secretPath)) {
      try {
        serviceAccountJson = fs.readFileSync(secretPath, 'utf8');
        logger.info('Firebase: loaded service account from secret file');
      } catch (e) {
        logger.warn('Firebase: failed to read secret file:', e.message);
      }
    }
  }

  if (!serviceAccountJson) {
    logger.warn(
      'Firebase not configured: FIREBASE_SERVICE_ACCOUNT_JSON is missing. ' +
      'Push notifications and Firebase Phone Auth will be unavailable.'
    );
    isInitialized = true;
    return null;
  }

  try {
    const admin = require('firebase-admin');

    if (admin.apps.length > 0) {
      adminApp = admin.apps[0];
      isInitialized = true;
      return adminApp;
    }

    let serviceAccount;
    try {
      // Try direct parse first
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (parseErr) {
      // Render sometimes wraps value in extra quotes or escapes \n as \\n
      // Try fixing escaped newlines in private key
      const fixed = serviceAccountJson
        .replace(/\\\\n/g, '\\n')   // \\n → \n
        .replace(/\\n/g, '\n');     // \n  → actual newline (for non-JSON key format)
      serviceAccount = JSON.parse(fixed);
    }

    // Ensure private_key has real newlines (not escaped)
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    isInitialized = true;
    logger.info('Firebase Admin SDK initialized');
    return adminApp;
  } catch (error) {
    logger.error('Firebase initialization failed:', error.message);
    logger.error('Firebase error stack:', error.stack);
    isInitialized = true;
    return null;
  }
};

const getFirebaseAdmin = () => {
  if (!isInitialized) initFirebase();
  return adminApp;
};

const isFirebaseReady = () => {
  if (!isInitialized) initFirebase();
  return adminApp !== null;
};

/**
 * Verify a Firebase ID token (e.g. from Firebase Phone Auth on the mobile app).
 *
 * @param {string} idToken - Firebase ID token sent from the mobile app after
 *                           confirmationResult.confirm(code).
 * @returns {Promise<import('firebase-admin').auth.DecodedIdToken>} decoded token payload.
 * @throws Error if Firebase Admin is not configured or the token is invalid.
 */
const verifyFirebaseToken = async (idToken) => {
  const app = getFirebaseAdmin();
  if (!app) {
    const err = new Error('Firebase Admin SDK is not configured on this server.');
    err.status = 503;
    throw err;
  }

  const admin = require('firebase-admin');
  // checkRevoked: false — revocation check requires an extra network round-trip;
  // fine to skip for phone auth since tokens are short-lived (1 hour).
  const decoded = await admin.auth().verifyIdToken(idToken, false);
  return decoded;
};

module.exports = { initFirebase, getFirebaseAdmin, isFirebaseReady, verifyFirebaseToken };

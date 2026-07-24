/**
 * Firebase Cloud Functions - PulseMate Connect
 * 
 * Main entry point for Cloud Functions
 * Exports: sendOtp, verifyOtp
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const auth = admin.auth();
const db = admin.firestore();

/**
 * Cloud Function: Send OTP via SMS
 * 
 * Called by: Client app → sendOtpToPhone()
 * Sends OTP via SMS to phone number
 */
exports.sendOtp = functions.https.onCall(async (data, context) => {
  try {
    const { phoneNumber } = data;

    // Validate phone number
    if (!phoneNumber || !/^\+[1-9]\d{9,14}$/.test(phoneNumber)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid phone number. Use E.164 format (+91...)'
      );
    }

    console.log(`[sendOtp] Sending OTP to ${phoneNumber}`);

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationId = `${phoneNumber}_${Date.now()}`;

    // Store OTP in Firestore with 5-minute expiry
    await db.collection('otpVerifications').doc(verificationId).set({
      phoneNumber,
      otp,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      attempts: 0,
    });

    console.log(`[sendOtp] Generated OTP: ${otp}`);
    
    // TODO: Send SMS using Twilio, AWS SNS, or Firebase Cloud Messaging
    // For now, log to console (visible in Cloud Functions logs)
    
    /*
    // Example: Twilio integration
    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    await twilio.messages.create({
      body: `Your PulseMate verification code is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    */

    return {
      success: true,
      verificationId,
      message: 'OTP sent successfully',
    };
  } catch (error) {
    console.error('[sendOtp] Error:', error.message);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function: Verify OTP
 * 
 * Called by: Client app → verifyPhoneOtp()
 * Verifies OTP code and returns Firebase token
 */
exports.verifyOtp = functions.https.onCall(async (data, context) => {
  try {
    const { verificationId, code, phoneNumber } = data;

    // Validate input
    if (!verificationId || !code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid OTP format');
    }

    console.log(`[verifyOtp] Verifying OTP for ${phoneNumber}`);

    // Get OTP from Firestore
    const doc = await db.collection('otpVerifications').doc(verificationId).get();

    if (!doc.exists) {
      throw new functions.https.HttpsError('not-found', 'OTP not found or expired');
    }

    const otpData = doc.data();

    // Check expiry
    if (new Date() > otpData.expiresAt) {
      await db.collection('otpVerifications').doc(verificationId).delete();
      throw new functions.https.HttpsError('failed-precondition', 'OTP has expired');
    }

    // Check attempts
    if (otpData.attempts >= 3) {
      await db.collection('otpVerifications').doc(verificationId).delete();
      throw new functions.https.HttpsError('permission-denied', 'Too many attempts');
    }

    // Verify code
    if (code !== otpData.otp) {
      await db.collection('otpVerifications').doc(verificationId).update({
        attempts: otpData.attempts + 1,
      });
      throw new functions.https.HttpsError('unauthenticated', 'Invalid OTP');
    }

    // OTP verified successfully
    const uid = `user_${phoneNumber.replace(/\D/g, '')}`;
    
    // Create or get Firebase user
    let user;
    try {
      user = await auth.getUser(uid);
      console.log(`[verifyOtp] User exists: ${uid}`);
    } catch (e) {
      // User doesn't exist, create one
      user = await auth.createUser({
        uid,
        phoneNumber,
      });
      console.log(`[verifyOtp] User created: ${uid}`);
    }

    // Create custom Firebase token for client
    const customToken = await auth.createCustomToken(uid);

    // Clean up OTP record
    await db.collection('otpVerifications').doc(verificationId).delete();

    console.log(`[verifyOtp] OTP verified successfully for ${phoneNumber}`);

    return {
      success: true,
      token: customToken,
      uid,
      phoneNumber,
      message: 'OTP verified successfully',
    };
  } catch (error) {
    console.error('[verifyOtp] Error:', error.message);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

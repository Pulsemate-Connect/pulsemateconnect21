#!/usr/bin/env node
/**
 * check-render-config.js
 * 
 * Simple diagnostic script to check if Render environment is properly configured.
 * Run this on Render to verify environment variables are set correctly.
 * 
 * Usage:
 *   node check-render-config.js
 *   node check-render-config.js --local  (loads .env file for local testing)
 */

// Load .env if running locally
const isLocal = process.argv.includes('--local');
if (isLocal) {
  require('dotenv').config();
  console.log('📁 Loaded .env file for local testing\n');
}

const checkConfig = () => {
  console.log('🔍 PulseMate Connect — Render Configuration Check\n');
  console.log('═'.repeat(60));
  
  const checks = [];
  let allGood = true;

  // Check Razorpay Key ID
  const hasKeyId = !!process.env.RAZORPAY_KEY_ID;
  const keyIdValue = hasKeyId ? process.env.RAZORPAY_KEY_ID.substring(0, 10) + '...' : 'NOT SET';
  checks.push({
    name: 'RAZORPAY_KEY_ID',
    status: hasKeyId ? '✅' : '❌',
    value: keyIdValue,
    required: true,
  });
  if (!hasKeyId) allGood = false;

  // Check Razorpay Key Secret
  const hasKeySecret = !!process.env.RAZORPAY_KEY_SECRET;
  const keySecretValue = hasKeySecret ? process.env.RAZORPAY_KEY_SECRET.substring(0, 10) + '...' : 'NOT SET';
  checks.push({
    name: 'RAZORPAY_KEY_SECRET',
    status: hasKeySecret ? '✅' : '❌',
    value: keySecretValue,
    required: true,
  });
  if (!hasKeySecret) allGood = false;

  // Check Firebase
  const hasFirebase = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const firebaseValue = hasFirebase ? 'JSON (length: ' + process.env.FIREBASE_SERVICE_ACCOUNT_JSON.length + ')' : 'NOT SET';
  checks.push({
    name: 'FIREBASE_SERVICE_ACCOUNT_JSON',
    status: hasFirebase ? '✅' : '⚠️',
    value: firebaseValue,
    required: false,
  });

  // Check Frontend URL
  const hasFrontendUrl = !!process.env.FRONTEND_URL;
  const frontendUrlValue = hasFrontendUrl ? process.env.FRONTEND_URL : 'NOT SET';
  checks.push({
    name: 'FRONTEND_URL',
    status: hasFrontendUrl ? '✅' : '⚠️',
    value: frontendUrlValue,
    required: false,
  });

  // Check Database URL
  const hasDbUrl = !!process.env.DATABASE_URL;
  const dbUrlValue = hasDbUrl ? 'postgresql://***' : 'NOT SET';
  checks.push({
    name: 'DATABASE_URL',
    status: hasDbUrl ? '✅' : '❌',
    value: dbUrlValue,
    required: true,
  });
  if (!hasDbUrl) allGood = false;

  // Check JWT Secret
  const hasJwtSecret = !!process.env.JWT_SECRET;
  const jwtValue = hasJwtSecret ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'NOT SET';
  checks.push({
    name: 'JWT_SECRET',
    status: hasJwtSecret ? '✅' : '❌',
    value: jwtValue,
    required: true,
  });
  if (!hasJwtSecret) allGood = false;

  // Check PORT (should NOT be set for Render)
  const hasPort = !!process.env.PORT && process.env.PORT !== '';
  const portValue = hasPort ? process.env.PORT : 'NOT SET (correct)';
  checks.push({
    name: 'PORT',
    status: hasPort ? '⚠️' : '✅',
    value: portValue,
    required: false,
  });

  // Check NODE_ENV
  const nodeEnv = process.env.NODE_ENV || 'NOT SET';
  checks.push({
    name: 'NODE_ENV',
    status: nodeEnv === 'production' ? '✅' : '⚠️',
    value: nodeEnv,
    required: false,
  });

  // Display results
  console.log('\n📋 Environment Variables:\n');
  checks.forEach(check => {
    const required = check.required ? '(REQUIRED)' : '(optional)';
    console.log(`${check.status} ${check.name} ${required}`);
    console.log(`   Value: ${check.value}`);
    console.log('');
  });

  console.log('═'.repeat(60));
  
  if (allGood) {
    console.log('\n✅ ALL REQUIRED VARIABLES CONFIGURED!');
    console.log('   Payment system should work correctly.\n');
    return 0;
  } else {
    console.log('\n❌ MISSING REQUIRED VARIABLES!');
    console.log('   Payment system will NOT work until these are added.\n');
    console.log('📖 See: DO_THIS_NOW.md for instructions\n');
    return 1;
  }
};

// Run check
try {
  process.exit(checkConfig());
} catch (error) {
  console.error('\n❌ Error running config check:', error.message);
  process.exit(1);
}

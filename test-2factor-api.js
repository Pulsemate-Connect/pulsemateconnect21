#!/usr/bin/env node
/**
 * 2Factor SMS API Diagnostic Script
 * 
 * Tests your 2Factor API configuration to identify why OTPs aren't being sent.
 * 
 * Usage:
 *   node test-2factor-api.js
 *   node test-2factor-api.js +919876543210  (with phone number)
 */

const https = require('https');

// Configuration
const API_KEY = process.env.TWOFACTOR_API_KEY || '0f290349-865f-11f1-908b-0200cd936042';
const BASE_URL = 'https://2factor.in/API/V1';
const TEST_PHONE = process.argv[2]; // Get phone from command line

console.log('🔍 2Factor SMS API Diagnostic Tool\n');
console.log('═══════════════════════════════════════════\n');

// Color codes for terminal
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

function success(msg) {
  console.log(`${GREEN}✅ ${msg}${RESET}`);
}

function error(msg) {
  console.log(`${RED}❌ ${msg}${RESET}`);
}

function warning(msg) {
  console.log(`${YELLOW}⚠️  ${msg}${RESET}`);
}

function info(msg) {
  console.log(`${BLUE}ℹ️  ${msg}${RESET}`);
}

function step(msg) {
  console.log(`${CYAN}${msg}${RESET}`);
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function test1_CheckApiKey() {
  step('\n📋 Test 1: Checking API Key Configuration');
  console.log('   API Key:', API_KEY.substring(0, 10) + '...' + API_KEY.substring(API_KEY.length - 5));
  
  if (!API_KEY || API_KEY.length < 30) {
    error('API Key is invalid or too short');
    return false;
  }
  
  success('API Key format looks valid');
  return true;
}

async function test2_CheckBalance() {
  step('\n💰 Test 2: Checking Account Balance');
  
  const url = `${BASE_URL}/${API_KEY}/BAL/SMS`;
  info(`Request: GET ${url}`);
  
  try {
    const { status, data } = await httpGet(url);
    console.log('   Response Status:', status);
    console.log('   Response Data:', JSON.stringify(data, null, 2));
    
    if (status === 200 && data.Status === 'Success') {
      const balance = data.Details || 'Unknown';
      success(`Account balance: ${balance} credits`);
      
      if (balance === '0' || balance === '0 Credits') {
        error('Account has ZERO balance! Recharge at https://2factor.in');
        return false;
      }
      
      return true;
    } else if (status === 401 || status === 403) {
      error('Authentication failed! API Key is invalid or expired.');
      console.log('   Solution: Get a new API key from https://2factor.in/dashboard');
      return false;
    } else if (status === 402) {
      error('Payment required! Account balance is low or expired.');
      console.log('   Solution: Recharge your account at https://2factor.in');
      return false;
    } else {
      error(`API returned status ${status}`);
      return false;
    }
  } catch (err) {
    error(`Network error: ${err.message}`);
    console.log('   Check your internet connection');
    return false;
  }
}

async function test3_TestPhoneFormat() {
  step('\n📱 Test 3: Phone Number Format');
  
  if (!TEST_PHONE) {
    warning('No phone number provided. Skipping SMS test.');
    console.log('   To test SMS sending, run: node test-2factor-api.js +919876543210');
    return false;
  }
  
  info(`Testing phone: ${TEST_PHONE}`);
  
  // Validate format
  if (!/^\+91[6-9]\d{9}$/.test(TEST_PHONE)) {
    error('Invalid phone format!');
    console.log('   Expected: +91XXXXXXXXXX (Indian mobile number)');
    console.log('   Example: +919876543210');
    return false;
  }
  
  success('Phone format is valid');
  return true;
}

async function test4_SendTestOtp() {
  step('\n📨 Test 4: Sending Test OTP');
  
  if (!TEST_PHONE) {
    warning('No phone number provided. Skipping.');
    return false;
  }
  
  const phoneWithoutPlus = TEST_PHONE.replace('+', '');
  const url = `${BASE_URL}/${API_KEY}/SMS/${phoneWithoutPlus}/AUTOGEN`;
  
  info(`Request: GET ${url}`);
  console.log('   Sending OTP to:', TEST_PHONE);
  
  try {
    const { status, data } = await httpGet(url);
    console.log('   Response Status:', status);
    console.log('   Response Data:', JSON.stringify(data, null, 2));
    
    if (status === 200 && data.Status === 'Success') {
      const sessionId = data.Details;
      success('OTP sent successfully!');
      console.log(`   Session ID: ${sessionId}`);
      console.log(`   Check your phone (${TEST_PHONE}) for the SMS`);
      return true;
    } else if (status === 401 || status === 403) {
      error('Authentication failed!');
      return false;
    } else if (status === 402) {
      error('Account balance insufficient!');
      return false;
    } else if (status === 400) {
      error('Bad request - check phone number format');
      return false;
    } else {
      error(`API returned status ${status}`);
      console.log('   Message:', data.Details || data.message || 'Unknown error');
      return false;
    }
  } catch (err) {
    error(`Network error: ${err.message}`);
    return false;
  }
}

async function test5_CommonIssues() {
  step('\n🔍 Test 5: Common Issues Checklist');
  
  console.log('\n   Checklist:');
  console.log('   [ ] API Key is valid and active');
  console.log('   [ ] Account has sufficient balance');
  console.log('   [ ] Phone number is in +91XXXXXXXXXX format');
  console.log('   [ ] Phone number is NOT in DND (Do Not Disturb)');
  console.log('   [ ] Testing with a real mobile number (not landline)');
  console.log('   [ ] SMS gateway is not blocked by carrier');
  console.log('   [ ] Not exceeding rate limits (10 requests/15 min)');
}

async function runDiagnostics() {
  console.log('Starting diagnostics...\n');
  
  const result1 = await test1_CheckApiKey();
  const result2 = await test2_CheckBalance();
  const result3 = await test3_TestPhoneFormat();
  const result4 = await test4_SendTestOtp();
  await test5_CommonIssues();
  
  // Summary
  console.log('\n═══════════════════════════════════════════\n');
  console.log('📊 DIAGNOSTIC SUMMARY\n');
  
  const tests = [
    { name: 'API Key Format', passed: result1 },
    { name: 'Account Balance', passed: result2 },
    { name: 'Phone Format', passed: result3 },
    { name: 'Send OTP', passed: result4 },
  ];
  
  tests.forEach(test => {
    if (test.passed) {
      success(test.name);
    } else if (test.passed === false) {
      error(test.name);
    } else {
      warning(`${test.name} (skipped)`);
    }
  });
  
  console.log('\n═══════════════════════════════════════════\n');
  
  // Recommendations
  if (!result2) {
    console.log('🎯 IMMEDIATE ACTION REQUIRED:\n');
    error('Account balance is low or API key is invalid');
    console.log('\n   Solutions:');
    console.log('   1. Login to https://2factor.in/login');
    console.log('   2. Check account balance');
    console.log('   3. Recharge if balance is low');
    console.log('   4. Verify API key is active\n');
  } else if (result2 && result4) {
    console.log('🎉 SUCCESS!\n');
    success('2Factor API is working correctly');
    console.log('\n   If OTPs are still not received on mobile:');
    console.log('   1. Check if number has DND enabled');
    console.log('   2. Try with a different carrier (Airtel, Jio)');
    console.log('   3. Check backend logs for errors');
    console.log('   4. Verify backend environment variables\n');
  } else if (result2 && !TEST_PHONE) {
    console.log('ℹ️  NEXT STEPS:\n');
    info('API key and balance are OK. Test SMS sending with:');
    console.log(`\n   node test-2factor-api.js +919876543210\n`);
  }
  
  console.log('═══════════════════════════════════════════\n');
  console.log('📚 RESOURCES:\n');
  console.log('   Dashboard: https://2factor.in/login');
  console.log('   Docs: https://2factor.in/docs/');
  console.log('   Support: support@2factor.in\n');
}

// Run diagnostics
runDiagnostics().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});

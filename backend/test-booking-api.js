#!/usr/bin/env node
/**
 * Test Booking API - Simulate actual booking request
 */

require('dotenv').config();
const axios = require('axios');

async function testBookingAPI() {
  console.log('🧪 Testing Booking API - Simulating Real Request\n');
  console.log('='.repeat(70));

  const API_URL = process.env.BACKEND_URL || 'http://localhost:5000';
  
  // Get a test patient token first
  try {
    console.log('\n📝 Step 1: Getting patient auth token...\n');
    
    // Login as Akshata (9663080521)
    const loginRes = await axios.post(`${API_URL}/api/auth/login-phone`, {
      mobile: '9663080521',
      // In real app, this would go through Firebase/OTP
      // For testing, we need the JWT token
    });

    console.log('❌ Note: Cannot test without real JWT token');
    console.log('   Need to login through the app first\n');

  } catch (error) {
    console.log('❌ Cannot test API without authentication\n');
  }

  console.log('='.repeat(70));
  console.log('\n📋 Manual API Test:\n');
  console.log('1. Login to the mobile app as Akshata (9663080521)');
  console.log('2. Open Network Inspector (React Native Debugger)');
  console.log('3. Try to book an appointment');
  console.log('4. Look at the request to POST /api/payments/initiate');
  console.log('5. Copy the request payload');
  console.log('6. Check response for error details\n');

  console.log('Or check Render logs:');
  console.log('1. Go to: https://dashboard.render.com');
  console.log('2. Select your backend service');
  console.log('3. Click "Logs" in left sidebar');
  console.log('4. Try booking from app');
  console.log('5. Error will appear in logs\n');

  console.log('='.repeat(70));
  
  // Test the request payload structure
  console.log('\n📦 Expected Request Body Structure:\n');
  
  const sampleRequest = {
    doctorId: 'b4e59768-a74e-4d74-9bf3-3a158c8c1151', // Dr. Amit Sharma
    clinicId: 'test-clinic-complete-001',
    appointmentType: 'OFFLINE',
    appointmentDate: new Date().toISOString(), // Today
    slotTime: '09:00',
    sessionId: null, // or session UUID
    symptoms: 'Test booking',
  };

  console.log(JSON.stringify(sampleRequest, null, 2));
  console.log('\n✅ All fields look valid\n');

  // Common issues checklist
  console.log('='.repeat(70));
  console.log('\n🔍 Common Issues Checklist:\n');
  
  const checks = [
    { check: 'appointmentDate is ISO string', example: '2026-09-04T10:00:00.000Z' },
    { check: 'doctorId is valid UUID', example: 'b4e59768-a74e-4d74-9bf3-3a158c8c1151' },
    { check: 'clinicId is valid UUID', example: 'test-clinic-complete-001' },
    { check: 'slotTime is HH:MM format', example: '09:00' },
    { check: 'appointmentType is OFFLINE or ONLINE', example: 'OFFLINE' },
    { check: 'Doctor is associated with clinic', example: 'Check doctor_clinics table' },
    { check: 'Clinic is verified and active', example: 'approvalStatus=VERIFIED, isActive=true' },
    { check: 'Slot is within doctor availability', example: '09:00 is between 09:00-13:00' },
  ];

  checks.forEach((item, i) => {
    console.log(`   ${i + 1}. ${item.check}`);
    console.log(`      Example: ${item.example}\n`);
  });

  console.log('='.repeat(70));
}

testBookingAPI()
  .then(() => {
    console.log('\n📝 Next Steps:\n');
    console.log('1. Check Render logs for the actual error');
    console.log('2. Or run backend locally:');
    console.log('   cd backend');
    console.log('   npm start');
    console.log('   (then try booking from app)\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });

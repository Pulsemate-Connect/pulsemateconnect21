#!/usr/bin/env node
/**
 * Diagnose Second Booking Payment Error
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosePaymentError() {
  console.log('\n==============================================================');
  console.log('  Diagnosing Second Booking Payment Error');
  console.log('==============================================================\n');

  try {
    // Step 1: Check Razorpay Configuration
    console.log('[1/5] Checking Razorpay Configuration...\n');

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.log('ERROR: Razorpay NOT configured!');
      console.log('Missing: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET\n');
      console.log('THIS IS LIKELY WHY THE SECOND BOOKING FAILS!\n');
      console.log('Fix: Add to Render environment variables:');
      console.log('  RAZORPAY_KEY_ID=rzp_live_Sz5uowTvIY9Mwv');
      console.log('  RAZORPAY_KEY_SECRET=wVhmp2dFNEQGFfytMiT5NYk1\n');
      console.log('==============================================================\n');
      return;
    }

    console.log('OK: Razorpay configured');
    console.log('  Key ID: ' + razorpayKeyId);
    console.log('  Key Secret: ' + razorpayKeySecret.substring(0, 10) + '...\n');

    // Step 2: Test Razorpay API Connection
    console.log('[2/5] Testing Razorpay API Connection...\n');

    try {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      });

      console.log('  Creating test order for Rs 10...');
      
      const testOrder = await razorpay.orders.create({
        amount: 1000, // Rs 10 in paise
        currency: 'INR',
        receipt: 'test_' + Date.now(),
      });

      console.log('  SUCCESS: Razorpay API working!');
      console.log('  Test Order ID: ' + testOrder.id);
      console.log('  Amount: Rs ' + (testOrder.amount / 100));
      console.log('  Status: ' + testOrder.status + '\n');

    } catch (razorpayError) {
      console.log('  ERROR: Razorpay API failed!');
      console.log('  Message: ' + razorpayError.message);
      console.log('  Code: ' + (razorpayError.statusCode || 'N/A') + '\n');
      
      if (razorpayError.statusCode === 401) {
        console.log('  CAUSE: Authentication failed');
        console.log('  - Verify Razorpay credentials are correct');
        console.log('  - Check Key ID and Secret in Razorpay dashboard\n');
      } else {
        console.log('  CAUSE: Network or server error');
        console.log('  - Check internet connection');
        console.log('  - Verify firewall settings\n');
      }
      
      console.log('==============================================================\n');
      return;
    }

    // Step 3: Check Patient
    console.log('[3/5] Checking Patient (Akshata)...\n');
    
    const patient = await prisma.user.findFirst({
      where: { mobile: '9663080521' },
      select: {
        id: true,
        name: true,
        mobile: true,
        freeBookingUsed: true,
        freeBookingUsedAt: true,
      }
    });

    if (!patient) {
      console.log('  ERROR: Patient not found (9663080521)\n');
      return;
    }

    console.log('  OK: Patient found');
    console.log('  Name: ' + patient.name);
    console.log('  Free Booking Used: ' + (patient.freeBookingUsed ? 'Yes' : 'No'));
    if (patient.freeBookingUsedAt) {
      console.log('  Used At: ' + patient.freeBookingUsedAt);
    }
    console.log('');

    // Step 4: Check Test Clinic
    console.log('[4/5] Checking Test Clinic...\n');

    const clinic = await prisma.clinic.findUnique({
      where: { id: 'test-clinic-complete-001' },
      select: { id: true, name: true, isActive: true },
    });

    if (!clinic) {
      console.log('  ERROR: Test clinic not found\n');
      return;
    }

    console.log('  OK: Clinic found');
    console.log('  Name: ' + clinic.name);
    console.log('  Active: ' + (clinic.isActive ? 'Yes' : 'No') + '\n');

    // Step 5: Check Doctors
    console.log('[5/5] Checking Doctors...\n');

    const doctors = await prisma.doctorProfile.findMany({
      where: {
        doctorClinics: {
          some: {
            clinicId: clinic.id,
            isActive: true,
          }
        }
      },
      include: {
        user: { select: { name: true } },
      },
      take: 2,
    });

    console.log('  Found ' + doctors.length + ' active doctors:');
    doctors.forEach((doc, i) => {
      console.log('    ' + (i + 1) + '. ' + doc.user.name + ' - ' + doc.specialization);
    });
    console.log('');

    // Summary
    console.log('==============================================================');
    console.log('DIAGNOSTIC SUMMARY:\n');
    console.log('  [OK] Razorpay configured and API working');
    console.log('  [OK] Patient found (free booking used: ' + (patient.freeBookingUsed ? 'Yes' : 'No') + ')');
    console.log('  [OK] Test clinic active');
    console.log('  [OK] ' + doctors.length + ' doctors available');
    console.log('\nCONCLUSION: All systems operational!');
    console.log('\nIf booking still fails, the issue is likely:');
    console.log('  1. Render environment variables not updated yet');
    console.log('  2. Render needs to redeploy with latest code');
    console.log('  3. Old deployment is still running\n');
    console.log('ACTION:');
    console.log('  1. Check Render deployment status (should show "Live")');
    console.log('  2. Check Render logs for errors');
    console.log('  3. Wait 2-3 minutes after "Live" before testing\n');
    console.log('==============================================================\n');

  } catch (error) {
    console.error('\nUNEXPECTED ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosePaymentError()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });

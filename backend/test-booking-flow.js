#!/usr/bin/env node
/**
 * Test Booking Flow - Diagnose payment issues
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBookingFlow() {
  console.log('🧪 Testing Booking Flow\n');
  console.log('='.repeat(70));

  try {
    // Test patient (Akshata)
    const patient = await prisma.user.findFirst({
      where: {
        mobile: { contains: '9663080521' },
        role: 'PATIENT',
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        freeBookingUsed: true,
        freeBookingUsedAt: true,
      },
    });

    if (!patient) {
      console.log('❌ Test patient not found\n');
      return;
    }

    console.log('\n📋 Patient Info:');
    console.log(`   Name: ${patient.name || 'Unknown'}`);
    console.log(`   Mobile: ${patient.mobile}`);
    console.log(`   Free Booking Used: ${patient.freeBookingUsed ? 'YES ✅' : 'NO ❌'}`);
    if (patient.freeBookingUsedAt) {
      console.log(`   Used At: ${patient.freeBookingUsedAt.toLocaleString()}`);
    }

    // Check if test clinic exists
    const clinic = await prisma.clinic.findUnique({
      where: { id: 'test-clinic-complete-001' },
      select: {
        id: true,
        name: true,
        isVerified: true,
        approvalStatus: true,
        isActive: true,
      },
    });

    if (!clinic) {
      console.log('\n❌ Test clinic not found');
      console.log('   Run: node backend/create-test-clinic-complete.js\n');
      return;
    }

    console.log('\n🏥 Test Clinic:');
    console.log(`   Name: ${clinic.name}`);
    console.log(`   Status: ${clinic.approvalStatus} (${clinic.isActive ? 'Active' : 'Inactive'})`);
    console.log(`   Verified: ${clinic.isVerified ? 'YES ✅' : 'NO ❌'}`);

    // Get test doctors
    const doctors = await prisma.doctorProfile.findMany({
      where: {
        doctorClinics: {
          some: {
            clinicId: clinic.id,
            isActive: true,
          },
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        doctorClinics: {
          where: { clinicId: clinic.id },
          select: {
            consultationFee: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      take: 2,
    });

    console.log(`\n👨‍⚕️ Available Doctors: ${doctors.length}`);
    doctors.forEach((doc, index) => {
      const schedule = doc.doctorClinics[0];
      console.log(`\n   ${index + 1}. ${doc.user.name}`);
      console.log(`      Email: ${doc.user.email}`);
      console.log(`      Fee: ₹${schedule.consultationFee}`);
      console.log(`      Time: ${schedule.startTime} - ${schedule.endTime}`);
    });

    // Check recent appointments for this patient
    const recentAppointments = await prisma.appointment.findMany({
      where: {
        patientId: patient.id,
      },
      include: {
        doctor: {
          include: {
            user: { select: { name: true } },
          },
        },
        clinic: {
          select: { name: true },
        },
        payment: {
          select: {
            amount: true,
            status: true,
            method: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    console.log(`\n📅 Recent Appointments: ${recentAppointments.length}`);
    recentAppointments.forEach((appt, index) => {
      console.log(`\n   ${index + 1}. ${appt.appointmentDate.toLocaleDateString()}`);
      console.log(`      Doctor: ${appt.doctor.user.name}`);
      console.log(`      Clinic: ${appt.clinic.name}`);
      console.log(`      Status: ${appt.status}`);
      console.log(`      Slot: ${appt.slotTime || 'Walk-in'}`);
      if (appt.payment) {
        console.log(`      Payment: ₹${appt.payment.amount} (${appt.payment.status})`);
      } else {
        console.log(`      Payment: NO PAYMENT RECORD ❌`);
      }
    });

    // Test scenario
    console.log('\n\n' + '='.repeat(70));
    console.log('\n📊 BOOKING STATUS:\n');

    if (patient.freeBookingUsed) {
      console.log('   ✅ Patient has used free booking');
      console.log('   💰 Next booking will require payment (₹10 platform fee + consultation fee)');
      console.log('\n   Expected Flow:');
      console.log('   1. User selects doctor & slot');
      console.log('   2. App calls POST /api/payments/initiate');
      console.log('   3. Backend creates appointment with status=PENDING_PAYMENT');
      console.log('   4. Backend creates Razorpay order');
      console.log('   5. App opens Razorpay payment gateway');
      console.log('   6. User completes payment');
      console.log('   7. App calls POST /api/payments/verify');
      console.log('   8. Backend confirms appointment → status=BOOKED');
    } else {
      console.log('   🆓 Patient eligible for FREE first booking');
      console.log('   ✅ No payment required');
      console.log('\n   Expected Flow:');
      console.log('   1. User selects doctor & slot');
      console.log('   2. App calls POST /api/payments/initiate');
      console.log('   3. Backend creates appointment with status=BOOKED');
      console.log('   4. Backend marks freeBookingUsed=true');
      console.log('   5. App shows success (no payment gateway)');
    }

    // Check Razorpay config
    console.log('\n\n' + '='.repeat(70));
    console.log('\n🔑 Razorpay Configuration:\n');
    
    const hasRazorpayKey = !!process.env.RAZORPAY_KEY_ID;
    const hasRazorpaySecret = !!process.env.RAZORPAY_KEY_SECRET;
    
    console.log(`   RAZORPAY_KEY_ID: ${hasRazorpayKey ? 'SET ✅' : 'NOT SET ❌'}`);
    console.log(`   RAZORPAY_KEY_SECRET: ${hasRazorpaySecret ? 'SET ✅' : 'NOT SET ❌'}`);
    
    if (!hasRazorpayKey || !hasRazorpaySecret) {
      console.log('\n   ⚠️  WARNING: Razorpay credentials not configured!');
      console.log('   System will use DEV MODE for payments');
      console.log('   Dev mode auto-verifies payments without real Razorpay');
    } else {
      console.log('\n   ✅ Razorpay properly configured');
      console.log('   System will use PRODUCTION MODE for payments');
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Diagnosis complete\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testBookingFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

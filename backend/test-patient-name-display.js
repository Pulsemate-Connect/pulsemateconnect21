#!/usr/bin/env node
/**
 * Test Patient Name Display in Admin Panel
 * Verify that patientName is shown instead of user.name for patients
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPatientNameDisplay() {
  console.log('🧪 Testing Patient Name Display\n');
  console.log('=' .repeat(70));

  try {
    // Find the patient with mobile 9663080521 (Akshata from screenshot)
    const patient = await prisma.user.findFirst({
      where: { 
        mobile: { contains: '9663080521' },
        role: 'PATIENT',
      },
      include: {
        patientProfile: true,
      },
    });

    if (!patient) {
      console.log('❌ Patient not found with mobile 9663080521\n');
      return;
    }

    console.log('\n📋 Patient Record Found:');
    console.log('   User ID:', patient.id);
    console.log('   Mobile:', patient.mobile);
    console.log('   Role:', patient.role);
    console.log('');
    console.log('🔍 Name Data:');
    console.log('   user.name:', patient.name || '(NULL)');
    console.log('   patientProfile.patientName:', patient.patientProfile?.patientName || '(NULL)');
    console.log('');
    console.log('✅ Display Logic:');
    
    const displayName = patient.role === 'PATIENT' && patient.patientProfile?.patientName 
      ? patient.patientProfile.patientName 
      : patient.name;
    
    console.log('   Name to show in admin:', displayName);
    console.log('');

    if (displayName === 'Akshata' || patient.patientProfile?.patientName === 'Akshata') {
      console.log('✅ SUCCESS: Patient name "Akshata" will be displayed correctly!\n');
    } else if (!displayName || displayName === 'Unknown') {
      console.log('⚠️  WARNING: Name is still showing as "Unknown" or empty');
      console.log('   This means patientProfile.patientName needs to be set.\n');
    } else {
      console.log(`✅ Name will display as: "${displayName}"\n`);
    }

    // Test the search functionality
    console.log('🔍 Testing Search by Patient Name:\n');
    
    const searchResults = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'Akshata', mode: 'insensitive' } },
          { patientProfile: { patientName: { contains: 'Akshata', mode: 'insensitive' } } },
        ],
      },
      include: {
        patientProfile: {
          select: { patientName: true },
        },
      },
      take: 5,
    });

    console.log(`   Found ${searchResults.length} result(s) searching for "Akshata"`);
    searchResults.forEach((user, index) => {
      const displayName = user.role === 'PATIENT' && user.patientProfile?.patientName 
        ? user.patientProfile.patientName 
        : user.name;
      console.log(`   ${index + 1}. ${displayName} (${user.mobile}) - Role: ${user.role}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testPatientNameDisplay()
  .then(() => {
    console.log('=' .repeat(70));
    console.log('✅ Test completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

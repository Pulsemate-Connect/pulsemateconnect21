const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addPatientNameField() {
  try {
    console.log('\n=== Adding patientName Field to Patient Profiles ===\n');

    // Add the column to the database
    await prisma.$executeRawUnsafe(`
      ALTER TABLE patient_profiles 
      ADD COLUMN IF NOT EXISTS "patientName" TEXT;
    `);

    console.log('✅ Added patientName column to patient_profiles table');
    console.log('');
    console.log('📋 What this means:');
    console.log('   - Patient profile name is now separate from user.name');
    console.log('   - Admins/Doctors using patient app will see "You" until they set their patient name');
    console.log('   - Patient name is stored in patient_profiles.patientName');
    console.log('   - User table name (admin/doctor identity) remains unchanged');
    console.log('');
    console.log('✨ Benefits:');
    console.log('   - Patient identity is independent from staff identity');
    console.log('   - Admin "Sahil Naik" can have patient profile "Rahul Kumar"');
    console.log('   - Doctor "Dr. Amit" can have patient profile "Amit Verma"');
    console.log('   - Complete separation of concerns');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addPatientNameField();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestPatient() {
  try {
    console.log('\n=== CREATING TEST PATIENT ===\n');
    
    const mobile = '+919999999999';
    const email = 'test.patient@example.com';
    
    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile }, { email }] }
    });
    
    if (existing) {
      console.log('✅ Test patient already exists:');
      console.log(`   Mobile: ${existing.mobile}`);
      console.log(`   Email: ${existing.email}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Role: ${existing.role}`);
      console.log('\n📱 Login with mobile: 9999999999');
      console.log('🔐 OTP: 123456 (test OTP)\n');
      return;
    }
    
    // Create new patient
    const user = await prisma.user.create({
      data: {
        mobile,
        email,
        name: 'Test Patient',
        role: 'PATIENT',
        approvalStatus: 'VERIFIED',
        isActive: true,
        isPhoneVerified: true,
        isEmailVerified: true,
      }
    });
    
    // Create patient profile
    await prisma.patientProfile.create({
      data: {
        userId: user.id,
        gender: 'MALE',
        age: 25,
        city: 'Bangalore',
        emergencyContact: '+919988776655',
        bloodGroup: 'O+',
        profileCompleted: true,
      }
    });
    
    console.log('✅ Test patient created successfully!\n');
    console.log('📋 Account Details:');
    console.log(`   Mobile: ${mobile}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: Test Patient`);
    console.log(`   Role: PATIENT`);
    console.log('\n📱 To login in the app:');
    console.log('   1. Click "Login" in the Profile tab');
    console.log('   2. Enter mobile: 9999999999');
    console.log('   3. Enter OTP: 123456');
    console.log('\n✨ Now you can:');
    console.log('   - Edit your profile');
    console.log('   - Book appointments');
    console.log('   - View appointments');
    console.log('   - All patient features\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPatient();
